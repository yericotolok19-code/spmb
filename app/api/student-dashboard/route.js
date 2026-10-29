import db from "../../../lib/db";
import { getRoleSession, requiredStudentDocuments } from "../../../lib/student-dashboard";
import { annotatePaymentStages, installmentStartAt } from "../../../lib/payment-policy";

export async function GET(request) {
  try {
    const session = await getRoleSession("calon_siswa");
    if (!session) {
      return Response.json({ message: "Sesi tidak valid." }, { status: 401 });
    }

    const [accounts] = await db.execute(
      "SELECT id, nama, email, phone FROM users WHERE id = ? AND role = 'calon_siswa' LIMIT 1",
      [session.userId]
    );
    if (!accounts[0]) {
      return Response.json({ message: "Akun tidak ditemukan." }, { status: 404 });
    }

    const [students] = await db.execute(
      `SELECT p.id, p.nama, p.nisn, p.jenjang, a.registration_code,
              a.application_status, a.selection_status, a.final_status
       FROM student_profiles p
       LEFT JOIN student_applications a ON a.student_id = p.id
       WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      [session.userId]
    );
    const requestedStudentId = new URL(request.url).searchParams.get("studentId");
    const requestedId = requestedStudentId === null ? null : Number(requestedStudentId);
    if (requestedId !== null && (!Number.isSafeInteger(requestedId) || requestedId < 1)) {
      return Response.json({ message: "Pendaftaran siswa tidak valid." }, { status: 400 });
    }
    const selectedStudent = requestedId
      ? students.find((student) => student.id === requestedId)
      : students[0];

    if (requestedId && !selectedStudent) {
      return Response.json({ message: "Pendaftaran siswa tidak ditemukan." }, { status: 404 });
    }

    if (!selectedStudent) {
      return Response.json({
        user: accounts[0],
        students,
        selectedStudent: null,
        requiredDocuments: requiredStudentDocuments,
      });
    }

    const [[applications], [documents], [payments], [announcements]] = await Promise.all([
      db.execute(
        `SELECT registration_code, application_status, selection_status,
                final_status, admin_note, created_at, updated_at
         FROM student_applications WHERE student_id = ? LIMIT 1`,
        [selectedStudent.id]
      ),
      db.execute(
        `SELECT document_type, original_name, verification_status,
                review_note, uploaded_at
         FROM student_documents WHERE student_id = ?`,
        [selectedStudent.id]
      ),
      db.execute(
        `SELECT id, amount, payment_status, original_name, review_note, created_at
         FROM student_payments WHERE student_id = ? ORDER BY id DESC`,
        [selectedStudent.id]
      ),
      db.execute(
        `SELECT id, title, message, created_at
         FROM announcements ORDER BY created_at DESC LIMIT 20`
      ),
    ]);
    const paymentHistory = annotatePaymentStages(payments);

    return Response.json({
      user: accounts[0],
      students,
      selectedStudent,
      application: applications[0],
      requiredDocuments: requiredStudentDocuments,
      documents,
      payment: paymentHistory[0] || null,
      payments: paymentHistory,
      installmentsOpen: Date.now() >= installmentStartAt,
      announcements: applications[0]?.application_status === "verified" ? announcements : [],
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return Response.json({ message: "Data dashboard gagal dimuat." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getRoleSession("calon_siswa");
    if (!session) {
      return Response.json({ message: "Sesi tidak valid." }, { status: 401 });
    }

    const body = await request.json();
    const studentId = Number(body.studentId);
    if (body.action !== "submit" || !Number.isSafeInteger(studentId) || studentId < 1) {
      return Response.json({ message: "Pendaftaran siswa tidak valid." }, { status: 400 });
    }

    const [ownedStudents] = await db.execute(
      "SELECT id FROM student_profiles WHERE id = ? AND user_id = ? LIMIT 1",
      [studentId, session.userId]
    );
    if (!ownedStudents[0]) {
      return Response.json({ message: "Pendaftaran siswa tidak ditemukan." }, { status: 404 });
    }

    const [[applicationRows], [documentRows]] = await Promise.all([
      db.execute(
        "SELECT application_status FROM student_applications WHERE student_id = ?",
        [studentId]
      ),
      db.execute(
        "SELECT document_type FROM student_documents WHERE student_id = ?",
        [studentId]
      ),
    ]);

    const application = applicationRows[0];
    if (!application || !["draft", "revision"].includes(application.application_status)) {
      return Response.json(
        { message: "Pendaftaran tidak dapat dikirim pada status saat ini." },
        { status: 409 }
      );
    }

    const uploadedTypes = new Set(documentRows.map((row) => row.document_type));
    const missingDocuments = requiredStudentDocuments
      .filter((document) => !uploadedTypes.has(document.type))
      .map((document) => document.label);

    if (missingDocuments.length > 0) {
      return Response.json(
        { message: "Lengkapi semua dokumen wajib sebelum mengirim pendaftaran.", missingDocuments },
        { status: 400 }
      );
    }

    await db.execute(
      `UPDATE student_applications
       SET application_status = 'submitted', admin_note = NULL
       WHERE student_id = ?`,
      [studentId]
    );

    return Response.json({ message: "Pendaftaran berhasil dikirim." });
  } catch (error) {
    console.error("Submit application error:", error);
    return Response.json({ message: "Pendaftaran gagal dikirim." }, { status: 500 });
  }
}
