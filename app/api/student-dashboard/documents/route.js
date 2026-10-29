import db from "../../../../lib/db";
import {
  getRoleSession,
  requiredStudentDocuments,
  readUploadedFile,
} from "../../../../lib/student-dashboard";

export async function POST(request) {
  try {
    const session = await getRoleSession("calon_siswa");
    if (!session) {
      return Response.json({ message: "Sesi tidak valid." }, { status: 401 });
    }

    const formData = await request.formData();
    const documentType = formData.get("documentType");
    const studentId = Number(formData.get("studentId"));
    const documentFile = await readUploadedFile(formData.get("file"));

    if (!requiredStudentDocuments.some((document) => document.type === documentType)) {
      return Response.json({ message: "Jenis dokumen tidak valid." }, { status: 400 });
    }
    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return Response.json({ message: "Pendaftaran siswa tidak valid." }, { status: 400 });
    }
    if (documentFile.error) {
      return Response.json({ message: documentFile.error }, { status: 400 });
    }

    const [ownedStudents] = await db.execute(
      "SELECT id FROM student_profiles WHERE id = ? AND user_id = ? LIMIT 1",
      [studentId, session.userId]
    );
    if (!ownedStudents[0]) {
      return Response.json({ message: "Pendaftaran siswa tidak ditemukan." }, { status: 404 });
    }

    await db.execute(
      `INSERT INTO student_documents
         (student_id, document_type, original_name, mime_type, file_data, verification_status, review_note, reviewed_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NULL, NULL)
       ON DUPLICATE KEY UPDATE
         original_name = VALUES(original_name),
         mime_type = VALUES(mime_type),
         file_data = VALUES(file_data),
         verification_status = 'pending',
         review_note = NULL,
         uploaded_at = CURRENT_TIMESTAMP,
         reviewed_at = NULL`,
      [studentId, documentType, documentFile.originalName, documentFile.mimeType, documentFile.data]
    );

    return Response.json({ message: "Dokumen berhasil diunggah dan menunggu verifikasi." }, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return Response.json({ message: "Dokumen gagal diunggah." }, { status: 500 });
  }
}