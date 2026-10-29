"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileManager from "../dashboard/profil/ProfileManager";
import "./portal-nav.css";

const dashboardByRole = {
  "Calon siswa": "/dashboard/calon-siswa",
  "Akun pendaftaran": "/dashboard/calon-siswa",
  Administrator: "/dashboard/admin",
  "Kepala sekolah": "/dashboard/kepsek",
};

export default function PortalNav({ name, roleLabel, items = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [avatarRevision, setAvatarRevision] = useState(0);
  const [hasAvatar, setHasAvatar] = useState(false);
  const dashboardHref = dashboardByRole[roleLabel] || "/dashboard";
  const navItems = items;
  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const handleAvatarChanged = useCallback((hasAvatarNow) => {
    setHasAvatar(hasAvatarNow);
    setAvatarRevision((revision) => revision + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Status foto profil gagal dimuat.");
        return data.user.hasAvatar;
      })
      .then((avatarAvailable) => {
        if (!cancelled) setHasAvatar(Boolean(avatarAvailable));
      })
      .catch((error) => {
        if (!cancelled) console.error("Profile avatar status load error:", error);
      });
    return () => { cancelled = true; };
  }, [avatarRevision]);

  const logout = async () => {
    try {
      const response = await fetch("/api/session", { method: "DELETE" });
      if (!response.ok) throw new Error("Sesi gagal ditutup.");
      router.replace("/login");
      router.refresh();
    } catch {
      window.alert("Tidak dapat keluar dari akun. Coba lagi.");
    }
  };

  return (
    <header className="portal-nav">
      <div className="portal-nav-inner">
        <Link href={dashboardHref} className="portal-brand" aria-label="Kembali ke dashboard">
          <Image src="/cn.png" alt="Logo Citra Negara" width={42} height={42} priority />
          <span><strong>CITRA NEGARA</strong><small>Portal SPMB</small></span>
        </Link>

        <button
          className={`portal-nav-toggle ${menuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span /><span /><span />
        </button>

        <nav className={menuOpen ? "is-open" : ""}>
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              aria-current={pathname === item.href.split("?")[0] ? "page" : undefined}
              className={pathname === item.href.split("?")[0] ? "is-active" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="portal-user">
          <button
            type="button"
            className="portal-profile-trigger"
            onClick={() => setProfileOpen(true)}
            aria-label="Buka profil akun"
            aria-haspopup="dialog"
            aria-expanded={profileOpen}
          >
            <span className="portal-avatar">
              {hasAvatar && (
                <Image
                  src={`/api/profile/avatar?v=${avatarRevision}`}
                  alt=""
                  width={38}
                  height={38}
                  unoptimized
                  onError={() => setHasAvatar(false)}
                />
              )}
              {!hasAvatar && (name?.trim()?.charAt(0)?.toUpperCase() || "S")}
            </span>
            <span className="portal-user-copy"><small>{roleLabel}</small><strong>{name}</strong></span>
          </button>
          <button type="button" className="portal-logout" onClick={logout} title="Keluar" aria-label="Keluar dari akun">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4H5v16h5M16 8l4 4-4 4M20 12H9" /></svg>
          </button>
        </div>
      </div>
      {profileOpen && (
        <ProfileManager
          onClose={closeProfile}
          onAvatarChanged={handleAvatarChanged}
        />
      )}
    </header>
  );
}