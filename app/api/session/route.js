import { getSession } from "../../../lib/auth";

export async function GET() {
  const session = await getSession();

  if (!session || session.role !== "calon_siswa") {
    return Response.json({ message: "Sesi tidak valid." }, { status: 401 });
  }

  return Response.json({
    user: {
      nama: session.nama,
      jenjang: session.jenjang,
    },
  });
}

export async function DELETE() {
  const response = Response.json({ message: "Logout berhasil." });
  response.headers.append(
    "Set-Cookie",
    [
      "spmb_session=",
      "HttpOnly",
      "Path=/",
      "SameSite=Lax",
      "Max-Age=0",
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ")
  );

  return response;
}