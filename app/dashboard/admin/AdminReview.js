"use client";

import { useEffect, useState } from "react";
import PortalNav from "../../components/PortalNav";
import "./review.css";

const applicationOptions = [
  ["draft", "Draft"],
  ["submitted", "Menunggu verifikasi"],
  ["revision", "Perlu perbaikan"],
  ["verified", "Berkas terverifikasi"],
];
const selectionOptions = [
  ["not_started", "Belum dimulai"],
  ["scheduled", "Terjadwal"],
  ["passed", "Lulus"],
  ["failed", "Tidak lulus"],
];
const finalOptions = [
  ["pending", "Belum diumumkan"],
  ["accepted", "Diterima"],
  ["rejected", "Tidak diterima"],
];
const documentOptions = [
  ["pending", "Menunggu"],
  ["verified", "Terverifikasi"],
  ["revision", "Perlu perbaikan"],
];
const paymentOptions = [
  ["pending", "Menunggu"],
  ["paid", "Disetujui"],
  ["rejected", "Ditolak"],
];

export default function AdminReview({ nama, mode = "students" }) {
  const [students, setStudents] = useState([]);
  const [edits, setEdits] = useState({});
  const [notes, setNotes] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadStudents = async () => {
    const response = await fetch("/api/admin/student-dashboard", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Data siswa gagal dimuat.");
    setStudents(data.students);
    setEdits(Object.fromEntries(data.students.map((student) => [student.id, {
      applicationStatus: student.application_status,
      selectionStatus: student.selection_status,
      finalStatus: student.final_status,
      note: student.admin_note || "",
    }])));
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/student-dashboard", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Data siswa gagal dimuat.");
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setStudents(data.students);
        setEdits(Object.fromEntries(data.students.map((student) => [student.id, {
          applicationStatus: student.application_status,
          selectionStatus: student.selection_status,
          finalStatus: student.final_status,
          note: student.admin_note || "",
        }])));
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const updateRecord = async (payload) => {
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/student-dashboard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Perubahan gagal disimpan.");
      setMessage(data.message);
      await loadStudents();
    } catch (updateError) {
      setError(updateError.message);
    }
  };

  const setEdit = (studentId, key, value) => {
    setEdits((current) => ({
      ...current,
      [studentId]: { ...current[studentId], [key]: value },
    }));
  };

  const visibleStudents = students.filter((student) => {
    const matchesSearch = `${student.nama} ${student.registration_code || ""} ${student.nisn || ""} ${student.email || ""} ${student.phone || ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = mode === "payments"
      ? statusFilter === "all" || student.payments.some((payment) => payment.payment_status === statusFilter)
      : statusFilter === "all" || student.application_status === statusFilter;
    return matchesSearch && matchesStatus && (mode !== "payments" || student.payments.length > 0);
  });
  const allPayments = students.flatMap((student) => student.payments);
  const waitingPayments = allPayments.filter((payment) => payment.payment_status === "pending").length;
  const approvedPayments = allPayments.filter((payment) => payment.payment_status === "paid").length;
  const approvedAmount = allPayments.reduce((sum, payment) => (
    payment.payment_status === "paid" ? sum + Number(payment.amount) : sum
  ), 0);

  if (loading) return <>
    <PortalNav name={nama} roleLabel="Administrator" items={[
      { label: "Ringkasan", href: "/dashboard/admin" },
      { label: "Calon siswa", href: "/dashboard/admin/siswa" },
      { label: "Akun", href: "/dashboard/admin/akun" },
      { label: "Pembayaran", href: "/dashboard/admin/pembayaran" },
      { label: "Pengumuman", href: "/dashboard/admin/pengumuman" },
    ]} />
    <main className="review-page">Memuat data siswa...</main>
  </>;

  return <>
    <PortalNav name={nama} roleLabel="Administrator" items={[
      { label: "Ringkasan", href: "/dashboard/admin" },
      { label: "Calon siswa", href: "/dashboard/admin/siswa" },
      { label: "Akun", href: "/dashboard/admin/akun" },
      { label: "Pembayaran", href: "/dashboard/admin/pembayaran" },
      { label: "Pengumuman", href: "/dashboard/admin/pengumuman" },
    ]} />
    <main className="review-page">
      <header className="review-header">
        <div><span className="review-kicker">PORTAL SPMB • ADMINISTRATOR</span><h1>{mode === "payments" ? "Verifikasi pembayaran" : "Review pendaftaran"}</h1><p>Selamat datang, {nama}. {mode === "payments" ? "Pantau dan verifikasi pembayaran daftar ulang calon siswa." : "Tinjau data pendaftar, dokumen, dan progres seleksi."}</p></div>
      </header>
      {(error || message) && <p className={`review-message ${error ? "error" : "success"}`} role="status">{error || message}</p>}
      {mode === "payments" && <section className="review-stats">
        <article><small>Menunggu verifikasi</small><strong>{waitingPayments}</strong></article>
        <article><small>Pembayaran disetujui</small><strong>{approvedPayments}</strong></article>
        <article><small>Dana terverifikasi</small><strong>Rp {approvedAmount.toLocaleString("id-ID")}</strong></article>
      </section>}
      <section className="review-filters" aria-label="Filter pendaftar">
        <label>Cari pendaftar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama, kode, NISN, atau email" /></label>
        <label>{mode === "payments" ? "Status pembayaran" : "Status berkas"}<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">Semua status</option>
          {(mode === "payments" ? paymentOptions : applicationOptions).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select></label>
        <span>{visibleStudents.length} data</span>
      </section>
      {visibleStudents.length === 0 ? <section className="review-empty">{mode === "payments" ? "Belum ada data pembayaran yang cocok." : "Belum ada pendaftaran siswa yang cocok."}</section> : <div className="review-list">
        {visibleStudents.map((student) => {
          const edit = edits[student.id] || {};
          return <article className="review-card" key={student.id}>
            <header className="review-student-head">
              <div><span>{student.registration_code || "Kode belum tersedia"}</span><h2>{student.nama}</h2><p>{student.email || student.phone} • NISN {student.nisn || "belum diisi"} • {student.jenjang || "Jenjang belum dipilih"}</p></div>
              <span className="review-count">{student.documents.length}/5 dokumen</span>
            </header>

            {mode === "students" && <section className="review-section">
              <h3>Dokumen</h3>
              {student.documents.length === 0 ? <p className="review-muted">Belum ada dokumen yang diunggah.</p> : <div className="review-docs">
                {student.documents.map((document) => {
                  const noteKey = `document-${student.id}-${document.document_type}`;
                  return <div className="review-row" key={document.document_type}>
                    <div><b>{document.document_type.replaceAll("_", " ")}</b><small>{document.original_name}</small></div>
                    <a href={`/api/admin/student-dashboard/documents/${student.id}/${document.document_type}`}>Buka file</a>
                    <input aria-label={`Catatan dokumen ${document.document_type}`} placeholder="Catatan review" value={notes[noteKey] ?? document.review_note ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [noteKey]: event.target.value }))} />
                    <select aria-label={`Status dokumen ${document.document_type}`} value={document.verification_status} onChange={(event) => updateRecord({ action: "document", studentId: student.id, documentType: document.document_type, status: event.target.value, note: notes[noteKey] ?? document.review_note ?? "" })}>{documentOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
                  </div>;
                })}
              </div>}
            </section>}

            <section className="review-section">
              <h3>Bukti pembayaran</h3>
              {student.payments.length === 0 ? <p className="review-muted">Belum ada bukti pembayaran.</p> : <div className="review-payment-history">
                {student.payments.map((payment) => {
                  const noteKey = `payment-${payment.id}`;
                  return <div className="review-row" key={payment.id}>
                    <div><b>{payment.stage} · Rp {Number(payment.amount).toLocaleString("id-ID")}</b><small>{payment.original_name} · {new Date(payment.created_at).toLocaleDateString("id-ID")}</small></div>
                    <a href={`/api/admin/student-dashboard/payments/${payment.id}`}>Buka bukti</a>
                    <input aria-label={`Catatan pembayaran ${payment.id}`} placeholder="Catatan review" value={notes[noteKey] ?? payment.review_note ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [noteKey]: event.target.value }))} />
                    <select aria-label={`Status pembayaran ${payment.id}`} value={payment.payment_status} onChange={(event) => updateRecord({ action: "payment", paymentId: payment.id, status: event.target.value, note: notes[noteKey] ?? payment.review_note ?? "" })}>{paymentOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
                  </div>;
                })}
              </div>}
            </section>

            {mode === "students" && <section className="review-section review-progress">
              <h3>Status aplikasi & seleksi</h3>
              <div className="review-fields">
                <label>Status berkas<select value={edit.applicationStatus || "draft"} onChange={(event) => setEdit(student.id, "applicationStatus", event.target.value)}>{applicationOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                <label>Status seleksi<select value={edit.selectionStatus || "not_started"} onChange={(event) => setEdit(student.id, "selectionStatus", event.target.value)}>{selectionOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
                <label>Hasil akhir<select value={edit.finalStatus || "pending"} onChange={(event) => setEdit(student.id, "finalStatus", event.target.value)}>{finalOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
              </div>
              <label className="review-note-field">Catatan untuk siswa<textarea value={edit.note || ""} onChange={(event) => setEdit(student.id, "note", event.target.value)} maxLength={500} /></label>
              <button type="button" className="review-save" onClick={() => updateRecord({ action: "application", studentId: student.id, applicationStatus: edit.applicationStatus || "draft", selectionStatus: edit.selectionStatus || "not_started", finalStatus: edit.finalStatus || "pending", note: edit.note || "" })}>Simpan status</button>
            </section>}
          </article>;
        })}
      </div>}
    </main>
  </>;
}