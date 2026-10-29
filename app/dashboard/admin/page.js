
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import db from "../../../lib/db";
import Link from "next/link";
import PortalNav from "../../components/PortalNav";
import "./review.css";

export const instant = false;

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  const [[applications]] = await db.execute(
    `SELECT COUNT(*) AS total,
            SUM(application_status = 'submitted') AS awaiting_review,
            SUM(application_status = 'verified') AS verified,
            SUM(final_status = 'accepted') AS accepted
     FROM student_applications`
  );
  const [[documents]] = await db.execute(
    "SELECT COUNT(*) AS pending FROM student_documents WHERE verification_status = 'pending'"
  );
  const [[payments]] = await db.execute(
    `SELECT SUM(payment_status = 'pending') AS awaiting_review,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS received
     FROM student_payments`
  );

  const stats = [
    ["Total pendaftaran", Number(applications.total || 0).toLocaleString("id-ID")],
    ["Menunggu review berkas", Number(applications.awaiting_review || 0).toLocaleString("id-ID")],
    ["Dokumen menunggu", Number(documents.pending || 0).toLocaleString("id-ID")],
    ["Pembayaran menunggu", Number(payments.awaiting_review || 0).toLocaleString("id-ID")],
    ["Berkas terverifikasi", Number(applications.verified || 0).toLocaleString("id-ID")],
    ["Dana terverifikasi", `Rp ${Number(payments.received || 0).toLocaleString("id-ID")}`],
  ];

  const links = [
    { href: "/dashboard/admin/siswa", title: "Review calon siswa", text: "Periksa berkas, status seleksi, dan catatan untuk pendaftar." },
    { href: "/dashboard/admin/akun", title: "Kelola akun pengguna", text: "Tambah akun, ubah role, reset password, dan kelola akses pengguna." },
    { href: "/dashboard/admin/pembayaran", title: "Verifikasi pembayaran", text: "Tinjau bukti transfer dan pantau daftar ulang." },
    { href: "/dashboard/admin/pengumuman", title: "Pengumuman", text: "Terbitkan informasi resmi untuk pendaftar terverifikasi." },
  ];
  const priorityHref = Number(applications.awaiting_review || 0) > 0
    ? "/dashboard/admin/siswa"
    : Number(payments.awaiting_review || 0) > 0
      ? "/dashboard/admin/pembayaran"
      : "/dashboard/admin/akun";
  const priorityLabel = Number(applications.awaiting_review || 0) > 0
    ? "Buka pendaftaran"
    : Number(payments.awaiting_review || 0) > 0
      ? "Buka pembayaran"
      : "Kelola akun pengguna";

  return <>
    <PortalNav name={session.nama} roleLabel="Administrator" items={[
      { label: "Ringkasan", href: "/dashboard/admin" },
      { label: "Calon siswa", href: "/dashboard/admin/siswa" },
      { label: "Akun", href: "/dashboard/admin/akun" },
      { label: "Pembayaran", href: "/dashboard/admin/pembayaran" },
      { label: "Pengumuman", href: "/dashboard/admin/pengumuman" },
    ]} />
    <main className="review-page admin-home">
      <header className="review-header">
        <div><span className="review-kicker">RUANG KERJA PANITIA</span><h1>Selamat datang, {session.nama}</h1><p>Ringkasan pekerjaan dan pintasan untuk mengelola proses SPMB.</p></div>
      </header>
      <section className="admin-priority" aria-label="Pekerjaan prioritas">
        <div><span className="admin-priority-label">LANGKAH BERIKUTNYA</span><h2>{Number(applications.awaiting_review || 0) > 0 ? "Periksa pendaftaran yang masuk" : Number(payments.awaiting_review || 0) > 0 ? "Verifikasi pembayaran tertunda" : "Semua antrean sedang terkendali"}</h2><p>{Number(applications.awaiting_review || 0) > 0 ? `${Number(applications.awaiting_review).toLocaleString("id-ID")} pendaftaran menunggu pemeriksaan berkas.` : Number(payments.awaiting_review || 0) > 0 ? `${Number(payments.awaiting_review).toLocaleString("id-ID")} bukti pembayaran menunggu verifikasi.` : "Pilih area kerja di bawah untuk meninjau data atau mengelola akun."}</p></div>
        <Link href={priorityHref}>{priorityLabel} <span aria-hidden="true">→</span></Link>
      </section>
      <section className="review-stats admin-stat-grid" aria-label="Statistik SPMB">
        {stats.map(([label, value]) => <article key={label}><small>{label}</small><strong>{value}</strong></article>)}
      </section>
      <header className="admin-section-heading"><div><span className="review-kicker">AKSES CEPAT</span><h2>Area kerja</h2></div><p>Pilih ruang kerja untuk melanjutkan proses SPMB.</p></header>
      <section className="admin-work-grid">
        {links.map((item) => <Link href={item.href} className="admin-work-card" key={item.href}>
          <span>SPMB · ADMIN</span><h2>{item.title}</h2><p>{item.text}</p><b>Buka halaman <span aria-hidden="true">→</span></b>
        </Link>)}
      </section>
    </main>
  </>;
}
