export const accountRoles = ["calon_siswa", "admin", "kepsek"];

export function parseAccountDetails(body) {
  const data = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const nama = typeof data.nama === "string" ? data.nama.trim() : "";
  const rawEmail = typeof data.email === "string" ? data.email.trim() : "";
  const rawPhone = typeof data.phone === "string" ? data.phone.trim() : "";
  const email = rawEmail ? rawEmail.toLowerCase() : null;
  const digits = rawPhone.replace(/[^\d+]/g, "");
  const phone = digits ? digits.replace(/^08/, "628").replace(/^\+/, "") : null;
  const role = typeof data.role === "string" ? data.role : "";

  if (!nama || nama.length > 100) {
    return { error: "Nama wajib diisi dan maksimal 100 karakter." };
  }
  if (email && (email.length > 255 || !/^\S+@\S+\.\S+$/.test(email))) {
    return { error: "Alamat email tidak valid." };
  }
  if (phone && !/^628\d{8,11}$/.test(phone)) {
    return { error: "Nomor HP harus menggunakan nomor Indonesia yang valid." };
  }
  if (!email && !phone) {
    return { error: "Isi minimal email atau nomor HP agar akun dapat digunakan untuk login." };
  }
  if (!accountRoles.includes(role)) {
    return { error: "Role akun tidak valid." };
  }

  return { account: { nama, email, phone, role } };
}

export async function findConflictingAccount(db, account, excludeId = null) {
  const conditions = [];
  const values = [];

  if (account.email) {
    conditions.push("email = ?");
    values.push(account.email);
  }
  if (account.phone) {
    conditions.push("phone = ?");
    values.push(account.phone);
  }
  const [rows] = await db.execute(
    `SELECT id FROM users WHERE (${conditions.join(" OR ")})${excludeId === null ? "" : " AND id <> ?" } LIMIT 1`,
    excludeId === null ? values : [...values, excludeId]
  );

  return rows.length > 0;
}
