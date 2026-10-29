import StudentDashboardRoute from "./StudentDashboardRoute";

export const instant = false;

export default async function StudentDashboardPage({ searchParams }) {
  return <StudentDashboardRoute page="overview" searchParams={searchParams} />;
}
