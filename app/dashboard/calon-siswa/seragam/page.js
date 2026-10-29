import StudentDashboardRoute from "../StudentDashboardRoute";

export const instant = false;

export default async function StudentUniformPage({ searchParams }) {
  return <StudentDashboardRoute page="seragam" searchParams={searchParams} />;
}
