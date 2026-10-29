import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import AnnouncementManager from "../../../components/AnnouncementManager";
import PortalNav from "../../../components/PortalNav";
import "../review.css";

export const instant = false;

export default async function AdminAnnouncementsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");
  return <>
    <PortalNav name={session.nama} roleLabel="Administrator" items={[
      { label: "Ringkasan", href: "/dashboard/admin" },
      { label: "Calon siswa", href: "/dashboard/admin/siswa" },
      { label: "Akun", href: "/dashboard/admin/akun" },
      { label: "Pembayaran", href: "/dashboard/admin/pembayaran" },
      { label: "Pengumuman", href: "/dashboard/admin/pengumuman" },
    ]} />
    <main className="announcement-page"><AnnouncementManager /></main>
  </>;
}
