"use client";

import { useEffect, useState } from "react";
import "./announcement.css";

const emptyForm = { title: "", message: "" };

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  const filteredAnnouncements = announcements.filter((item) =>
    `${item.title} ${item.message} ${item.author}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  const loadAnnouncements = async () => {
    const response = await fetch("/api/announcements", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Pengumuman gagal dimuat.");
    setAnnouncements(data.announcements);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Pengumuman gagal dimuat.");
        return data;
      })
      .then((data) => {
        if (!cancelled) setAnnouncements(data.announcements);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveAnnouncement = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch("/api/announcements", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(editingId ? { id: editingId } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Pengumuman gagal disimpan.");
      setNotice(data.message);
      resetForm();
      await loadAnnouncements();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm("Hapus pengumuman ini?")) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      const response = await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Pengumuman gagal dihapus.");
      setNotice(data.message);
      if (editingId === id) resetForm();
      await loadAnnouncements();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="announcement-manager" id="pengumuman">
      <header className="announcement-heading">
        <div>
          <span className="announcement-kicker">INFORMASI PENDAFTARAN</span>
          <h2>Ruang pengumuman</h2>
          <p>Sampaikan informasi resmi kepada calon siswa melalui kanal pengumuman Citra Negara.</p>
        </div>
      </header>
      {(error || notice) && <p className={`announcement-alert ${error ? "is-error" : ""}`} role="status">{error || notice}</p>}

      <div className="announcement-layout">
        <div className="announcement-compose">
          <form className="announcement-form" onSubmit={saveAnnouncement}>
            <div className="announcement-compose-heading">
              <span className="announcement-compose-icon" aria-hidden="true">CN</span>
              <div><h3>{editingId ? "Ubah pengumuman" : "Tulis pengumuman"}</h3><p>Pesan akan terlihat oleh calon siswa terverifikasi.</p></div>
            </div>
            <label>
              Judul informasi
              <input placeholder="Contoh: Jadwal seleksi tahap 1" value={form.title} maxLength={160} required onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              Isi pesan
              <textarea placeholder="Tuliskan informasi dengan jelas dan ramah..." value={form.message} maxLength={3000} rows={6} required onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
              <small className="announcement-character-count">{form.message.length}/3.000 karakter</small>
            </label>
            <div className="announcement-form-actions">
              {editingId && <button type="button" className="announcement-cancel" onClick={resetForm}>Batal</button>}
              <button type="submit" disabled={busy}>{busy ? "Menyimpan..." : editingId ? "Simpan perubahan" : "Terbitkan pengumuman"} <span aria-hidden="true">↗</span></button>
            </div>
          </form>
          <div className="announcement-preview">
            <span className="announcement-preview-label">PRATINJAU PESAN</span>
            <article className="announcement-bubble is-preview">
              <div className="announcement-bubble-heading"><span className="announcement-avatar">CN</span><div><b>Panitia SPMB</b><small>Kanal resmi sekolah</small></div></div>
              <h4>{form.title.trim() || "Judul pengumuman"}</h4>
              <p>{form.message.trim() || "Isi informasi yang kamu tulis akan tampil seperti ini kepada calon siswa."}</p>
              <time>Sekarang <span aria-hidden="true">✓✓</span></time>
            </article>
          </div>
        </div>

        <section className="announcement-list-panel" aria-label="Daftar pengumuman">
          <div className="announcement-list-heading">
            <div><span className="announcement-kicker">KANAL SEKOLAH</span><h3>Pesan terkirim</h3></div>
            <span className="announcement-count">{announcements.length} pesan</span>
          </div>
          <label className="announcement-search">
            <span aria-hidden="true">⌕</span>
            <input aria-label="Cari pengumuman" placeholder="Cari pengumuman..." value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" aria-label="Hapus pencarian" onClick={() => setSearch("")}>×</button>}
          </label>
          <div className="announcement-chat-list" aria-live="polite">
            {loading ? <p className="announcement-empty">Memuat pengumuman...</p>
              : filteredAnnouncements.length === 0 ? <p className="announcement-empty">{search ? "Tidak ada pengumuman yang cocok dengan pencarian." : "Belum ada pengumuman. Tulis pesan pertama untuk calon siswa."}</p>
                : filteredAnnouncements.map((item) => (
                  <article className="announcement-item" key={item.id}>
                    <div className="announcement-bubble-heading"><span className="announcement-avatar">{item.author?.trim()?.charAt(0)?.toUpperCase() || "C"}</span><div><b>{item.author}</b><small>Panitia SPMB · <time>{new Date(item.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</time></small></div></div>
                    <h4>{item.title}</h4>
                    <p>{item.message}</p>
                    <div className="announcement-item-actions">
                      <button type="button" disabled={busy} onClick={() => { setEditingId(item.id); setForm({ title: item.title, message: item.message }); }}>Ubah</button>
                      <button type="button" className="announcement-delete" disabled={busy} onClick={() => deleteAnnouncement(item.id)}>Hapus</button>
                    </div>
                  </article>
                ))}
          </div>
        </section>
      </div>
    </section>
  );
}
