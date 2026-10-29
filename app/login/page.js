"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ id: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login gagal.");
        return;
      }

      const dashboards = {
        calon_siswa: "/dashboard/calon-siswa",
        admin: "/dashboard/admin",
        kepsek: "/dashboard/kepsek",
      };
      const destination = dashboards[data.user?.role];

      if (!destination) {
        setError("Role akun tidak dikenali.");
        return;
      }

      router.push(destination);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Masuk Akun Siswa"
      subtitle="Masuk untuk melanjutkan pendaftaran SPMB Citra Negara."
      footer={<>Belum punya akun? <Link href="/register">Daftar sekarang</Link></>}
    >
      <form onSubmit={onSubmit} noValidate>
        {error && <div className="form-err">{error}</div>}
        <div className="field">
          <label>Email atau Nomor HP</label>
          <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="nama@email.com atau 08xxxxxxxxxx" autoComplete="username" />
        </div>
        <div className="field">
          <label>Kata Sandi</label>
          <div className="pw">
            <input type={show ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Masukkan kata sandi" autoComplete="current-password" />
            <button type="button" onClick={() => setShow(!show)}>{show ? "Sembunyikan" : "Lihat"}</button>
          </div>
          <a
            className="password-help"
            href="https://wa.me/6281234567890?text=Halo%20Panitia%20SPMB%20Citra%20Negara%2C%20saya%20memerlukan%20bantuan%20reset%20kata%20sandi%20akun.%20Saya%20siap%20memberikan%20email%20atau%20nomor%20HP%20terdaftar%20untuk%20verifikasi."
            target="_blank"
            rel="noreferrer"
          >
            Lupa kata sandi? Hubungi panitia
          </a>
        </div>
        <button className="auth-submit" disabled={loading}>
          {loading ? "Memproses..." : "Masuk ke Dashboard"}
        </button>
      </form>
    </AuthShell>
  );
}