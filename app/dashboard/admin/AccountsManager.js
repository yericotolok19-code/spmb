"use client";

import { useEffect, useMemo, useState } from "react";
import PortalNav from "../../components/PortalNav";

const roles = [
  ["calon_siswa", "Calon siswa"],
  ["admin", "Administrator"],
  ["kepsek", "Kepala sekolah"],
];

const emptyAccount = { nama: "", email: "", phone: "", role: "calon_siswa", password: "" };
const navItems = [
  { label: "Ringkasan", href: "/dashboard/admin" },
  { label: "Calon siswa", href: "/dashboard/admin/siswa" },
  { label: "Akun", href: "/dashboard/admin/akun" },
  { label: "Pembayaran", href: "/dashboard/admin/pembayaran" },
  { label: "Pengumuman", href: "/dashboard/admin/pengumuman" },
];

const roleLabel = (value) => roles.find(([role]) => role === value)?.[1] || value;

export default function AccountsManager({ nama, currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const loadUsers = async () => {
    const response = await fetch("/api/admin/users", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Daftar akun gagal dimuat.");
    setUsers(data.users);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Daftar akun gagal dimuat.");
        return data;
      })
      .then((data) => {
        if (!cancelled) setUsers(data.users);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = `${user.nama} ${user.email || ""} ${user.phone || ""} ${user.id}`
        .toLowerCase()
        .includes(normalizedSearch);
      return matchesSearch && (roleFilter === "all" || user.role === roleFilter);
    });
  }, [users, search, roleFilter]);

  const openCreate = () => {
    setError("");
    setMessage("");
    setAccountForm(emptyAccount);
    setModal({ type: "create" });
  };

  const openEdit = (user) => {
    setError("");
    setMessage("");
    setAccountForm({
      nama: user.nama || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role,
      password: "",
    });
    setModal({ type: "edit", user });
  };

  const openReset = (user) => {
    setError("");
    setMessage("");
    setAccountForm({ ...emptyAccount, password: "" });
    setPasswordConfirm("");
    setModal({ type: "password", user });
  };

  const closeModal = () => {
    if (busy) return;
    setModal(null);
    setDeleteConfirmation("");
    setError("");
  };

  const submitAccount = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const isEdit = modal.type === "edit";
      const response = await fetch(
        isEdit ? `/api/admin/users/${modal.user.id}` : "/api/admin/users",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(accountForm),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Perubahan akun gagal disimpan.");
      setMessage(data.message);
      setModal(null);
      await loadUsers();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    if (accountForm.password !== passwordConfirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${modal.user.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: accountForm.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Password gagal direset.");
      setMessage(data.message);
      setModal(null);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteUser = async (event) => {
    event.preventDefault();
    if (deleteConfirmation !== "HAPUS") return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${modal.user.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Akun gagal dihapus.");
      setMessage(data.message);
      setModal(null);
      setDeleteConfirmation("");
      await loadUsers();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  const beginDelete = (user) => {
    setError("");
    setMessage("");
    setDeleteConfirmation("");
    setModal({ type: "delete", user });
  };

  return (
    <>
      <PortalNav name={nama} roleLabel="Administrator" items={navItems} />
      <main className="review-page accounts-page">
        <header className="review-header accounts-header">
          <div>
            <span className="review-kicker">PORTAL SPMB • ADMINISTRATOR</span>
            <h1>Kelola akun pengguna</h1>
            <p>Tambah akun, ubah informasi dan role, reset password, atau hapus akun.</p>
          </div>
          <button className="review-save" type="button" onClick={openCreate}>+ Tambah akun</button>
        </header>

        {(error || message) && !modal && (
          <p className={`review-message ${error ? "error" : "success"}`} role="status">{error || message}</p>
        )}

        <section className="account-summary" aria-label="Ringkasan akun">
          <article><small>Total akun</small><strong>{users.length}</strong></article>
          <article><small>Calon siswa</small><strong>{users.filter((user) => user.role === "calon_siswa").length}</strong></article>
          <article><small>Administrator</small><strong>{users.filter((user) => user.role === "admin").length}</strong></article>
          <article><small>Kepala sekolah</small><strong>{users.filter((user) => user.role === "kepsek").length}</strong></article>
        </section>

        <section className="account-toolbar" aria-label="Pencarian akun">
          <label>
            Cari akun
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama, email, nomor HP, atau ID" />
          </label>
          <label>
            Role
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="all">Semua role</option>
              {roles.map(([role, label]) => <option value={role} key={role}>{label}</option>)}
            </select>
          </label>
          <span>{visibleUsers.length} akun</span>
        </section>

        {loading ? <section className="review-empty">Memuat daftar akun...</section> :
          visibleUsers.length === 0 ? <section className="review-empty">Tidak ada akun yang cocok dengan pencarian.</section> :
            <div className="account-list">
              {visibleUsers.map((user) => (
                <article className="account-card" key={user.id}>
                  <div className="account-avatar" aria-hidden="true">{user.nama?.trim()?.charAt(0)?.toUpperCase() || "U"}</div>
                  <div className="account-info">
                    <div className="account-name-line">
                      <h2>{user.nama}</h2>
                      <span className={`account-role role-${user.role}`}>{roleLabel(user.role)}</span>
                    </div>
                    <p>{user.email || "Email belum diisi"} <span>·</span> {user.phone || "Nomor HP belum diisi"}</p>
                    <small>ID {user.id} · {Number(user.student_count) || 0} profil siswa terkait</small>
                  </div>
                  <div className="account-actions">
                    <button type="button" onClick={() => openEdit(user)}>Edit</button>
                    <button type="button" onClick={() => openReset(user)}>Reset password</button>
                    {String(user.id) !== String(currentUserId) && (
                      <button className="account-delete" type="button" onClick={() => beginDelete(user)}>Hapus</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
        }
      </main>

      {modal && (
        <div className="account-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          {modal.type === "delete" ? (
            <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
              <header>
                <span className="review-kicker">HAPUS AKUN</span>
                <button type="button" aria-label="Tutup" onClick={closeModal} disabled={busy}>×</button>
              </header>
              <h2 id="account-modal-title">Hapus akun {modal.user.nama}?</h2>
              <p className="account-warning">
                Tindakan ini permanen. Profil siswa, pendaftaran, dokumen, dan data pembayaran yang terhubung ke akun ini juga akan terhapus. Penghapusan tidak dapat dibatalkan.
              </p>
              {error && <p className="review-message error" role="alert">{error}</p>}
              <form onSubmit={deleteUser}>
                <label className="account-field">
                  Ketik <b>HAPUS</b> untuk mengonfirmasi
                  <input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" required />
                </label>
                <div className="account-modal-actions">
                  <button type="button" onClick={closeModal} disabled={busy}>Batal</button>
                  <button className="account-danger-button" type="submit" disabled={busy || deleteConfirmation !== "HAPUS"}>
                    {busy ? "Menghapus..." : "Hapus permanen"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <section className="account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title">
              <header>
                <span className="review-kicker">
                  {modal.type === "create" ? "TAMBAH AKUN" : modal.type === "password" ? "RESET PASSWORD" : "UBAH AKUN"}
                </span>
                <button type="button" aria-label="Tutup" onClick={closeModal} disabled={busy}>×</button>
              </header>
              <h2 id="account-modal-title">
                {modal.type === "create" ? "Buat akun pengguna" : modal.type === "password" ? `Reset password ${modal.user.nama}` : `Edit ${modal.user.nama}`}
              </h2>
              {modal.type === "password" ? (
                <>
                  <p className="account-modal-sub">Password baru disimpan sebagai hash dan tidak ditampilkan kembali setelah disimpan.</p>
                  {error && <p className="review-message error" role="alert">{error}</p>}
                  <form onSubmit={submitPassword}>
                    <label className="account-field">Password baru
                      <input type="password" value={accountForm.password} onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })} minLength={8} maxLength={72} autoComplete="new-password" required />
                    </label>
                    <label className="account-field">Konfirmasi password
                      <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} minLength={8} maxLength={72} autoComplete="new-password" required />
                    </label>
                    <div className="account-modal-actions">
                      <button type="button" onClick={closeModal} disabled={busy}>Batal</button>
                      <button className="review-save" type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan password baru"}</button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <p className="account-modal-sub">Isi minimal satu cara login: email atau nomor HP.</p>
                  {error && <p className="review-message error" role="alert">{error}</p>}
                  <form onSubmit={submitAccount}>
                    <label className="account-field">Nama
                      <input value={accountForm.nama} onChange={(event) => setAccountForm({ ...accountForm, nama: event.target.value })} maxLength={100} autoComplete="name" required />
                    </label>
                    <label className="account-field">Email
                      <input type="email" value={accountForm.email} onChange={(event) => setAccountForm({ ...accountForm, email: event.target.value })} maxLength={255} autoComplete="email" />
                    </label>
                    <label className="account-field">Nomor HP
                      <input type="tel" value={accountForm.phone} onChange={(event) => setAccountForm({ ...accountForm, phone: event.target.value })} maxLength={20} autoComplete="tel" />
                    </label>
                    <label className="account-field">Role
                      <select value={accountForm.role} onChange={(event) => setAccountForm({ ...accountForm, role: event.target.value })} disabled={modal.type === "edit" && String(modal.user.id) === String(currentUserId)}>
                        {roles.map(([role, label]) => <option value={role} key={role}>{label}</option>)}
                      </select>
                    </label>
                    {modal.type === "edit" && String(modal.user.id) === String(currentUserId) && (
                      <p className="account-modal-sub">Role akun administrator yang sedang digunakan tidak dapat diubah.</p>
                    )}
                    {modal.type === "create" && (
                      <label className="account-field">Password awal
                        <input type="password" value={accountForm.password} onChange={(event) => setAccountForm({ ...accountForm, password: event.target.value })} minLength={8} maxLength={72} autoComplete="new-password" required />
                      </label>
                    )}
                    <div className="account-modal-actions">
                      <button type="button" onClick={closeModal} disabled={busy}>Batal</button>
                      <button className="review-save" type="submit" disabled={busy}>{busy ? "Menyimpan..." : modal.type === "create" ? "Buat akun" : "Simpan perubahan"}</button>
                    </div>
                  </form>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
}
