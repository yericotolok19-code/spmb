import { getSession } from "./auth";

export const requiredStudentDocuments = [
  { type: "birth_certificate", label: "Akta Kelahiran" },
  { type: "family_card", label: "Kartu Keluarga" },
  { type: "photo", label: "Pas Foto Formal 3×4" },
  { type: "graduation_letter", label: "Surat Keterangan Lulus (SKL)" },
  { type: "report_card", label: "Rapor Semester 1–5" },
];

export async function getRoleSession(role) {
  const session = await getSession();
  const userId = Number(session?.sub);

  if (!session || session.role !== role || !Number.isSafeInteger(userId) || userId < 1) {
    return null;
  }

  return { ...session, userId };
}

export async function readUploadedFile(file) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return { error: "Pilih file terlebih dahulu." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "Ukuran file maksimal 5 MB." };
  }

  const data = Buffer.from(await file.arrayBuffer());
  let mimeType = null;

  if (data.length >= 5 && data.subarray(0, 5).toString() === "%PDF-") {
    mimeType = "application/pdf";
  } else if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    mimeType = "image/jpeg";
  } else if (data.length >= 8 && data.readUInt32BE(0) === 0x89504e47) {
    mimeType = "image/png";
  }

  if (!mimeType) {
    return { error: "Format file harus PDF, JPG, atau PNG." };
  }

  const originalName = file.name
    .split(/[\\/]/)
    .pop()
    .replace(/[\r\n"]+/g, "_")
    .slice(0, 240);

  return { data, mimeType, originalName: originalName || "dokumen" };
}