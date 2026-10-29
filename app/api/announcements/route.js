import db from "../../../lib/db";
import { getSession } from "../../../lib/auth";

const staffRoles = ["admin", "kepsek"];

export async function GET() {
  const session = await getSession();
  if (!session || !staffRoles.includes(session.role)) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const [announcements] = await db.execute(
    `SELECT a.id, a.title, a.message, a.created_at, u.nama AS author
     FROM announcements a
     INNER JOIN users u ON u.id = a.author_user_id
     ORDER BY a.created_at DESC`
  );
  return Response.json({ announcements });
}

export async function POST(request) {
  const session = await getSession();
  const authorId = Number(session?.sub);
  if (!session || !staffRoles.includes(session.role) || !Number.isSafeInteger(authorId)) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!title || title.length > 160 || !message || message.length > 3000) {
    return Response.json({ message: "Judul wajib diisi (maks. 160 karakter) dan isi wajib diisi (maks. 3.000 karakter)." }, { status: 400 });
  }

  await db.execute(
    "INSERT INTO announcements (title, message, author_user_id) VALUES (?, ?, ?)",
    [title, message, authorId]
  );
  return Response.json({ message: "Pengumuman berhasil diterbitkan." }, { status: 201 });
}

export async function PATCH(request) {
  const session = await getSession();
  if (!session || !staffRoles.includes(session.role)) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const body = await request.json();
  const id = Number(body.id);
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!Number.isSafeInteger(id) || id < 1 || !title || title.length > 160 || !message || message.length > 3000) {
    return Response.json({ message: "Data pengumuman tidak valid." }, { status: 400 });
  }

  const [result] = await db.execute(
    "UPDATE announcements SET title = ?, message = ? WHERE id = ?",
    [title, message, id]
  );
  if (result.affectedRows === 0) {
    return Response.json({ message: "Pengumuman tidak ditemukan." }, { status: 404 });
  }
  return Response.json({ message: "Pengumuman berhasil diperbarui." });
}

export async function DELETE(request) {
  const session = await getSession();
  if (!session || !staffRoles.includes(session.role)) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json({ message: "Pengumuman tidak valid." }, { status: 400 });
  }

  const [result] = await db.execute("DELETE FROM announcements WHERE id = ?", [id]);
  if (result.affectedRows === 0) {
    return Response.json({ message: "Pengumuman tidak ditemukan." }, { status: 404 });
  }
  return Response.json({ message: "Pengumuman berhasil dihapus." });
}
