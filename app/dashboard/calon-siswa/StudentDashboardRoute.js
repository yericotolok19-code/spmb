import DashboardClient from "./DashboardClient";

export default async function StudentDashboardRoute({ page, searchParams }) {
  const params = await searchParams;
  const value = params?.studentId;
  const initialStudentId = Array.isArray(value) ? value[0] : value || "";

  return <DashboardClient page={page} initialStudentId={initialStudentId} />;
}
