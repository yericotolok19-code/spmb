import bcrypt from "bcryptjs";
import db from "../../../../lib/db";
import {
  findConflictingAccount,
  parseAccountDetails,
} from "../../../../lib/admin-users";
import { getSession } from "../../../../lib/auth";

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "admin" ? session : null;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ message: "Akses hanya untuk administrator." }, { status: 403 });
  }

  try {
    const [users] = await db.execute(
      `SELECT u.id, u.nama, u.email, u.phone, u.role, u.created_at,
              COUNT(DISTINCT p.id) AS student_count
       FROM users u
       LEFT JOIN student_profiles p ON p.user_id = u.id
       GROUP BY u.id, u.nama, u.email, u.phone, u.role, u.created_at
       ORDER BY u.created_at DESC, u.id DESC`
    );
    return Response.json({ users });
  } catch (error) {
    console.error("Admin user list error:", error);
    return Response.json({ message: "Daftar akun gagal dimuat." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ message: "Akses hanya untuk administrator." }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Data akun tidak valid." }, { status: 400 });
  }

  const parsed = parseAccountDetails(body);
  const password = body && typeof body === "object" && !Array.isArray(body)
    ? body.password
    : undefined;
  if (parsed.error) {
    return Response.json({ message: parsed.error }, { status: 400 });
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return Response.json(
      { message: "Kata sandi awal wajib minimal 8 karakter dan maksimal 72 byte." },
      { status: 400 }
    );
  }

  try {
    if (await findConflictingAccount(db, parsed.account)) {
      return Response.json(
        { message: "Email atau nomor HP sudah digunakan akun lain." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      `INSERT INTO users (nama, email, phone, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [parsed.account.nama, parsed.account.email, parsed.account.phone, passwordHash, parsed.account.role]
    );

    return Response.json(
      { message: "Akun berhasil dibuat.", userId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return Response.json(
        { message: "Email atau nomor HP sudah digunakan akun lain." },
        { status: 409 }
      );
    }
    console.error("Admin user creation error:", error);
    return Response.json({ message: "Akun gagal dibuat." }, { status: 500 });
  }
}
