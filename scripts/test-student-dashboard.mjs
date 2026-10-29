import db from "../lib/db.js";
import bcrypt from "bcryptjs";

const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000";
const suffix = Date.now().toString().slice(-9);
const studentEmail = `copilot.flow.${suffix}@example.com`;
const adminEmail = `copilot.review.${suffix}@example.com`;
const studentNisn = `7${suffix}`;
const password = "TemporaryPass123!";
const documentTypes = [
  "birth_certificate",
  "family_card",
  "photo",
  "graduation_letter",
  "report_card",
];
const testFile = new File(
  [Buffer.from("%PDF-1.4 temporary dashboard smoke test")],
  "test.pdf",
  { type: "application/pdf" }
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const data = await response.json();
  return { response, data };
}

function makeCookie(response) {
  return response.headers.get("set-cookie")?.split(";")[0];
}

function makeUpload(fields) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.append(key, value);
  return formData;
}

try {
  const registration = await jsonRequest("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nama: "Test Workflow Siswa",
      email: studentEmail,
      nisn: studentNisn,
      jenjang: "SMA Citra Negara",
      wa: "081234567890",
      password,
    }),
  });
  assert(registration.response.status === 201, `Registration failed: ${registration.response.status}`);

  const [studentRows] = await db.execute("SELECT id FROM users WHERE email = ?", [studentEmail]);
  const studentId = studentRows[0].id;
  const adminPassword = await bcrypt.hash(password, 4);
  await db.execute(
    "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, 'admin')",
    ["Test Workflow Admin", adminEmail, adminPassword]
  );

  const studentLogin = await jsonRequest("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: studentEmail, password }),
  });
  const studentCookie = makeCookie(studentLogin.response);
  assert(studentLogin.response.ok && studentCookie, "Student login failed.");

  const initial = await jsonRequest("/api/student-dashboard", {
    headers: { Cookie: studentCookie },
    cache: "no-store",
  });
  assert(initial.data.application.application_status === "draft", "New application should be draft.");
  assert(initial.data.application.final_status === "pending", "New application should not be accepted by default.");
  assert(initial.data.documents.length === 0 && initial.data.payment === null, "New application should have no uploaded records.");

  const paymentBeforeAcceptance = await jsonRequest("/api/student-dashboard/payments", {
    method: "POST",
    headers: { Cookie: studentCookie },
    body: makeUpload({ file: testFile }),
  });
  assert(paymentBeforeAcceptance.response.status === 403, "Payment must be blocked before acceptance.");

  const earlySubmit = await jsonRequest("/api/student-dashboard", {
    method: "POST",
    headers: { Cookie: studentCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit" }),
  });
  assert(earlySubmit.response.status === 400, "Submission must require all documents.");

  for (const documentType of documentTypes) {
    const upload = await jsonRequest("/api/student-dashboard/documents", {
      method: "POST",
      headers: { Cookie: studentCookie },
      body: makeUpload({ documentType, file: testFile }),
    });
    assert(upload.response.status === 201, `Upload failed for ${documentType}.`);
  }

  const studentDownload = await fetch(`${baseUrl}/api/student-dashboard/documents/birth_certificate`, {
    headers: { Cookie: studentCookie },
  });
  assert(studentDownload.ok && (await studentDownload.arrayBuffer()).byteLength > 0, "Student document download failed.");

  const submitted = await jsonRequest("/api/student-dashboard", {
    method: "POST",
    headers: { Cookie: studentCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "submit" }),
  });
  assert(submitted.response.ok, "Application submission failed.");

  const adminLogin = await jsonRequest("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: adminEmail, password }),
  });
  const adminCookie = makeCookie(adminLogin.response);
  assert(adminLogin.response.ok && adminCookie, "Admin login failed.");

  const adminData = await jsonRequest("/api/admin/student-dashboard", {
    headers: { Cookie: adminCookie },
    cache: "no-store",
  });
  const studentReview = adminData.data.students.find((student) => student.id === studentId);
  assert(studentReview && studentReview.documents.length === 5, "Admin review list is missing uploaded documents.");

  const reviewedApplication = await jsonRequest("/api/admin/student-dashboard", {
    method: "PATCH",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "application",
      userId: studentId,
      applicationStatus: "verified",
      selectionStatus: "passed",
      finalStatus: "accepted",
      note: "Lolos verifikasi uji.",
    }),
  });
  assert(reviewedApplication.response.ok, "Admin application review failed.");

  const proof = await jsonRequest("/api/student-dashboard/payments", {
    method: "POST",
    headers: { Cookie: studentCookie },
    body: makeUpload({ file: testFile }),
  });
  assert(proof.response.status === 201, "Payment proof upload failed after acceptance.");

  const refreshedAdminData = await jsonRequest("/api/admin/student-dashboard", {
    headers: { Cookie: adminCookie },
    cache: "no-store",
  });
  const latestPayment = refreshedAdminData.data.students.find((student) => student.id === studentId).payment;
  const proofDownload = await fetch(`${baseUrl}/api/admin/student-dashboard/payments/${latestPayment.id}`, {
    headers: { Cookie: adminCookie },
  });
  assert(proofDownload.ok && (await proofDownload.arrayBuffer()).byteLength > 0, "Admin payment proof download failed.");

  const reviewedPayment = await jsonRequest("/api/admin/student-dashboard", {
    method: "PATCH",
    headers: { Cookie: adminCookie, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "payment", paymentId: latestPayment.id, status: "paid", note: "Pembayaran sesuai." }),
  });
  assert(reviewedPayment.response.ok, "Payment review failed.");

  const finalDashboard = await jsonRequest("/api/student-dashboard", {
    headers: { Cookie: studentCookie },
    cache: "no-store",
  });
  assert(finalDashboard.data.application.final_status === "accepted", "Student view did not reflect the final decision.");
  assert(finalDashboard.data.payment.payment_status === "paid", "Student view did not reflect approved payment.");

  console.log("PASS: initial defaults, document upload/download, application submission, admin review, payment proof, and updated student status.");
} finally {
  await db.execute("DELETE FROM users WHERE email IN (?, ?)", [studentEmail, adminEmail]);
  await db.end();
}