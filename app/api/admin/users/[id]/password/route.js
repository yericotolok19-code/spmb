import bcrypt from "bcryptjs";
import db from "../../../../../../lib/db";
import { getSession } from "../../../../../../lib/auth";

export async function POST(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return Response.json({ message: "Akses hanya untuk administrator." }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return Response.json({ message: "ID akun tidak valid." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Data password tidak valid." }, { status: 400 });
  }

  const password = body && typeof body === "object" && !Array.isArray(body)
    ? body.password
    : undefined;
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return Response.json(
      { message: "Kata sandi baru wajib minimal 8 karakter dan maksimal 72 byte." },
      { status: 400 }
    );
  }

  try {
    const [users] = await db.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [id]);
    if (users.length === 0) {
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [passwordHash, id]);
    return Response.json({ message: "Password akun berhasil direset." });
  } catch (error) {
    console.error("Admin password reset error:", error);
    return Response.json({ message: "Password gagal direset." }, { status: 500 });
  }
}
