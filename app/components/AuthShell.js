import Link from "next/link";
import Image from "next/image";
import "./auth.css";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="auth">
      <section className="auth-side">
        <Link href="/" className="auth-brand">
          <Image src="/cn.png" alt="Logo Yayasan At-Taqwa Kemiri Jaya" className="logo" width={54} height={54} priority />
          <span><strong>CITRA NEGARA</strong><small>Yayasan At-Taqwa Kemiri Jaya</small></span>
        </Link>
        <div className="auth-copy">
          <span className="badge b-gold">SPMB · SMP / SMA / SMK</span>
          <h1>Portal Calon Siswa <em>Citra Negara</em></h1>
          <p>Buat akun untuk mengisi formulir, mengunggah berkas, dan memantau hasil seleksi dari satu dashboard.</p>
          <ul>
            <li>✓ Pendaftaran online 10–15 menit</li>
            <li>✓ Pantau status verifikasi berkas</li>
            <li>✓ Pengumuman kelulusan transparan</li>
          </ul>
        </div>
        <small className="auth-note">🔒 Sistem Resmi SPMB • Yayasan At-Taqwa Kemiri Jaya</small>
      </section>
      <section className="auth-main">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="auth-sub">{subtitle}</p>
          {children}
          <p className="auth-foot">{footer}</p>
        </div>
        <Link href="/" className="auth-back">‹ Kembali ke beranda</Link>
      </section>
    </main>
  );
}