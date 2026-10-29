import StudentDashboardRoute from "../StudentDashboardRoute";

export const instant = false;

export default async function StudentDocumentsPage({ searchParams }) {
  return <StudentDashboardRoute page="dokumen" searchParams={searchParams} />;
}
