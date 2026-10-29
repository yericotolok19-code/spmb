import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import LandingPage from "./LandingPage";

export const instant = false;

const dashboardByRole = {
  calon_siswa: "/dashboard/calon-siswa",
  admin: "/dashboard/admin",
  kepsek: "/dashboard/kepsek",
};

export default async function HomePage() {
  const session = await getSession();
  if (session && dashboardByRole[session.role]) {
    redirect(dashboardByRole[session.role]);
  }
  return <LandingPage />;
}
