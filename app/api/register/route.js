
import db from "../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const body = await request.json();
    const identity = typeof body.identity === "string" ? body.identity.trim() : "";
    const password = body.password;
    const isEmail = /^\S+@\S+\.\S+$/.test(identity);
    const phone = identity.replace(/[^\d+]/g, "");
    const validPhone = /^(08|628)\d{8,11}$/.test(phone);

    if (
      (!isEmail && !validPhone) ||
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return Response.json(
        { message: "Masukkan email atau nomor HP yang valid dan kata sandi minimal 8 karakter." },
        { status: 400 }
      );
    }

    const email = isEmail ? identity.toLowerCase() : null;
    const normalizedPhone = isEmail ? null : phone.replace(/^08/, "628");
    const [existing] = await db.execute(
      `SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [email, normalizedPhone]
    );

    if (existing.length > 0) {
      return Response.json(
        { message: "Email atau nomor HP sudah terdaftar." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await db.execute(
      `INSERT INTO users (nama, email, phone, password, role)
       VALUES (?, ?, ?, ?, 'calon_siswa')`,
      ["Akun SPMB", email, normalizedPhone, hashedPassword]
    );

    return Response.json(
      { message: "Pendaftaran berhasil. Silakan masuk." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { message: "Pendaftaran gagal karena terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
