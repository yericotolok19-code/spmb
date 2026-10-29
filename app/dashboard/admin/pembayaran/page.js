import { redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import AdminReview from "../AdminReview";

export const instant = false;

export default async function AdminPaymentsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") redirect("/login");
  return <AdminReview nama={session.nama} mode="payments" />;
}
