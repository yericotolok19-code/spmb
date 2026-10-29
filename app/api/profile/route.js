import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import db from "../../../lib/db";
import { accountRoles, findConflictingAccount, parseAccountDetails } from "../../../lib/admin-users";
import { getSession } from "../../../lib/auth";

function responseWithSession(message, user, token) {
  const response = Response.json({ message, user });
  response.headers.append(
    "Set-Cookie",
    [
      `spmb_session=${token}`,
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=28800",
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ")
  );
  return response;
}

export async function GET() {
  const session = await getSession();
  if (!session?.sub) return Response.json({ message: "Sesi tidak valid." }, { status: 401 });

  try {
    const [users] = await db.execute(
      `SELECT id, nama, email, phone, role,
              (avatar_data IS NOT NULL AND avatar_mime_type IS NOT NULL) AS hasAvatar
       FROM users WHERE id = ? LIMIT 1`,
      [session.sub]
    );
    if (!users[0]) return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    return Response.json({ user: users[0] });
  } catch (error) {
    console.error("Profile load error:", error);
    return Response.json({ message: "Profil gagal dimuat." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session?.sub) return Response.json({ message: "Sesi tidak valid." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Data profil tidak valid." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ message: "Data profil tidak valid." }, { status: 400 });
  }

  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return Response.json({ message: "Konfigurasi sesi belum tersedia." }, { status: 500 });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, nama, email, phone, password, role FROM users WHERE id = ? FOR UPDATE",
      [session.sub]
    );
    const currentUser = rows[0];
    if (!currentUser) {
      await connection.rollback();
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    if (!accountRoles.includes(currentUser.role)) {
      await connection.rollback();
      return Response.json({ message: "Role akun tidak valid." }, { status: 403 });
    }

    const parsed = parseAccountDetails({ ...body, role: currentUser.role });
    if (parsed.error) {
      await connection.rollback();
      return Response.json({ message: parsed.error }, { status: 400 });
    }

    if (await findConflictingAccount(connection, parsed.account, currentUser.id)) {
      await connection.rollback();
      return Response.json({ message: "Email atau nomor HP sudah digunakan akun lain." }, { status: 409 });
    }

    let passwordHash = currentUser.password;
    if (body.newPassword !== undefined && body.newPassword !== "") {
      if (typeof body.currentPassword !== "string" || !(await bcrypt.compare(body.currentPassword, currentUser.password))) {
        await connection.rollback();
        return Response.json({ message: "Password saat ini tidak sesuai." }, { status: 400 });
      }
      if (
        typeof body.newPassword !== "string" ||
        body.newPassword.length < 8 ||
        Buffer.byteLength(body.newPassword, "utf8") > 72
      ) {
        await connection.rollback();
        return Response.json({ message: "Password baru wajib minimal 8 karakter dan maksimal 72 byte." }, { status: 400 });
      }
      if (body.confirmPassword !== body.newPassword) {
        await connection.rollback();
        return Response.json({ message: "Konfirmasi password baru tidak sama." }, { status: 400 });
      }
      passwordHash = await bcrypt.hash(body.newPassword, 12);
    }

    const user = {
      id: currentUser.id,
      nama: parsed.account.nama,
      email: parsed.account.email,
      phone: parsed.account.phone,
      role: currentUser.role,
    };
    const token = await new SignJWT({ nama: user.nama, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(secret));

    await connection.execute(
      "UPDATE users SET nama = ?, email = ?, phone = ?, password = ? WHERE id = ?",
      [user.nama, user.email, user.phone, passwordHash, user.id]
    );
    await connection.commit();
    return responseWithSession("Profil berhasil diperbarui.", user, token);
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Profile rollback error:", rollbackError);
      }
    }
    if (error.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "Email atau nomor HP sudah digunakan akun lain." }, { status: 409 });
    }
    console.error("Profile update error:", error);
    return Response.json({ message: "Profil gagal diperbarui." }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
