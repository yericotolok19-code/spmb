import db from "../../../../lib/db";
import { getRoleSession, readUploadedFile } from "../../../../lib/student-dashboard";
import { installmentStartAt, mandatoryDeposit, registrationFee } from "../../../../lib/payment-policy";

export async function POST(request) {
  try {
    const session = await getRoleSession("calon_siswa");
    if (!session) {
      return Response.json({ message: "Sesi tidak valid." }, { status: 401 });
    }

    const formData = await request.formData();
    const studentId = Number(formData.get("studentId"));
    const amount = Number(formData.get("amount"));
    if (!Number.isSafeInteger(studentId) || studentId < 1) {
      return Response.json({ message: "Pendaftaran siswa tidak valid." }, { status: 400 });
    }
    if (!Number.isSafeInteger(amount) || amount < 1) {
      return Response.json({ message: "Nominal pembayaran tidak valid." }, { status: 400 });
    }

    const proofFile = await readUploadedFile(formData.get("file"));
    if (proofFile.error) {
      return Response.json({ message: proofFile.error }, { status: 400 });
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [applications] = await connection.execute(
        `SELECT a.final_status FROM student_applications a
         INNER JOIN student_profiles p ON p.id = a.student_id
         WHERE a.student_id = ? AND p.user_id = ? FOR UPDATE`,
        [studentId, session.userId]
      );
      if (!applications[0]) {
        await connection.rollback();
        return Response.json({ message: "Pendaftaran siswa tidak ditemukan." }, { status: 404 });
      }
      if (applications[0].final_status !== "accepted") {
        await connection.rollback();
        return Response.json(
          { message: "Pembayaran daftar ulang tersedia setelah hasil seleksi diterima." },
          { status: 403 }
        );
      }

      const [payments] = await connection.execute(
        `SELECT amount, payment_status FROM student_payments
         WHERE student_id = ? ORDER BY id DESC FOR UPDATE`,
        [studentId]
      );
      if (payments.some((payment) => payment.payment_status === "pending")) {
        await connection.rollback();
        return Response.json(
          { message: "Bukti pembayaran sebelumnya masih menunggu verifikasi." },
          { status: 409 }
        );
      }

      const paidAmount = payments
        .filter((payment) => payment.payment_status === "paid")
        .reduce((sum, payment) => sum + Number(payment.amount), 0);
      if (paidAmount >= registrationFee) {
        await connection.rollback();
        return Response.json({ message: "Seluruh biaya daftar ulang sudah lunas." }, { status: 409 });
      }

      if (paidAmount < mandatoryDeposit) {
        if (amount !== mandatoryDeposit) {
          await connection.rollback();
          return Response.json(
            { message: "Pembayaran pertama wajib berupa DP tepat Rp200.000." },
            { status: 400 }
          );
        }
      } else {
        if (Date.now() < installmentStartAt) {
          await connection.rollback();
          return Response.json(
            { message: "Cicilan sisa biaya baru dapat dibayar mulai Agustus 2027." },
            { status: 403 }
          );
        }
        if (amount > registrationFee - paidAmount) {
          await connection.rollback();
          return Response.json(
            { message: `Nominal melebihi sisa tagihan Rp${(registrationFee - paidAmount).toLocaleString("id-ID")}.` },
            { status: 400 }
          );
        }
      }

      await connection.execute(
        `INSERT INTO student_payments
           (student_id, amount, original_name, mime_type, proof_data, payment_status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [studentId, amount, proofFile.originalName, proofFile.mimeType, proofFile.data]
      );
      await connection.commit();
      return Response.json({ message: "Bukti pembayaran berhasil dikirim untuk diverifikasi." }, { status: 201 });
    } catch (error) {
      try { await connection.rollback(); } catch {}
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Payment proof upload error:", error);
    return Response.json({ message: "Bukti pembayaran gagal dikirim." }, { status: 500 });
  }
}