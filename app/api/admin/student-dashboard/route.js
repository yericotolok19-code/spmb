import db from "../../../../lib/db";
import { getRoleSession } from "../../../../lib/student-dashboard";
import { annotatePaymentStages } from "../../../../lib/payment-policy";

const applicationStatuses = ["draft", "submitted", "revision", "verified"];
const selectionStatuses = ["not_started", "scheduled", "passed", "failed"];
const finalStatuses = ["pending", "accepted", "rejected"];
const documentStatuses = ["pending", "verified", "revision"];
const paymentStatuses = ["pending", "paid", "rejected"];

export async function GET() {
  const session = await getRoleSession("admin");
  if (!session) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const [[students], [documents], [payments]] = await Promise.all([
    db.execute(
      `SELECT p.id, p.user_id, p.nama, p.nisn, p.jenjang,
              u.email, u.phone,
              a.registration_code, a.application_status, a.selection_status,
              a.final_status, a.admin_note
       FROM student_profiles p
       INNER JOIN users u ON u.id = p.user_id
       INNER JOIN student_applications a ON a.student_id = p.id
       ORDER BY p.created_at DESC`
    ),
    db.execute(
      `SELECT student_id, document_type, original_name, verification_status, review_note
       FROM student_documents`
    ),
    db.execute(
      `SELECT id, student_id, amount, original_name, payment_status, review_note, created_at
       FROM student_payments
       ORDER BY id DESC`
    ),
  ]);

  const paymentsByStudent = new Map();
  for (const payment of payments) {
    const history = paymentsByStudent.get(payment.student_id) || [];
    history.push(payment);
    paymentsByStudent.set(payment.student_id, history);
  }
  for (const [studentId, history] of paymentsByStudent) {
    paymentsByStudent.set(studentId, annotatePaymentStages(history));
  }

  return Response.json({
    students: students.map((student) => ({
      ...student,
      documents: documents.filter((document) => document.student_id === student.id),
      payments: paymentsByStudent.get(student.id) || [],
      payment: paymentsByStudent.get(student.id)?.[0] || null,
    })),
  });
}

export async function PATCH(request) {
  const session = await getRoleSession("admin");
  if (!session) {
    return Response.json({ message: "Akses ditolak." }, { status: 403 });
  }

  const body = await request.json();
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 500) : null;

  if (body.action === "document") {
    if (!documentStatuses.includes(body.status) || !Number.isSafeInteger(Number(body.studentId))) {
      return Response.json({ message: "Status dokumen tidak valid." }, { status: 400 });
    }
    await db.execute(
      `UPDATE student_documents
       SET verification_status = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE student_id = ? AND document_type = ?`,
      [body.status, note, Number(body.studentId), body.documentType]
    );
  } else if (body.action === "payment") {
    if (!paymentStatuses.includes(body.status) || !Number.isSafeInteger(Number(body.paymentId))) {
      return Response.json({ message: "Status pembayaran tidak valid." }, { status: 400 });
    }
    await db.execute(
      `UPDATE student_payments
       SET payment_status = ?, review_note = ?, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [body.status, note, Number(body.paymentId)]
    );
  } else if (body.action === "application") {
    if (
      !applicationStatuses.includes(body.applicationStatus) ||
      !selectionStatuses.includes(body.selectionStatus) ||
      !finalStatuses.includes(body.finalStatus) ||
      !Number.isSafeInteger(Number(body.studentId))
    ) {
      return Response.json({ message: "Status pendaftaran tidak valid." }, { status: 400 });
    }
    await db.execute(
      `UPDATE student_applications
       SET application_status = ?, selection_status = ?, final_status = ?, admin_note = ?
       WHERE student_id = ?`,
      [body.applicationStatus, body.selectionStatus, body.finalStatus, note, Number(body.studentId)]
    );
  } else {
    return Response.json({ message: "Aksi review tidak dikenal." }, { status: 400 });
  }

  return Response.json({ message: "Perubahan berhasil disimpan." });
}