
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("spmb_session")?.value;
  const secret = process.env.SESSION_SECRET;

  if (!token || !secret || secret.length < 32) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ["HS256"] }
    );

    if (
      !payload.sub ||
      !["calon_siswa", "admin", "kepsek"].includes(payload.role)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
