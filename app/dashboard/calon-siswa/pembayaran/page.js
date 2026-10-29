import StudentDashboardRoute from "../StudentDashboardRoute";

export const instant = false;

export default async function StudentPaymentsPage({ searchParams }) {
  return <StudentDashboardRoute page="pembayaran" searchParams={searchParams} />;
}
