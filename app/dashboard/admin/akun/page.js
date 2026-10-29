import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import AccountsManager from "../AccountsManager";
import "../review.css";

export const instant = false;

export default async function AdminAccountsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");
  return <AccountsManager nama={session.nama} currentUserId={session.sub} />;
}
