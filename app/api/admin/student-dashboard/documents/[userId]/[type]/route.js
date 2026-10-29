import db from "../../../../../../../lib/db";
import { getRoleSession } from "../../../../../../../lib/student-dashboard";

export async function GET(_request, { params }) {
  const session = await getRoleSession("admin");
  if (!session) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const { userId, type } = await params;
  const [rows] = await db.execute(
    `SELECT original_name, mime_type, file_data
     FROM student_documents WHERE student_id = ? AND document_type = ? LIMIT 1`,
    [Number(userId), type]
  );
  const document = rows[0];
  if (!document) {
    return Response.json({ message: "Dokumen tidak ditemukan." }, { status: 404 });
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