import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import db from "../../../lib/db";
import PortalNav from "../../components/PortalNav";
import "./kepsek.css";

export const instant = false;

export default async function KepsekDashboard() {
  const session = await getSession();
  if (!session || session.role !== "kepsek") redirect("/login");

  const [[applications]] = await db.execute(
    `SELECT COUNT(*) AS total,
            SUM(application_status = 'submitted') AS awaiting_review,
            SUM(application_status = 'verified') AS verified,
            SUM(selection_status = 'passed') AS passed,
            SUM(final_status = 'accepted') AS accepted
     FROM student_applications`
  );
  const [[payments]] = await db.execute(
    `SELECT SUM(payment_status = 'paid') AS paid_count,
            SUM(payment_status = 'pending') AS pending_count,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS received
     FROM student_payments`
  );
  const [applicationByLevel] = await db.execute(
    `SELECT p.jenjang, COUNT(*) AS applicants,
            SUM(a.application_status = 'submitted') AS awaiting_review,
            SUM(a.application_status = 'verified') AS verified,
            SUM(a.final_status = 'accepted') AS accepted
     FROM student_profiles p
     INNER JOIN student_applications a ON a.student_id = p.id
     GROUP BY p.jenjang
     ORDER BY p.jenjang`
  );
  const [paymentsByLevel] = await db.execute(
    `SELECT p.jenjang, COUNT(payment.id) AS transactions,
            SUM(payment.payment_status = 'paid') AS paid_count,
            SUM(payment.payment_status = 'pending') AS pending_count,
            COALESCE(SUM(CASE WHEN payment.payment_status = 'paid' THEN payment.amount ELSE 0 END), 0) AS received
     FROM student_profiles p
     LEFT JOIN student_payments payment ON payment.student_id = p.id
     GROUP BY p.jenjang
     ORDER BY p.jenjang`
  );
  const [recentApplications] = await db.execute(
    `SELECT p.nama, p.jenjang, a.registration_code, a.application_status,
            a.final_status, a.created_at
     FROM student_applications a
     INNER JOIN student_profiles p ON p.id = a.student_id
     ORDER BY a.created_at DESC
     LIMIT 6`
  );
  const [[recentTrend]] = await db.execute(
    `SELECT COUNT(*) AS last_seven_days
     FROM student_applications
     WHERE created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)`
  );
  const items = [
    ["Total pendaftar", applications.total],
    ["Berkas terverifikasi", applications.verified],
    ["Lulus seleksi", applications.passed],
    ["Diterima", applications.accepted],
    ["Menunggu pembayaran", payments.pending_count],
    ["Dana daftar ulang", `Rp ${Number(payments.received || 0).toLocaleString("id-ID")}`],
    ["Pendaftar 7 hari terakhir", recentTrend.last_seven_days],
  ];
  const formatMoney = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

  return <>
    <PortalNav name={session.nama} roleLabel="Kepala sekolah" items={[
      { label: "Ringkasan", href: "/dashboard/kepsek" },
      { label: "Laporan & keuangan", href: "/dashboard/kepsek/laporan" },
      { label: "Pengumuman", href: "/dashboard/kepsek/pengumuman" },
    ]} />
    <main className="kepsek-page">
      <section className="kepsek-welcome">
        <span className="kepsek-eyebrow">PORTAL PIMPINAN · SPMB 2026/2027</span>
        <h1>Selamat datang,<br /><em>{session.nama}</em></h1>
        <p>Pantau perkembangan penerimaan murid baru dan ringkasan keuangan daftar ulang.</p>
        <Link href="/dashboard/kepsek/laporan" className="kepsek-cta">Buka laporan lengkap <span aria-hidden="true">→</span></Link>
      </section>
      <section className="kepsek-report">
        <header><div><span className="kepsek-eyebrow">PANTAUAN LANGSUNG</span><h2>Ikhtisar SPMB</h2></div><p>Angka diperbarui dari data pendaftaran dan transaksi pembayaran yang tercatat.</p></header>
        <div className="kepsek-stat-grid">
          {items.map(([label, value]) => <article key={label}><small>{label}</small><strong>{Number.isFinite(Number(value)) ? Number(value).toLocaleString("id-ID") : value}</strong></article>)}
        </div>
        <div className="kepsek-monitor-grid">
          <section className="kepsek-monitor-card">
            <header><div><span className="kepsek-eyebrow">PEMETAAN PENDAFTAR</span><h3>Progres per jenjang</h3></div><Link href="/dashboard/kepsek/laporan">Laporan lengkap →</Link></header>
            {applicationByLevel.length === 0 ? <p className="kepsek-empty">Belum ada data pendaftaran.</p> : applicationByLevel.map((level) => {
              const total = Number(level.applicants || 0);
              const verified = Number(level.verified || 0);
              const accepted = Number(level.accepted || 0);
              const paymentLevel = paymentsByLevel.find((item) => item.jenjang === level.jenjang);
              return <article className="kepsek-level-row" key={level.jenjang}>
                <div className="kepsek-level-heading"><b>{level.jenjang || "Belum dipilih"}</b><strong>{total} pendaftar</strong></div>
                <div className="kepsek-level-bar" role="img" aria-label={`${verified} dari ${total} berkas terverifikasi`}>
                  <span style={{ width: `${total ? Math.min(100, (verified / total) * 100) : 0}%` }} />
                </div>
                <div className="kepsek-level-meta"><span>{level.awaiting_review || 0} menunggu review</span><span>{verified} terverifikasi</span><span>{accepted} diterima</span></div>
                <small className="kepsek-level-finance">{formatMoney(paymentLevel?.received)} diterima · {paymentLevel?.pending_count || 0} transaksi menunggu</small>
              </article>;
            })}
          </section>
          <section className="kepsek-monitor-card kepsek-recent-card">
            <header><div><span className="kepsek-eyebrow">AKTIVITAS TERBARU</span><h3>Pendaftar terbaru</h3></div><Link href="/dashboard/kepsek/laporan">Lihat laporan →</Link></header>
            {recentApplications.length === 0 ? <p className="kepsek-empty">Belum ada pendaftar baru.</p> : <div className="kepsek-recent-list">
              {recentApplications.map((application) => <article key={application.registration_code}>
                <span className="kepsek-recent-avatar">{application.nama.trim().charAt(0).toUpperCase() || "S"}</span>
                <div><b>{application.nama}</b><small>{application.registration_code} · {application.jenjang}</small></div>
                <span className={`kepsek-status status-${application.application_status}`}>{application.application_status === "verified" ? "Terverifikasi" : application.application_status === "submitted" ? "Menunggu" : application.application_status === "revision" ? "Revisi" : "Draft"}</span>
              </article>)}
            </div>}
          </section>
        </div>
        <div className="kepsek-grid">
          <Link href="/dashboard/kepsek/laporan" className="kepsek-tile tile-green"><span className="kepsek-tile-icon">01</span><small>STATISTIK</small><h3>Laporan penerimaan</h3><p>Analisis pendaftar, verifikasi berkas, serta hasil seleksi per jenjang.</p><b>Buka laporan →</b></Link>
          <Link href="/dashboard/kepsek/laporan#keuangan" className="kepsek-tile tile-blue"><span className="kepsek-tile-icon">02</span><small>KEUANGAN</small><h3>Rekap daftar ulang</h3><p>Pantau penerimaan pembayaran, transaksi menunggu, dan rekap per jenjang.</p><b>Lihat rekap →</b></Link>
          <Link href="/dashboard/kepsek/pengumuman" className="kepsek-tile tile-yellow"><span className="kepsek-tile-icon">03</span><small>KOMUNIKASI</small><h3>Pengumuman resmi</h3><p>Terbitkan informasi yang akan dilihat calon siswa terverifikasi.</p><b>Kelola pengumuman →</b></Link>
        </div>
      </section>
    </main>
  </>;
}
