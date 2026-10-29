import db from "../../../../lib/db";
import { getRoleSession } from "../../../../lib/student-dashboard";

const validLevels = ["SMP Citra Negara", "SMA Citra Negara", "SMK Citra Negara"];

export async function POST(request) {
  const session = await getRoleSession("calon_siswa");
  if (!session) {
    return Response.json({ message: "Sesi tidak valid." }, { status: 401 });
  }

  const body = await request.json();
  const nama = typeof body.nama === "string" ? body.nama.trim() : "";
  const nisn = typeof body.nisn === "string" ? body.nisn.trim() : "";
  const jenjang = typeof body.jenjang === "string" ? body.jenjang.trim() : "";
  if (!nama || nama.length > 255 || !/^\d{10}$/.test(nisn) || !validLevels.includes(jenjang)) {
    return Response.json({ message: "Isi nama siswa, NISN 10 digit, dan jenjang yang valid." }, { status: 400 });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [profileResult] = await connection.execute(
      `INSERT INTO student_profiles (user_id, nama, nisn, jenjang)
       VALUES (?, ?, ?, ?)`,
      [session.userId, nama, nisn, jenjang]
    );
    const studentId = profileResult.insertId;
    const registrationCode = `CN-${new Date().getFullYear()}-${String(studentId).padStart(6, "0")}`;
    await connection.execute(
      `INSERT INTO student_applications (student_id, registration_code)
       VALUES (?, ?)`,
      [studentId, registrationCode]
    );
    await connection.commit();
    return Response.json(
      { message: "Data siswa berhasil ditambahkan.", studentId },
      { status: 201 }
    );
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return Response.json({ message: "NISN sudah terdaftar." }, { status: 409 });
    }
    console.error("Create student registration error:", error);
    return Response.json({ message: "Pendaftaran siswa gagal dibuat." }, { status: 500 });
  } finally {
    connection.release();
  }
}
