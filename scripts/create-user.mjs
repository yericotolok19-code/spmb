
import "dotenv/config";
import db from "../lib/db.js";
import bcrypt from "bcryptjs";

async function createUser() {
  const nama = process.argv[2]?.trim();
  const email = process.argv[3]?.trim().toLowerCase();
  const role = process.argv[4];
  const password = process.env.INITIAL_USER_PASSWORD;

  if (
    !nama ||
    !email ||
    !["admin", "kepsek"].includes(role) ||
    !password ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new Error(
      "Periksa nama, email, role, dan password di environment."
    );
  }

  const [existing] = await db.execute(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );

  if (existing.length > 0) {
    throw new Error("Email sudah terdaftar.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await db.execute(
    `INSERT INTO users (nama, email, password, role)
     VALUES (?, ?, ?, ?)`,
    [nama, email, hashedPassword, role]
  );

  console.log(`Akun ${role} berhasil dibuat.`);
}

createUser()
  .catch((error) => {
    console.error("Gagal membuat akun:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
