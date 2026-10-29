"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "../components/AuthShell";

const init = { identity: "", password: "", confirm: "", agree: false };

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState(init);
  const [errs, setErrs] = useState({});
  const [show, setShow] = useState(false);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const validate = () => {
    const e = {};
    const identity = f.identity.trim();
    if (!/^\S+@\S+\.\S+$/.test(identity) && !/^(08|628)\d{8,11}$/.test(identity.replace(/[^\d+]/g, ""))) {
      e.identity = "Masukkan email atau nomor HP yang valid.";
    }
    if (f.password.length < 8) e.password = "Minimal 8 karakter.";
    if (f.confirm !== f.password) e.confirm = "Kata sandi tidak sama.";
    if (!f.agree) e.agree = "Setujui syarat & ketentuan.";
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    setApiError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Pendaftaran gagal.");
        return;
      }

      router.push("/login");
    } catch {
      setApiError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ k, label, ...p }) => (
    <div className={`field ${errs[k] ? "err" : ""}`}>
      <label>{label}</label>
      <input value={f[k]} onChange={set(k)} {...p} />
      {errs[k] && <small>{errs[k]}</small>}
    </div>
  );

  return (
    <AuthShell
      title="Buat Akun SPMB"
      subtitle="Daftar dengan email atau nomor HP. Data setiap siswa dapat ditambahkan nanti di dashboard."
      footer={<>Sudah punya akun? <Link href="/login">Masuk</Link></>}
    >
      <form onSubmit={onSubmit} noValidate>
        {apiError && <div className="form-err">{apiError}</div>}
        {Field({ k: "identity", label: "Email atau Nomor HP", placeholder: "nama@email.com atau 08xxxxxxxxxx", autoComplete: "username" })}
        <div className="row2">
          <div className={`field ${errs.password ? "err" : ""}`}>
            <label>Kata Sandi</label>
            <div className="pw">
              <input type={show ? "text" : "password"} value={f.password} onChange={set("password")} placeholder="Min. 8 karakter" />
              <button type="button" onClick={() => setShow(!show)}>{show ? "Tutup" : "Lihat"}</button>
            </div>
            {errs.password && <small>{errs.password}</small>}
          </div>
          {Field({ k: "confirm", label: "Ulangi Kata Sandi", type: show ? "text" : "password", placeholder: "Ulangi kata sandi" })}
        </div>
        <label className="check">
          <input type="checkbox" checked={f.agree} onChange={set("agree")} />
          <span>Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi SPMB Citra Negara.{errs.agree && <b style={{ color: "#dc2626" }}> {errs.agree}</b>}</span>
        </label>
        <button className="auth-submit" disabled={loading}>
          {loading ? "Mendaftarkan..." : "Buat Akun"}
        </button>
      </form>
    </AuthShell>
  );
}