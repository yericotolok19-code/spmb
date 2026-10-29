import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import db from "../../../../lib/db";
import PortalNav from "../../../components/PortalNav";
import "../kepsek.css";

export const instant = false;

const formatNumber = (value) => Number(value || 0).toLocaleString("id-ID");
const formatMoney = (value) => `Rp ${formatNumber(value)}`;

export default async function KepsekReportsPage() {
  const session = await getSession();
  if (!session || session.role !== "kepsek") redirect("/login");

  const [applicationStats] = await db.execute(
    `SELECT p.jenjang,
            COUNT(*) AS applicants,
            SUM(a.application_status = 'submitted') AS awaiting_review,
            SUM(a.application_status = 'verified') AS verified,
            SUM(a.selection_status = 'passed') AS passed,
            SUM(a.final_status = 'accepted') AS accepted,
            SUM(a.final_status = 'rejected') AS rejected
     FROM student_profiles p
     INNER JOIN student_applications a ON a.student_id = p.id
     GROUP BY p.jenjang
     ORDER BY p.jenjang`
  );
  const [financialStats] = await db.execute(
    `SELECT p.jenjang,
            COUNT(payment.id) AS transactions,
            SUM(payment.payment_status = 'paid') AS paid_count,
            SUM(payment.payment_status = 'pending') AS pending_count,
            SUM(payment.payment_status = 'rejected') AS rejected_count,
            COALESCE(SUM(CASE WHEN payment.payment_status = 'paid' THEN payment.amount ELSE 0 END), 0) AS received
     FROM student_profiles p
     LEFT JOIN student_payments payment ON payment.student_id = p.id
     GROUP BY p.jenjang
     ORDER BY p.jenjang`
  );
  const [[totals]] = await db.execute(
    `SELECT COUNT(*) AS applicants,
            SUM(application_status = 'submitted') AS awaiting_review,
            SUM(application_status = 'verified') AS verified,
            SUM(selection_status = 'passed') AS passed,
            SUM(final_status = 'accepted') AS accepted
     FROM student_applications`
  );
  const [[finance]] = await db.execute(
    `SELECT COUNT(*) AS transactions,
            COALESCE(SUM(payment_status = 'paid'), 0) AS paid_count,
            COALESCE(SUM(payment_status = 'pending'), 0) AS pending_count,
            COALESCE(SUM(payment_status = 'rejected'), 0) AS rejected_count,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END), 0) AS received
     FROM student_payments`
  );

  return <>
    <PortalNav name={session.nama} roleLabel="Kepala sekolah" items={[
      { label: "Ringkasan", href: "/dashboard/kepsek" },
      { label: "Laporan & keuangan", href: "/dashboard/kepsek/laporan" },
      { label: "Pengumuman", href: "/dashboard/kepsek/pengumuman" },
    ]} />
    <main className="kepsek-report-page">
      <header className="kepsek-page-heading"><span className="kepsek-eyebrow">DASHBOARD PIMPINAN</span><h1>Laporan penerimaan & keuangan</h1><p>Rekap operasional SPMB dari data pendaftaran dan pembayaran yang tersimpan.</p></header>
      <section className="kepsek-report-block" aria-label="Statistik penerimaan">
        <div className="kepsek-report-heading"><div><span className="kepsek-eyebrow">STATISTIK PENDAFTARAN</span><h2>Progres penerimaan</h2></div></div>
        <div className="kepsek-stat-grid report-total-grid">
          {[["Pendaftar", totals.applicants], ["Menunggu review", totals.awaiting_review], ["Terverifikasi", totals.verified], ["Lulus seleksi", totals.passed], ["Diterima", totals.accepted]].map(([label, value]) => <article key={label}><small>{label}</small><strong>{formatNumber(value)}</strong></article>)}
        </div>
        <div className="kepsek-table-wrap"><table className="kepsek-report-table"><thead><tr><th>Jenjang</th><th>Pendaftar</th><th>Menunggu review</th><th>Terverifikasi</th><th>Lulus</th><th>Diterima</th><th>Tidak diterima</th></tr></thead><tbody>
          {applicationStats.length === 0 ? <tr><td colSpan="7">Belum ada data pendaftaran.</td></tr> : applicationStats.map((row) => <tr key={row.jenjang}><th>{row.jenjang || "Belum dipilih"}</th><td>{formatNumber(row.applicants)}</td><td>{formatNumber(row.awaiting_review)}</td><td>{formatNumber(row.verified)}</td><td>{formatNumber(row.passed)}</td><td>{formatNumber(row.accepted)}</td><td>{formatNumber(row.rejected)}</td></tr>)}
        </tbody></table></div>
      </section>
      <section className="kepsek-report-block" id="keuangan" aria-label="Laporan keuangan">
        <div className="kepsek-report-heading"><div><span className="kepsek-eyebrow">LAPORAN KEUANGAN</span><h2>Daftar ulang siswa</h2></div><p>Dana diterima merupakan akumulasi semua cicilan yang telah disetujui.</p></div>
        <div className="kepsek-stat-grid finance-total-grid">
          {[["Dana terverifikasi", formatMoney(finance.received)], ["Transaksi disetujui", finance.paid_count], ["Menunggu verifikasi", finance.pending_count], ["Perlu diperbaiki", finance.rejected_count]].map(([label, value]) => <article key={label}><small>{label}</small><strong>{typeof value === "number" ? formatNumber(value) : value}</strong></article>)}
        </div>
        <div className="kepsek-table-wrap"><table className="kepsek-report-table"><thead><tr><th>Jenjang</th><th>Transaksi aktif</th><th>Disetujui</th><th>Menunggu</th><th>Ditolak</th><th>Dana diterima</th></tr></thead><tbody>
          {financialStats.length === 0 ? <tr><td colSpan="6">Belum ada data keuangan.</td></tr> : financialStats.map((row) => <tr key={row.jenjang}><th>{row.jenjang || "Belum dipilih"}</th><td>{formatNumber(row.transactions)}</td><td>{formatNumber(row.paid_count)}</td><td>{formatNumber(row.pending_count)}</td><td>{formatNumber(row.rejected_count)}</td><td>{formatMoney(row.received)}</td></tr>)}
        </tbody></table></div>
      </section>
    </main>
  </>;
}
