import db from "../../../../../lib/db";
import { findConflictingAccount, parseAccountDetails } from "../../../../../lib/admin-users";
import { getSession } from "../../../../../lib/auth";

function parseUserId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function requireAdmin() {
  const session = await getSession();
  return session?.role === "admin" ? session : null;
}

export async function PATCH(request, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ message: "Akses hanya untuk administrator." }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseUserId(rawId);
  if (!id) {
    return Response.json({ message: "ID akun tidak valid." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Data akun tidak valid." }, { status: 400 });
  }
  const parsed = parseAccountDetails(body);
  if (parsed.error) {
    return Response.json({ message: parsed.error }, { status: 400 });
  }
  if (String(session.sub) === String(id) && parsed.account.role !== "admin") {
    return Response.json({ message: "Role akun administrator yang sedang digunakan tidak dapat diubah." }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [currentRows] = await connection.execute(
      "SELECT id, role FROM users WHERE id = ? FOR UPDATE",
      [id]
    );
    const current = currentRows[0];
    if (!current) {
      await connection.rollback();
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    if (current.role === "admin" && parsed.account.role !== "admin") {
      const [admins] = await connection.execute(
        "SELECT id FROM users WHERE role = 'admin' FOR UPDATE"
      );
      if (admins.length <= 1) {
        await connection.rollback();
        return Response.json({ message: "Role administrator terakhir tidak dapat dihapus." }, { status: 409 });
      }
    }

    if (await findConflictingAccount(connection, parsed.account, id)) {
      await connection.rollback();
      return Response.json(
        { message: "Email atau nomor HP sudah digunakan akun lain." },
        { status: 409 }
      );
    }

    await connection.execute(
      `UPDATE users
       SET nama = ?, email = ?, phone = ?, role = ?
       WHERE id = ?`,
      [parsed.account.nama, parsed.account.email, parsed.account.phone, parsed.account.role, id]
    );
    await connection.commit();
    return Response.json({ message: "Perubahan akun berhasil disimpan." });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return Response.json(
        { message: "Email atau nomor HP sudah digunakan akun lain." },
        { status: 409 }
      );
    }
    console.error("Admin user update error:", error);
    return Response.json({ message: "Perubahan akun gagal disimpan." }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function DELETE(_request, { params }) {
  const session = await requireAdmin();
  if (!session) {
    return Response.json({ message: "Akses hanya untuk administrator." }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = parseUserId(rawId);
  if (!id) {
    return Response.json({ message: "ID akun tidak valid." }, { status: 400 });
  }
  if (String(session.sub) === String(id)) {
    return Response.json({ message: "Anda tidak dapat menghapus akun yang sedang digunakan." }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [currentRows] = await connection.execute(
      "SELECT id, role FROM users WHERE id = ? FOR UPDATE",
      [id]
    );
    const current = currentRows[0];
    if (!current) {
      await connection.rollback();
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    if (current.role === "admin") {
      const [admins] = await connection.execute(
        "SELECT id FROM users WHERE role = 'admin' FOR UPDATE"
      );
      if (admins.length <= 1) {
        await connection.rollback();
        return Response.json({ message: "Administrator terakhir tidak dapat dihapus." }, { status: 409 });
      }
    }

    await connection.execute("DELETE FROM users WHERE id = ?", [id]);
    await connection.commit();
    return Response.json({ message: "Akun beserta data terkait berhasil dihapus." });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return Response.json(
        { message: "Akun ini masih tercatat sebagai penulis pengumuman dan tidak dapat dihapus." },
        { status: 409 }
      );
    }
    console.error("Admin user deletion error:", error);
    return Response.json({ message: "Akun gagal dihapus." }, { status: 500 });
  } finally {
    connection.release();
  }
}
