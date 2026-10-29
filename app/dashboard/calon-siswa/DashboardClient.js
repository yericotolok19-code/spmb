"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PortalNav from "../../components/PortalNav";
import { mandatoryDeposit, registrationFee } from "../../../lib/payment-policy";
import "./dashboard.css";

const I = {
  check: "M20 6L9 17l-5-5",
  file: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5",
  money: "M3 7h18v10H3zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  shirt: "M8 3L3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 01-8 0z",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  down: "M12 4v12m0 0l-5-5m5 5l5-5M5 20h14",
  help: "M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3z",
  out: "M9 4H5v16h4M16 8l4 4-4 4M20 12H9",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0zM12 7a3 3 0 100 6 3 3 0 000-6z",
  cal: "M5 5h14v15H5zM5 10h14M9 3v4M15 3v4",
  print: "M7 9V4h10v5M7 17H4v-7h16v7h-3M7 14h10v6H7z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  arrow: "M5 12h14m-6-6l6 6-6 6",
};
const Icon = ({ n, s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={I[n]} /></svg>
);

const costs = [
  ["Uang Pangkal / DSP", "Subsidi beasiswa Gelombang 1 Rp 500.000", 2000000],
  ["Paket Seragam (5 stel + atribut)", "Putih abu, Pramuka, Muslim, Wearpack, Jas", 950000],
  ["SPP Bulan Pertama", "Termasuk iuran OSIS & ekstrakurikuler", 350000],
  ["Praktik Lab & Lisensi Software", "Lab iMac / PC Core i7, 1 tahun", 450000],
  ["MPLS & Asuransi Siswa", "Modul adab santri, kartu asuransi 1 tahun", 200000],
];
const rp = (n) => "Rp " + n.toLocaleString("id-ID");

const applicationLabels = {
  draft: "Belum dikirim",
  submitted: "Menunggu verifikasi",
  revision: "Perlu perbaikan",
  verified: "Berkas terverifikasi",
};
const selectionLabels = {
  not_started: "Belum dimulai",
  scheduled: "Terjadwal",
  passed: "Lulus seleksi",
  failed: "Belum lulus",
};
const finalLabels = {
  pending: "Belum diumumkan",
  accepted: "Diterima",
  rejected: "Tidak diterima",
};
const paymentLabels = {
  unpaid: "Belum ada bukti pembayaran",
  pending: "Menunggu verifikasi",
  paid: "Disetujui",
  rejected: "Bukti perlu diperbaiki",
};
const documentLabels = {
  pending: "Menunggu verifikasi",
  verified: "Terverifikasi",
  revision: "Perlu diperbaiki",
};

export default function DashboardClient({ page = "overview", initialStudentId = "" }) {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [paymentFile, setPaymentFile] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [newStudent, setNewStudent] = useState({ nama: "", nisn: "", jenjang: "" });
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [loadError, setLoadError] = useState("");
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/student-dashboard${initialStudentId ? `?studentId=${encodeURIComponent(initialStudentId)}` : ""}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (response.status === 401) {
          router.replace("/login");
          return null;
        }
        if (!response.ok) throw new Error(data.message || "Data dashboard gagal dimuat.");
        return data;
      })
      .then((data) => {
        if (!cancelled && data) setDashboard(data);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [router, initialStudentId]);

  const refreshDashboard = async () => {
    const studentId = dashboard?.selectedStudent?.id;
    const response = await fetch(`/api/student-dashboard${studentId ? `?studentId=${studentId}` : ""}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Data dashboard gagal dimuat.");
    setDashboard(data);
  };

  const selectStudent = async (studentId) => {
    setLoadError("");
    setActionMessage("");
    setActionError("");
    setSelectedFiles({});
    setPaymentFile(null);
    setPaymentAmount("");
    try {
      const response = await fetch(`/api/student-dashboard?studentId=${studentId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Data pendaftaran gagal dimuat.");
      setDashboard(data);
      const url = new URL(window.location.href);
      url.searchParams.set("studentId", studentId);
      window.history.replaceState(null, "", url);
    } catch (error) {
      setLoadError(error.message);
    }
  };

  const createStudent = async (event) => {
    event.preventDefault();
    setActionMessage("");
    setActionError("");
    setBusyAction("create-student");
    try {
      const response = await fetch("/api/student-dashboard/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudent),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Pendaftaran siswa gagal dibuat.");
      setNewStudent({ nama: "", nisn: "", jenjang: "" });
      setAddStudentOpen(false);
      setActionMessage(data.message);
      const dashboardResponse = await fetch(`/api/student-dashboard?studentId=${data.studentId}`, { cache: "no-store" });
      const dashboardData = await dashboardResponse.json();
      if (!dashboardResponse.ok) throw new Error(dashboardData.message || "Data pendaftaran gagal dimuat.");
      setDashboard(dashboardData);
      const url = new URL(window.location.href);
      url.searchParams.set("studentId", data.studentId);
      window.history.replaceState(null, "", url);
    } catch (error) {
      setActionError(error.message || "Pendaftaran siswa gagal dibuat.");
    } finally {
      setBusyAction("");
    }
  };

  const runAction = async (url, options, successMessage) => {
    setBusyAction(url);
    setActionMessage("");
    setActionError("");
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Aksi gagal diproses.");
      setActionMessage(data.message || successMessage);
      await refreshDashboard();
      return true;
    } catch (error) {
      setActionError(error.message || "Aksi gagal diproses.");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const uploadDocument = async (documentType) => {
    const file = selectedFiles[documentType];
    if (!file) {
      setActionError("Pilih file dokumen terlebih dahulu.");
      return;
    }
    const formData = new FormData();
    formData.append("studentId", dashboard.selectedStudent.id);
    formData.append("documentType", documentType);
    formData.append("file", file);
    const uploaded = await runAction(
      "/api/student-dashboard/documents",
      { method: "POST", body: formData },
      "Dokumen berhasil diunggah."
    );
    if (uploaded) setSelectedFiles((files) => ({ ...files, [documentType]: null }));
  };

  const submitApplication = () => runAction(
    "/api/student-dashboard",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", studentId: dashboard.selectedStudent.id }) },
    "Pendaftaran berhasil dikirim."
  );

  const uploadPayment = async () => {
    if (!paymentFile) {
      setActionError("Pilih file bukti pembayaran terlebih dahulu.");
      return;
    }
    const formData = new FormData();
    formData.append("studentId", dashboard.selectedStudent.id);
    formData.append("amount", String(paymentAmount || suggestedPaymentAmount));
    formData.append("file", paymentFile);
    const uploaded = await runAction(
      "/api/student-dashboard/payments",
      { method: "POST", body: formData },
      "Bukti pembayaran berhasil dikirim."
    );
    if (uploaded) {
      setPaymentFile(null);
      setPaymentAmount("");
    }
  };

  if (!dashboard) {
    return <main className="dashboard-loading">{loadError || "Memuat data pendaftaran..."}</main>;
  }

  const { user, students, selectedStudent: student } = dashboard;
  if (!student && students.length > 0) {
    return (
      <div className="dash">
        <PortalNav name={user.nama || user.email || user.phone} roleLabel="Akun pendaftaran" items={[
          { label: "Ringkasan", href: "/dashboard/calon-siswa" },
          { label: "Dokumen", href: "/dashboard/calon-siswa/dokumen" },
          { label: "Pembayaran", href: "/dashboard/calon-siswa/pembayaran" },
          { label: "Seragam & MPLS", href: "/dashboard/calon-siswa/seragam" },
        ]} />
        <main className="d-main">
          <section className="d-card child-intro">
            <span className="eyebrow">PILIH PENDAFTARAN</span>
            <h1>Pilih siswa yang ingin dikelola</h1>
            <p>Pendaftaran tersedia, tetapi belum ada yang dipilih. Pilih siswa di bawah untuk membuka datanya.</p>
            <label className="student-recovery-select">Pendaftaran siswa
              <select value="" onChange={(event) => {
                const url = new URL(window.location.href);
                url.searchParams.set("studentId", event.target.value);
                window.location.assign(url);
              }}>
                <option value="">Pilih siswa</option>
                {students.map((item) => <option value={item.id} key={item.id}>{item.nama} • {item.jenjang}</option>)}
              </select>
            </label>
          </section>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="dash">
        <PortalNav name={user.nama || user.email || user.phone} roleLabel="Akun pendaftaran" items={[
          { label: "Ringkasan", href: "/dashboard/calon-siswa" },
          { label: "Dokumen", href: "/dashboard/calon-siswa/dokumen" },
          { label: "Pembayaran", href: "/dashboard/calon-siswa/pembayaran" },
          { label: "Seragam & MPLS", href: "/dashboard/calon-siswa/seragam" },
        ]} />
        <main className="d-main">
          <section className="d-card child-intro" id="pendaftaran-siswa">
            <span className="eyebrow">SELAMAT DATANG DI PORTAL SPMB</span>
            <h1>Daftarkan siswa</h1>
            <p>Akun ini bisa digunakan untuk mengelola pendaftaran beberapa siswa. Tambahkan data siswa untuk memulai.</p>
          </section>
          <form className="d-card child-form" onSubmit={createStudent}>
            <h2>Data calon siswa</h2>
            <label>Nama lengkap<input value={newStudent.nama} required maxLength={255} onChange={(event) => setNewStudent((value) => ({ ...value, nama: event.target.value }))} /></label>
            <div className="row2">
              <label>NISN<input value={newStudent.nisn} required inputMode="numeric" minLength={10} maxLength={10} onChange={(event) => setNewStudent((value) => ({ ...value, nisn: event.target.value }))} /></label>
              <label>Jenjang tujuan<select value={newStudent.jenjang} required onChange={(event) => setNewStudent((value) => ({ ...value, jenjang: event.target.value }))}><option value="">Pilih jenjang</option><option>SMP Citra Negara</option><option>SMA Citra Negara</option><option>SMK Citra Negara</option></select></label>
            </div>
            {actionError && <p className="action-message is-error" role="status">{actionError}</p>}
            <button className="btn-dark" disabled={busyAction === "create-student"}>{busyAction === "create-student" ? "Membuat pendaftaran..." : "Buat pendaftaran siswa"}</button>
          </form>
        </main>
      </div>
    );
  }

  const { application, documents, requiredDocuments, payment, announcements = [] } = dashboard;
  const paymentHistory = dashboard.payments || (payment ? [payment] : []);
  const documentsByType = Object.fromEntries(documents.map((document) => [document.document_type, document]));
  const uploadedCount = requiredDocuments.filter((document) => documentsByType[document.type]).length;
  const documentsComplete = uploadedCount === requiredDocuments.length;
  const applicationStatus = application.application_status;
  const paymentStatus = payment?.payment_status || "unpaid";
  const admitted = application.final_status === "accepted";
  const paidAmount = paymentHistory
    .filter((record) => record.payment_status === "paid")
    .reduce((sum, record) => sum + Number(record.amount), 0);
  const remainingBalance = Math.max(0, registrationFee - paidAmount);
  const hasPendingPayment = paymentHistory.some((record) => record.payment_status === "pending");
  const depositPaid = paidAmount >= mandatoryDeposit;
  const installmentsOpen = dashboard.installmentsOpen;
  const suggestedPaymentAmount = depositPaid ? remainingBalance : mandatoryDeposit;
  const canPay = admitted && !hasPendingPayment && (
    !depositPaid || (remainingBalance > 0 && installmentsOpen)
  );
  const paymentDisplayLabel = remainingBalance === 0
    ? "Lunas"
    : paymentStatus === "pending"
      ? "Menunggu verifikasi"
      : paymentStatus === "rejected"
        ? "Bukti perlu diperbaiki"
        : depositPaid
          ? "DP disetujui · cicilan"
          : depositPaid === false && paidAmount > 0
            ? "DP terverifikasi sebagian"
            : "DP wajib Rp200.000";
  const currentStep = remainingBalance === 0 ? 6
    : admitted ? 5
      : application.final_status !== "pending" ? 4
        : application.selection_status !== "not_started" || applicationStatus === "verified" ? 3
          : applicationStatus === "submitted" ? 2 : 1;
  const steps = [
    ["Akun dibuat", "Akun pendaftaran aktif"],
    ["Lengkapi dokumen", `${uploadedCount} dari ${requiredDocuments.length} berkas`],
    ["Verifikasi berkas", applicationLabels[applicationStatus]],
    ["Seleksi", selectionLabels[application.selection_status]],
    ["Pengumuman", finalLabels[application.final_status]],
    ["Daftar ulang", paymentDisplayLabel],
    ["Seragam & MPLS", admitted ? "Informasi tersedia dari panitia" : "Setelah pengumuman"],
  ];

  const total = registrationFee;
  const initials = student.nama.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const printPage = (target) => {
    const clearTarget = () => {
      delete document.body.dataset.printTarget;
      window.removeEventListener("afterprint", clearTarget);
    };
    document.body.dataset.printTarget = target;
    window.addEventListener("afterprint", clearTarget);
    window.print();
  };
  const pageHref = (name) => {
    const query = student ? `?studentId=${student.id}` : "";
    return name === "overview" ? `/dashboard/calon-siswa${query}` : `/dashboard/calon-siswa/${name}${query}`;
  };
  const showOverview = page === "overview";
  const showDocuments = page === "overview" || page === "dokumen";
  const showPayments = page === "overview" || page === "pembayaran";
  const showUniform = page === "overview" || page === "seragam";

  return (
    <div className="dash">
      <PortalNav
        name={user.nama || user.email || user.phone}
        roleLabel="Calon siswa"
        items={[
          { label: "Ringkasan", href: pageHref("overview") },
          { label: "Dokumen", href: pageHref("dokumen") },
          { label: "Pembayaran", href: pageHref("pembayaran") },
          { label: "Seragam & MPLS", href: pageHref("seragam") },
        ]}
      />

      <main className={showOverview ? "d-main d-overview" : "d-main"}>
        <section className="d-card child-switcher no-print">
          <label htmlFor="student-registration-select">Pilih pendaftaran siswa</label>
          <select id="student-registration-select" value={student.id} onChange={(event) => selectStudent(event.target.value)}>
            {students.map((item) => <option value={item.id} key={item.id}>{item.nama} • {item.jenjang}</option>)}
          </select>
          <button type="button" className="btn-line" onClick={() => setAddStudentOpen((open) => !open)}>{addStudentOpen ? "Tutup" : "+ Tambah siswa"}</button>
        </section>
        {showOverview && addStudentOpen && <form className="d-card child-form no-print" onSubmit={createStudent}>
          <h2>Tambah pendaftaran siswa</h2>
          <label>Nama lengkap<input value={newStudent.nama} required maxLength={255} onChange={(event) => setNewStudent((value) => ({ ...value, nama: event.target.value }))} /></label>
          <div className="row2">
            <label>NISN<input value={newStudent.nisn} required inputMode="numeric" minLength={10} maxLength={10} onChange={(event) => setNewStudent((value) => ({ ...value, nisn: event.target.value }))} /></label>
            <label>Jenjang tujuan<select value={newStudent.jenjang} required onChange={(event) => setNewStudent((value) => ({ ...value, jenjang: event.target.value }))}><option value="">Pilih jenjang</option><option>SMP Citra Negara</option><option>SMA Citra Negara</option><option>SMK Citra Negara</option></select></label>
          </div>
          <button className="btn-dark" disabled={busyAction === "create-student"}>{busyAction === "create-student" ? "Membuat pendaftaran..." : "Buat pendaftaran siswa"}</button>
        </form>}

        {!showOverview && <header className="d-page-heading"><span className="eyebrow">PORTAL CALON SISWA</span><h1>{page === "dokumen" ? "Dokumen pendaftaran" : page === "pembayaran" ? "Pembayaran daftar ulang" : "Seragam & MPLS"}</h1><p>Kelola informasi untuk {student.nama} dalam pendaftaran ini.</p></header>}

        {showOverview && <section className="d-card profile" id="status">
          <span className="avatar">{initials}</span>
          <div className="p-info">
            <div className="tags"><b>{student.jenjang}</b><b className="t2">{applicationLabels[applicationStatus]}</b><span>TA {application.registration_code.split("-")[1]}</span></div>
            <h1>{student.nama}</h1>
            <p>No. Registrasi <b>{application.registration_code}</b> • Akun {user.email || user.phone}</p>
            <button type="button" className="btn-line profile-print no-print" onClick={() => printPage("registration")}><Icon n="print" s={14} /> Cetak kartu pendaftaran</button>
          </div>
          <div className="p-badge"><small>Status kelulusan</small><strong>{finalLabels[application.final_status]}</strong></div>
        </section>}

        {showOverview && <section className="d-card student-announcements" aria-label="Pengumuman SPMB">
          <div className="student-announcements-header">
            <span className="student-announcement-mark" aria-hidden="true">CN</span>
            <div className="student-announcement-title"><small className="eyebrow">KANAL RESMI SEKOLAH</small><h3>Pengumuman SPMB</h3><p>Informasi terbaru langsung dari panitia.</p></div>
            <span className="student-announcement-online"><i /> {announcements.length ? `${announcements.length} informasi` : "Aktif"}</span>
          </div>
          <div className="student-announcement-chat" aria-live="polite">
            {announcements.length > 0 ? announcements.map((announcement) => <article key={announcement.id}>
              <div className="student-announcement-sender"><span className="student-announcement-avatar">CN</span><div><b>Panitia SPMB</b><small>Informasi resmi</small></div></div>
              <h4>{announcement.title}</h4>
              <p>{announcement.message}</p>
              <time>{new Date(announcement.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</time>
            </article>) : <div className="student-announcement-empty"><span aria-hidden="true">i</span><p>Belum ada pengumuman baru.<br />Informasi dari panitia akan muncul di sini.</p></div>}
          </div>
        </section>}

        {showOverview && <section className="d-card banner">
          <span className="b-ico"><Icon n={remainingBalance === 0 ? "check" : "money"} s={26} /></span>
          <div className="b-text">
            <span className="pill">{paymentDisplayLabel}</span>
            <h2>{remainingBalance === 0 ? "Biaya daftar ulang sudah lunas" : hasPendingPayment ? "Bukti pembayaran sedang ditinjau" : admitted ? "Selesaikan daftar ulang bertahap" : "Status pendaftaran siswa"}</h2>
            <p>{application.admin_note || (admitted ? depositPaid ? installmentsOpen ? "DP sudah terpenuhi. Lanjutkan cicilan sisa biaya mulai Agustus 2027." : "DP sudah terpenuhi. Cicilan sisa biaya dibuka mulai Agustus 2027." : "Setelah diterima, kirim DP wajib Rp200.000. Sisa biaya dapat dicicil mulai Agustus 2027." : "Status akan diperbarui setelah dokumen dan tahapan seleksi ditinjau panitia.")}</p>
            <div className="b-btns">
              { ["draft", "revision"].includes(applicationStatus) && <button type="button" className="btn-dark" disabled={!documentsComplete || busyAction !== ""} onClick={submitApplication}><Icon n="arrow" s={14} /> {busyAction === "/api/student-dashboard" ? "Mengirim..." : "Kirim pendaftaran"}</button> }
              {canPay && <a href="#biaya" className="btn-dark"><Icon n="money" s={14} /> {depositPaid ? "Bayar cicilan" : "Bayar DP wajib"}</a>}
              {paidAmount > 0 && <button type="button" className="btn-dark" onClick={() => printPage("payment")}><Icon n="print" s={14} /> Cetak rincian pembayaran</button>}
              <a href="#dokumen" className="btn-line"><Icon n="file" s={14} /> Kelola dokumen</a>
            </div>
          </div>
          <div className="b-stats">
            <div><small>Progres dokumen</small><b>{uploadedCount}/{requiredDocuments.length} berkas</b></div>
            <div><small>Status seleksi</small><b>{selectionLabels[application.selection_status]}</b></div>
            <div><small>Sisa biaya</small><b>{rp(remainingBalance)}</b></div>
          </div>
        </section>}

        {(actionMessage || actionError) && <p className={`action-message ${actionError ? "is-error" : ""}`} role="status">{actionError || actionMessage}</p>}

        {showOverview && <section className="d-card">
          <div className="c-head">
            <div><small className="eyebrow">Progres resmi SPMB</small><h3>Alur Tahapan Seleksi</h3></div>
            <span className="live">Tahap saat ini: {steps[currentStep][0]}</span>
          </div>
          <ol className="steps7">
            {steps.map(([t, s], i) => (
              <li key={t} className={i === currentStep ? "now" : i < currentStep ? "done" : "upcoming"}>
                <span className="dot">{i < currentStep ? <Icon n="check" s={12} /> : i + 1}</span>
                <b>{t}</b><small>{s}</small>
              </li>
            ))}
          </ol>
        </section>}

        <div className="d-cols">
          <div className="col">
            {showDocuments && <section className="d-card" id="dokumen">
              <div className="c-head">
                <h3>Dokumen Pendaftaran</h3>
                <span className="pill">{uploadedCount} dari {requiredDocuments.length} diunggah</span>
              </div>
              <ul className="docs">
                {requiredDocuments.map((requiredDocument) => {
                  const document = documentsByType[requiredDocument.type];
                  const selectedFile = selectedFiles[requiredDocument.type];
                  return <li key={requiredDocument.type} className="doc-row">
                    <span className="d-ic"><Icon n="file" /></span>
                    <div className="doc-detail"><b>{requiredDocument.label}</b><small>{document?.original_name || selectedFile?.name || "Belum diunggah"}</small>
                      {document?.review_note && <small className="review-note">Catatan: {document.review_note}</small>}
                    </div>
                    <em className={`doc-status ${document?.verification_status || "missing"}`}>{document ? documentLabels[document.verification_status] : "Belum diunggah"}</em>
                    <div className="doc-controls">
                      <label className="file-picker">Pilih file<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setSelectedFiles((files) => ({ ...files, [requiredDocument.type]: event.target.files?.[0] || null }))} /></label>
                      {document && <a className="inline-link" href={`/api/student-dashboard/documents/${requiredDocument.type}?studentId=${student.id}`}>Unduh</a>}
                      <button type="button" className="btn-line" disabled={!selectedFile || busyAction !== ""} onClick={() => uploadDocument(requiredDocument.type)}>{busyAction === "/api/student-dashboard/documents" ? "Mengunggah..." : document ? "Ganti berkas" : "Unggah"}</button>
                    </div>
                  </li>;
                })}
              </ul>
              <p className="hint">Format PDF, JPG, atau PNG. Ukuran maksimal 5 MB per file.</p>
            </section>}
            {showPayments && <section className="d-card" id="biaya">
              <div className="c-head">
                <div><h3>Rincian Pembayaran</h3><small>Daftar ulang • {student.jenjang}</small></div>
                <span className={`pill ${remainingBalance === 0 ? "" : "warn"}`}>{paymentDisplayLabel}</span>
              </div>
              <section className="payment-journey" aria-label="Tahapan pembayaran">
                <header><div><small className="eyebrow">PEMBAYARAN BERTAHAP</small><h4>Bayar sesuai tahap</h4></div><span>{rp(paidAmount)} terverifikasi</span></header>
                <div className="payment-progress"><span style={{ width: `${Math.min(100, (paidAmount / total) * 100)}%` }} /></div>
                <div className="payment-plan">
                  <article className={depositPaid ? "is-done" : admitted ? "is-current" : "is-locked"}>
                    <span>01</span><small>WAJIB SETELAH DITERIMA</small><h5>DP daftar ulang</h5><strong>{rp(mandatoryDeposit)}</strong><p>{depositPaid ? "DP sudah disetujui panitia." : "Bayar satu kali untuk mengunci tahap daftar ulang."}</p>
                  </article>
                  <article className={remainingBalance === 0 ? "is-done" : depositPaid && installmentsOpen ? "is-current" : "is-locked"}>
                    <span>02</span><small>CICILAN SISA</small><h5>Pelunasan bertahap</h5>                    <strong>{rp(registrationFee - mandatoryDeposit)}</strong><p>{remainingBalance === 0 ? "Seluruh biaya sudah lunas." : depositPaid ? `Mulai Agustus 2027 · sisa ${rp(remainingBalance)}.` : "Mulai Agustus 2027, setelah DP disetujui."}</p>
                  </article>
                </div>
                <p className="payment-transfer-note">Transfer manual. Konfirmasi rekening resmi kepada panitia sebelum mengirim pembayaran; unggah bukti transfer agar dapat diverifikasi.</p>
              </section>
              <ul className="costs">
                {costs.map(([n, d, v]) => (
                  <li key={n}>
                    <div><b>{n}</b><small>{d}</small></div>
                    <span>{rp(v)}</span>
                  </li>
                ))}
              </ul>
              <div className="total"><div><b>Sisa tagihan</b><small>DP dan cicilan dihitung setelah bukti disetujui panitia.</small></div><strong>{rp(remainingBalance)}</strong></div>
              {paymentHistory.length > 0 && <div className="payment-history">
                <h4>Riwayat transaksi</h4>
                {paymentHistory.map((record) => <article key={record.id}>
                  <div><b>{record.stage} · {rp(Number(record.amount))}</b><small>{new Date(record.created_at).toLocaleDateString("id-ID")} · {record.original_name}</small>{record.review_note && <small className="review-note">Catatan: {record.review_note}</small>}</div>
                  <span className={`payment-status status-${record.payment_status}`}>{paymentLabels[record.payment_status]}</span>
                </article>)}
              </div>}
              {hasPendingPayment && <p className="payment-state-note">Bukti terakhir sedang diverifikasi. Anda dapat mengirim transaksi berikutnya setelah panitia menyelesaikan pemeriksaan.</p>}
              {canPay && <div className="payment-upload-panel">
                <div><small className="eyebrow">{depositPaid ? "CICILAN SISA" : "LANGKAH WAJIB PERTAMA"}</small><h4>{depositPaid ? "Masukkan nominal cicilan" : "DP wajib Rp200.000"}</h4><p>{depositPaid ? "Nominal bebas, maksimal sebesar sisa tagihan. Cicilan dapat dimulai Agustus 2027." : "Nominal DP harus tepat Rp200.000 dan akan mengurangi total biaya."}</p></div>
                {depositPaid && <label className="payment-amount-field">Nominal cicilan
                  <input type="number" inputMode="numeric" min="1" max={remainingBalance} step="1" value={paymentAmount || suggestedPaymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                </label>}
                <div className="payment-upload">
                  <label className="file-picker">{paymentFile?.name || "Pilih bukti transfer"}<input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => setPaymentFile(event.target.files?.[0] || null)} /></label>
                  <button type="button" className="btn-dark" disabled={!paymentFile || busyAction !== "" || Number(paymentAmount || suggestedPaymentAmount) < 1 || Number(paymentAmount || suggestedPaymentAmount) > (depositPaid ? remainingBalance : mandatoryDeposit)} onClick={uploadPayment}>{busyAction === "/api/student-dashboard/payments" ? "Mengirim..." : "Kirim bukti pembayaran"}</button>
                </div>
                <p className="hint">Format PDF, JPG, atau PNG. Maksimal 5 MB. Bukti harus disetujui sebelum transaksi selanjutnya.</p>
              </div>}
              {!admitted && <p className="hint">Pembayaran daftar ulang tersedia setelah hasil seleksi diterima.</p>}
              {admitted && depositPaid && !installmentsOpen && remainingBalance > 0 && <p className="payment-state-note">Cicilan saldo Rp{remainingBalance.toLocaleString("id-ID")} dapat dimulai pada Agustus 2027.</p>}
              {paidAmount > 0 && <button type="button" className="btn-line no-print" onClick={() => printPage("payment")}><Icon n="print" s={14} /> Cetak riwayat pembayaran</button>}
            </section>}
          </div>

          <div className="col">
            {showOverview && <section className="d-card">
              <h3>Tindakan Cepat</h3>
              <button type="button" className="act main" onClick={() => printPage("registration")}><span className="d-ic"><Icon n="print" /></span><div><b>Cetak kartu pendaftaran</b><small>{application.registration_code}</small></div><Icon n="down" /></button>
              <a className="act" href="#dokumen"><span className="d-ic"><Icon n="file" /></span><div><b>Lengkapi dokumen</b><small>{uploadedCount} dari {requiredDocuments.length} berkas diunggah</small></div><Icon n="arrow" /></a>
              <a className="act" href="tel:+622177201052"><span className="d-ic"><Icon n="help" /></span><div><b>Hubungi helpdesk</b><small>(021) 77201052</small></div><Icon n="arrow" /></a>
              <button type="button" className="act" disabled={paidAmount === 0} onClick={() => printPage("payment")}><span className="d-ic"><Icon n="down" /></span><div><b>Cetak riwayat pembayaran</b><small>{paidAmount > 0 ? "Lihat transaksi yang telah disetujui" : "Tersedia setelah pembayaran disetujui"}</small></div><Icon n="arrow" /></button>
            </section>}

            {showUniform && <section className="d-card" id="seragam">
              <div className="c-head"><h3>Seragam & MPLS</h3><span className={`pill ${admitted ? "" : "warn"}`}>{admitted ? "Menunggu jadwal panitia" : "Belum tersedia"}</span></div>
              {remainingBalance === 0 ? <><div className="info-row"><Icon n="pin" /><div><b>Pengukuran seragam</b><small>Hubungi panitia untuk jadwal dan lokasi pengukuran.</small></div></div><div className="ticket"><div><small>Kode pendaftaran</small><b>{application.registration_code}</b></div><button type="button" className="btn-line no-print" onClick={() => printPage("uniform")}><Icon n="print" s={14} /> Cetak</button></div><a className="inline-link" href="tel:+622177201052">Tanyakan jadwal seragam & MPLS</a></> : admitted ? <p className="hint">Tiket dan pengukuran seragam tersedia setelah seluruh biaya daftar ulang disetujui. Jadwal MPLS dikonfirmasi oleh panitia.</p> : <p className="hint">Informasi seragam dan MPLS akan ditampilkan setelah status kelulusan diterima.</p>}
            </section>}
          </div>
        </div>
      </main>
    </div>
  );
}