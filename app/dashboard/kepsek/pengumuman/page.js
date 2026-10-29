import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import AnnouncementManager from "../../../components/AnnouncementManager";
import PortalNav from "../../../components/PortalNav";
import "../kepsek.css";

export const instant = false;

export default async function KepsekAnnouncementsPage() {
  const session = await getSession();
  if (!session || session.role !== "kepsek") redirect("/login");
  return <>
    <PortalNav name={session.nama} roleLabel="Kepala sekolah" items={[
      { label: "Ringkasan", href: "/dashboard/kepsek" },
      { label: "Laporan & keuangan", href: "/dashboard/kepsek/laporan" },
      { label: "Pengumuman", href: "/dashboard/kepsek/pengumuman" },
    ]} />
    <main className="announcement-page"><AnnouncementManager /></main>
  </>;
}
