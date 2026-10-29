import db from "../../../../lib/db";
import { getSession } from "../../../../lib/auth";

const maximumAvatarSize = 3 * 1024 * 1024;

function identifyImage(data) {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    return "image/jpeg";
  }
  if (data.length >= 8 && data.readUInt32BE(0) === 0x89504e47) {
    return "image/png";
  }
  if (
    data.length >= 12 &&
    data.toString("ascii", 0, 4) === "RIFF" &&
    data.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export async function GET() {
  const session = await getSession();
  if (!session?.sub) return Response.json({ message: "Sesi tidak valid." }, { status: 401 });

  try {
    const [rows] = await db.execute(
      "SELECT avatar_data, avatar_mime_type FROM users WHERE id = ? LIMIT 1",
      [session.sub]
    );
    if (!rows[0]) return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    if (!rows[0].avatar_data || !["image/jpeg", "image/png", "image/webp"].includes(rows[0].avatar_mime_type)) {
      return Response.json({ message: "Foto profil belum diatur." }, { status: 404 });
    }

    return new Response(rows[0].avatar_data, {
      headers: {
        "Content-Type": rows[0].avatar_mime_type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Profile avatar load error:", error);
    return Response.json({ message: "Foto profil gagal dimuat." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session?.sub) return Response.json({ message: "Sesi tidak valid." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
      return Response.json({ message: "Pilih foto profil terlebih dahulu." }, { status: 400 });
    }
    if (file.size > maximumAvatarSize) {
      return Response.json({ message: "Ukuran foto profil maksimal 3 MB." }, { status: 413 });
    }

    const imageData = Buffer.from(await file.arrayBuffer());
    const mimeType = identifyImage(imageData);
    if (!mimeType || file.type !== mimeType) {
      return Response.json({ message: "Foto harus berupa gambar JPG, PNG, atau WEBP yang valid." }, { status: 400 });
    }

    const [result] = await db.execute(
      "UPDATE users SET avatar_data = ?, avatar_mime_type = ? WHERE id = ?",
      [imageData, mimeType, session.sub]
    );
    if (result.affectedRows === 0) {
      const [users] = await db.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [session.sub]);
      if (!users[0]) return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    return Response.json({ message: "Foto profil berhasil diperbarui." });
  } catch (error) {
    console.error("Profile avatar update error:", error);
    return Response.json({ message: "Foto profil gagal diperbarui." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.sub) return Response.json({ message: "Sesi tidak valid." }, { status: 401 });

  try {
    const [result] = await db.execute(
      "UPDATE users SET avatar_data = NULL, avatar_mime_type = NULL WHERE id = ?",
      [session.sub]
    );
    if (result.affectedRows === 0) {
      const [users] = await db.execute("SELECT id FROM users WHERE id = ? LIMIT 1", [session.sub]);
      if (!users[0]) return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }
    return Response.json({ message: "Foto profil dihapus." });
  } catch (error) {
    console.error("Profile avatar delete error:", error);
    return Response.json({ message: "Foto profil gagal dihapus." }, { status: 500 });
  }
}
