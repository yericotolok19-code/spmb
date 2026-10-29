import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import PortalNav from "../../components/PortalNav";
import ProfileManager from "./ProfileManager";

export const instant = false;

const roleLabels = {
  calon_siswa: "Calon siswa",
  admin: "Administrator",
  kepsek: "Kepala sekolah",
};

const navigationByRole = {
  calon_siswa: [
    { label: "Ringkasan", href: "/dashboard/calon-siswa" },
    { label: "Dokumen", href: "/dashboard/calon-siswa/dokumen" },
    { label: "Pembayaran", href: "/dashboard/calon-siswa/pembayaran" },
    { label: "Seragam & MPLS", href: "/dashboard/calon-siswa/seragam" },
  ],
  admin: [
    { label: "Ringkasan", href: "/dashboard/admin" },
    { label: "Calon siswa", href: "/dashboard/admin/siswa" },
    { label: "Akun", href: "/dashboard/admin/akun" },
    { label: "Pembayaran", href: "/dashboard/admin/pembayaran" },
    { label: "Pengumuman", href: "/dashboard/admin/pengumuman" },
  ],
  kepsek: [
    { label: "Ringkasan", href: "/dashboard/kepsek" },
    { label: "Laporan & keuangan", href: "/dashboard/kepsek/laporan" },
    { label: "Pengumuman", href: "/dashboard/kepsek/pengumuman" },
  ],
};

export default async function ProfilePage() {
  const session = await getSession();
  if (!session || !roleLabels[session.role]) redirect("/login");

  return <>
    <PortalNav
      name={session.nama}
      roleLabel={roleLabels[session.role]}
      items={navigationByRole[session.role]}
    />
    <ProfileManager mode="page" />
  </>;
}
