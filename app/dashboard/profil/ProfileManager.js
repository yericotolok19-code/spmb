"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import "./profile.css";

export default function ProfileManager({ onClose, onAvatarChanged, mode = "dialog" }) {
  const router = useRouter();
  const fileInput = useRef(null);
  const [form, setForm] = useState({ nama: "", email: "", phone: "", role: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [hasAvatar, setHasAvatar] = useState(false);
  const [avatarRevision, setAvatarRevision] = useState(0);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (mode === "dialog") {
      document.body.classList.add("profile-dialog-open");
      const handleKeyDown = (event) => {
        if (event.key === "Escape") onClose?.();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.classList.remove("profile-dialog-open");
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [mode, onClose]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Profil gagal dimuat.");
        return data.user;
      })
      .then((user) => {
        if (!cancelled) {
          setForm(user);
          setHasAvatar(Boolean(user.hasAvatar));
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const updateForm = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const updatePassword = (event) => {
    setPasswords((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const updateAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Foto profil harus berformat JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Ukuran foto profil maksimal 3 MB.");
      return;
    }

    setPhotoBusy(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Foto profil gagal diperbarui.");
      setHasAvatar(true);
      setAvatarRevision((revision) => revision + 1);
      onAvatarChanged?.(true);
      setMessage(data.message);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removeAvatar = async () => {
    setPhotoBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Foto profil gagal dihapus.");
      setHasAvatar(false);
      onAvatarChanged?.(false);
      setMessage(data.message);
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...passwords }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Profil gagal diperbarui.");
      setForm(data.user);
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage(data.message);
      router.refresh();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  const roleLabel = form.role === "kepsek" ? "Kepala sekolah" : form.role === "admin" ? "Administrator" : "Calon siswa";
  const content = (
    <>
      {error && <p className="profile-alert is-error" role="alert">{error}</p>}
      {message && <p className="profile-alert is-success" role="status">{message}</p>}
      {loading ? <div className="profile-loading">Memuat profil...</div> : (
        <form className="profile-form" onSubmit={submit}>
          <section className="profile-photo-row" aria-label="Foto profil">
            <span className="profile-photo">
              {hasAvatar && (
                <Image
                  src={`/api/profile/avatar?v=${avatarRevision}`}
                  alt=""
                  width={72}
                  height={72}
                  unoptimized
                  onError={() => setHasAvatar(false)}
                />
              )}
              {!hasAvatar && (form.nama.trim().charAt(0).toUpperCase() || "U")}
            </span>
            <div className="profile-photo-copy">
              <strong>Foto profil</strong>
              <small>JPG, PNG, atau WEBP · maksimal 3 MB</small>
              <div className="profile-photo-actions">
                <button type="button" onClick={() => fileInput.current?.click()} disabled={photoBusy}>
                  {photoBusy ? "Memproses..." : hasAvatar ? "Ganti foto" : "Unggah foto"}
                </button>
                {hasAvatar && <button type="button" className="profile-remove-photo" onClick={removeAvatar} disabled={photoBusy}>Hapus</button>}
              </div>
              <input ref={fileInput} className="profile-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={updateAvatar} />
            </div>
          </section>
          <div className="profile-fields">
            <label>Nama lengkap<input name="nama" value={form.nama} onChange={updateForm} maxLength={100} autoComplete="name" required /></label>
            <label>Email<input name="email" type="email" value={form.email || ""} onChange={updateForm} maxLength={255} autoComplete="email" /></label>
            <label>Nomor HP<input name="phone" type="tel" value={form.phone || ""} onChange={updateForm} maxLength={20} autoComplete="tel" /></label>
          </div>
          <p className="profile-tip">Isi minimal satu metode login: email atau nomor HP.</p>
          <details className="profile-password">
            <summary>Ubah password</summary>
            <p>Password saat ini harus dimasukkan untuk mengonfirmasi perubahan password.</p>
            <div className="profile-fields">
              <label>Password saat ini<input name="currentPassword" type="password" value={passwords.currentPassword} onChange={updatePassword} autoComplete="current-password" /></label>
              <label>Password baru<input name="newPassword" type="password" value={passwords.newPassword} onChange={updatePassword} minLength={8} maxLength={72} autoComplete="new-password" /></label>
              <label>Konfirmasi password baru<input name="confirmPassword" type="password" value={passwords.confirmPassword} onChange={updatePassword} minLength={8} maxLength={72} autoComplete="new-password" /></label>
            </div>
            <small>Minimal 8 karakter. Kosongkan ketiga kolom untuk tidak mengubah password.</small>
          </details>
          <footer className="profile-form-footer">
            <span>{roleLabel} · perubahan hanya berlaku untuk akun Anda.</span>
            <button type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan perubahan"}</button>
          </footer>
        </form>
      )}
    </>
  );

  if (mode === "page") {
    return (
      <main className="self-profile-page">
        <header className="self-profile-heading">
          <span className="profile-kicker">PENGATURAN AKUN</span>
          <h1>Profil saya</h1>
          <p>Perbarui informasi login dan keamanan akun Anda.</p>
        </header>
        <section className="self-profile-card">{content}</section>
      </main>
    );
  }

  return typeof document === "undefined" ? null : createPortal((
    <div className="profile-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
        <header className="profile-modal-heading">
          <div><span className="profile-kicker">PENGATURAN AKUN</span><h2 id="profile-modal-title">Profil saya</h2></div>
          <button type="button" className="profile-modal-close" onClick={onClose} aria-label="Tutup profil">×</button>
        </header>
        <p className="profile-modal-description">Perbarui informasi akun dan keamanan Anda.</p>
        {content}
      </section>
    </div>
  ), document.body);
}
