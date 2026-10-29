import db from "../../../../../../lib/db";
import { getRoleSession } from "../../../../../../lib/student-dashboard";

export async function GET(_request, { params }) {
  const session = await getRoleSession("admin");
  if (!session) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const { id } = await params;
  const [rows] = await db.execute(
    `SELECT original_name, mime_type, proof_data
     FROM student_payments WHERE id = ? LIMIT 1`,
    [Number(id)]
  );
  const proof = rows[0];
  if (!proof) {
    return Response.json({ message: "Bukti pembayaran tidak ditemukan." }, { status: 404 });
  }

  return new Response(new Uint8Array(proof.proof_data), {
    headers: {
      "Content-Type": proof.mime_type,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(proof.original_name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}