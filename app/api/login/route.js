import db from "../../../lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const validRoles = ["calon_siswa", "admin", "kepsek"];

export async function POST(request) {
  try {
    const body = await request.json();
    const identity = typeof body.id === "string" ? body.id.trim() : "";
    const password = body.password;

    if (!identity || typeof password !== "string" || !password) {
      return Response.json(
        { message: "Email/NISN dan password wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedIdentity = identity.toLowerCase();
    const normalizedPhone = identity.replace(/[^\d+]/g, "").replace(/^08/, "628");
    const [rows] = await db.execute(
      `SELECT id, nama, email, phone, password, role
       FROM users
       WHERE email = ? OR phone = ?
       LIMIT 1`,
      [normalizedIdentity, normalizedPhone]
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return Response.json(
        { message: "Email/nomor HP atau password salah." },
        { status: 401 }
      );
    }

    if (!validRoles.includes(user.role)) {
      return Response.json(
        { message: "Role akun tidak dikenali." },
        { status: 403 }
      );
    }

    const secret = process.env.SESSION_SECRET;
    if (!secret || secret.length < 32) {
      return Response.json(
        { message: "Konfigurasi sesi belum tersedia." },
        { status: 500 }
      );
    }

    const token = await new SignJWT({
      nama: user.nama,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(user.id))
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(secret));

    const response = Response.json({
      message: "Login berhasil.",
      user: {
        id: user.id,
        nama: user.nama,
        role: user.role,
      },
    });

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
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}