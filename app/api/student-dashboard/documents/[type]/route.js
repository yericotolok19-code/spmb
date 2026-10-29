import db from "../../../../../lib/db";
import {
  getRoleSession,
  requiredStudentDocuments,
} from "../../../../../lib/student-dashboard";

export async function GET(request, { params }) {
  const session = await getRoleSession("calon_siswa");
  if (!session) {
    return Response.json({ message: "Sesi tidak valid." }, { status: 401 });
  }

  const { type } = await params;
  const studentId = Number(new URL(request.url).searchParams.get("studentId"));
  if (!requiredStudentDocuments.some((document) => document.type === type)) {
    return Response.json({ message: "Dokumen tidak ditemukan." }, { status: 404 });
  }
  if (!Number.isSafeInteger(studentId) || studentId < 1) {
    return Response.json({ message: "Pendaftaran siswa tidak valid." }, { status: 400 });
  }

  const [rows] = await db.execute(
    `SELECT d.original_name, d.mime_type, d.file_data
     FROM student_documents d
     INNER JOIN student_profiles p ON p.id = d.student_id
     WHERE p.user_id = ? AND p.id = ? AND d.document_type = ? LIMIT 1`,
    [session.userId, studentId, type]
  );
  const document = rows[0];
  if (!document) {
    return Response.json({ message: "Dokumen belum diunggah." }, { status: 404 });
  }

  return new Response(new Uint8Array(document.file_data), {
    headers: {
      "Content-Type": document.mime_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.original_name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}