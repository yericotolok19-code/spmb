This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Akun keluarga dan pendaftaran siswa

Akun SPMB menggunakan email atau nomor HP dan kata sandi. Setelah masuk, satu akun dapat menambahkan beberapa profil siswa; dokumen, status seleksi, dan pembayaran dikelola terpisah untuk setiap siswa.

Sebelum menjalankan versi ini pada database yang sudah berisi data, pastikan `scripts/migrate-users.sql` dan `scripts/migrate-student-dashboard.sql` telah dijalankan. Buat cadangan database, lalu jalankan `scripts/migrate-family-accounts.sql` dan `scripts/migrate-profile-avatar.sql` satu kali pada database `spmb`. Migrasi keluarga mempertahankan ID siswa lama agar pendaftaran, dokumen, dan pembayaran tetap terkait. Foto profil disimpan di database dan dapat diubah dari popup profil di navbar. Pengumuman dapat dikelola admin dan kepala sekolah, dan hanya ditampilkan pada pendaftaran dengan status berkas **Terverifikasi**.

Setelah masuk, logo portal dan halaman beranda akan mengarahkan pengguna kembali ke dashboard sesuai perannya. Keluar dari akun dilakukan melalui tombol logout. Dashboard calon siswa memiliki halaman ringkasan, dokumen, pembayaran, dan seragam/MPLS. Dashboard admin memisahkan ringkasan, review calon siswa, verifikasi pembayaran, dan pengumuman. Dashboard kepala sekolah menyediakan ringkasan, laporan statistik dan keuangan, serta pengelolaan pengumuman.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
