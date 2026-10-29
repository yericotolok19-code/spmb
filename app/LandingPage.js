"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const steps = [
  {
    number: "01",
    title: "Daftar Online",
    description: "Isi data diri dan orang tua, pilih jenjang, lalu unduh bukti pendaftaran.",
    note: "Siapkan nomor registrasi",
    illustration: "online",
  },
  {
    number: "02",
    title: "Verifikasi Berkas",
    description: "Bawa Akta, KK, rapor, Ijazah/SKL, dan pas foto ke sekretariat untuk diperiksa.",
    note: "Didampingi orang tua/wali",
    illustration: "documents",
  },
  {
    number: "03",
    title: "Seleksi & Pengumuman",
    description: "Ikuti TPA, tes baca Al-Qur'an, dan pemetaan minat. Cek hasilnya di portal.",
    note: "Pantau portal SPMB",
    illustration: "results",
  },
  {
    number: "04",
    title: "Daftar Ulang",
    description: "Selesaikan administrasi, lengkapi berkas, dan lakukan pengukuran seragam.",
    note: "Selamat bergabung!",
    illustration: "school",
  },
];

const programs = [
  {
    level: "SMP",
    title: "SMP Citra Negara",
    subtitle: "Tumbuh dengan karakter",
    description: "Membangun dasar akademik, karakter Islami, dan rasa ingin tahu untuk melangkah percaya diri.",
    image: "/cn-smp.webp",
    href: "/jenjang/smp",
    imageAlt: "Gedung SMP Citra Negara",
  },
  {
    level: "SMA",
    title: "SMA Citra Negara",
    subtitle: "Siap menuju masa depan",
    description: "Kembangkan potensi dan prestasi melalui pembelajaran yang mendampingi setiap cita-cita.",
    image: "/cn-hero.jpg",
    href: "/jenjang/sma",
    imageAlt: "Kampus Citra Negara",
  },
  {
    level: "SMK",
    title: "SMK Citra Negara",
    subtitle: "Belajar, terampil, berkarya",
    description: "Asah keterampilan dan kompetensi melalui pengalaman belajar yang dekat dengan dunia kerja.",
    image: "/cn-smk.jpg",
    href: "/jenjang/smk",
    imageAlt: "Kampus dan fasilitas SMK Citra Negara",
  },
];

const Icon = ({ d }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

function RoadmapIllustration({ type }) {
  const illustrations = {
    online: (
      <>
        <circle cx="87" cy="24" r="13" fill="#f3d96b" />
        <rect x="26" y="20" width="57" height="42" rx="5" fill="#fff" stroke="#286b48" strokeWidth="3" />
        <rect x="32" y="26" width="45" height="27" rx="2" fill="#dcecdf" />
        <circle cx="43" cy="36" r="4" fill="#91b856" />
        <path d="M51 34h17M51 39h13M37 47h32M22 64h65l-6 6H28z" fill="#286b48" />
        <path d="m92 47 7 7-14 14-8 2 2-8z" fill="#e1a03b" stroke="#805622" strokeWidth="2" strokeLinejoin="round" />
      </>
    ),
    documents: (
      <>
        <circle cx="88" cy="25" r="13" fill="#f3d96b" />
        <rect x="36" y="16" width="47" height="59" rx="5" fill="#fff" stroke="#286b48" strokeWidth="3" />
        <rect x="49" y="12" width="21" height="10" rx="4" fill="#8bb55c" stroke="#286b48" strokeWidth="2" />
        <path d="m45 37 3 3 6-7M59 38h16m-30 12 3 3 6-7m4 4h16m-29 12h26" fill="none" stroke="#6b9b58" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m25 55 9-9 10 10-9 9-10-2z" fill="#e4b85c" stroke="#9b7130" strokeWidth="2" />
      </>
    ),
    results: (
      <>
        <circle cx="88" cy="24" r="13" fill="#f3d96b" />
        <path d="M36 19h36l12 12v43H36z" fill="#fff" stroke="#286b48" strokeWidth="3" strokeLinejoin="round" />
        <path d="M72 20v13h11M45 42h28M45 50h20" fill="none" stroke="#91b856" strokeWidth="3" strokeLinecap="round" />
        <path d="m57 69 8-11 8 11 2 11-10-5-10 5z" fill="#e6a644" stroke="#a56d25" strokeWidth="2" strokeLinejoin="round" />
        <path d="m95 45 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#edc956" />
      </>
    ),
    school: (
      <>
        <circle cx="88" cy="23" r="13" fill="#f3d96b" />
        <path d="m24 40 36-21 36 21v34H24z" fill="#fff" stroke="#286b48" strokeWidth="3" strokeLinejoin="round" />
        <path d="M19 41 60 17l41 24" fill="none" stroke="#286b48" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M53 74V54a7 7 0 0 1 14 0v20M34 49h9v9h-9zm43 0h9v9h-9z" fill="#dcecdf" stroke="#6b9b58" strokeWidth="2" />
        <path d="M60 17V8m0 1h13l-4 5h-9" fill="none" stroke="#e1a03b" strokeWidth="3" strokeLinejoin="round" />
      </>
    ),
  };

  return (
    <svg className="roadmap-illustration" viewBox="0 0 120 90" fill="none" aria-hidden="true">
      {illustrations[type]}
    </svg>
  );
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setIntroLeaving(true), 3000);
    const removeTimer = window.setTimeout(() => setShowIntro(false), 3900);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - previousScrollY;

      if (menuOpen || currentScrollY < 80 || scrollDelta < -6) {
        setNavHidden(false);
      } else if (currentScrollY > 100 && scrollDelta > 8) {
        setNavHidden(true);
      }

      previousScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen]);

  useEffect(() => {
    const page = document.querySelector(".page");
    if (!page || !("IntersectionObserver" in window)) return;

    const targets = page.querySelectorAll(
      ".stats, .roadmap-section, #pendidikan > .wrap, #gelombang, .campus-story-inner, .cta, #kontak, .footer .f-grid, .stat, .roadmap-item, #pendidikan .program-card, .wave, .campus-copy > *, .campus-gallery > *, #kontak .info, #kontak .contact-item",
    );
    const siblingIndexes = new Map();

    targets.forEach((target) => {
      const parent = target.parentElement;
      const siblingIndex = siblingIndexes.get(parent) ?? 0;
      siblingIndexes.set(parent, siblingIndex + 1);
      target.dataset.scrollReveal = "";
      target.style.setProperty("--reveal-delay", `${siblingIndex * 75}ms`);
    });

    page.classList.add("reveal-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -35px 0px" },
    );

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      page.classList.remove("reveal-ready");
    };
  }, []);

  return (
    <div className="page">
      {showIntro && (
        <div className={`intro-screen${introLeaving ? " is-leaving" : ""}`} aria-hidden="true">
          <div className="intro-content">
            <div className="intro-emblem">
              <Image src="/cn.png" alt="" className="intro-logo" width={96} height={96} priority />
            </div>
            <span className="intro-kicker">SELAMAT DATANG DI</span>
            <strong className="intro-name">CITRA NEGARA</strong>
            <span className="intro-levels">SMP <i /> SMA <i /> SMK</span>
            <p className="intro-motto">Pilihan yang tempat untuk sekolah yang M.A.N.T.A.P</p>
            <small className="intro-caption">Penerimaan Murid Baru 2026/2027</small>
            <span className="intro-loading"><i /></span>
          </div>
        </div>
      )}
      <div className="topbar">
        <div className="wrap tb-in">
          <span>Jl. Raya Tanah Baru No. 99 Kemiri Jaya, Beji, Depok 16421</span>
          <span>(021) 77201052</span>
          <span>info@citranegara.sch.id</span>
          <span className="tb-right">
            <b className="pill-gold">SPMB 2026/2027</b> SMP • SMA • SMK
          </span>
        </div>
      </div>

      <header className={`nav${navHidden && !menuOpen ? " nav-hidden" : ""}`}>
        <div className="wrap nav-in">
          <div className={`nav-menus ${menuOpen ? "is-open" : ""}`}>
            <nav className="nav-links nav-links-left" aria-label="Navigasi utama">
              {[["Beranda", "#beranda"], ["Jenjang", "#pendidikan"], ["Alur SPMB", "#alur"]].map(([n, href]) => (
                <a key={n} href={href} onClick={() => setMenuOpen(false)}>{n}</a>
              ))}
            </nav>
            <nav className="nav-links nav-links-right" aria-label="Informasi">
              {[["Gelombang", "#gelombang"], ["Hubungi", "#kontak"]].map(([n, href]) => (
                <a key={n} href={href} onClick={() => setMenuOpen(false)}>{n}</a>
              ))}
              <Link href="/register" className="btn-green" onClick={() => setMenuOpen(false)}>Daftar <Icon d="M5 12h14m-6-6l6 6-6 6" /></Link>
            </nav>
          </div>
          <Link href="#beranda" className="brand" aria-label="Citra Negara, beranda">
            <Image src="/cn.png" alt="" className="logo" width={54} height={54} priority />
            <span>
              <strong>CITRA NEGARA</strong>
              <small>SMP • SMA • SMK</small>
            </span>
          </Link>
          <button className="menu-toggle" type="button" aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            <Icon d={menuOpen ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"} />
          </button>
        </div>
      </header>

      <section className="hero" id="beranda">
        <div className="hero-box">
          <div className="hero-stage-content">
            <div className="badges">
              <span className="badge b-gold">PENERIMAAN MURID BARU 2026/2027</span>
              <span className="badge b-dark">SMP • SMA • SMK</span>
            </div>
            <h1>Selamat datang di <em>Citra Negara</em></h1>
            <p>Pendidikan berkarakter, ruang untuk bertumbuh, dan bekal untuk melangkah ke masa depan.</p>
            <div className="hero-btns">
              <Link href="/register" className="btn-orange">Mulai pendaftaran <Icon d="M5 12h14m-6-6l6 6-6 6" /></Link>
              <a href="#pendidikan" className="btn-ghost">Kenali jenjang <Icon d="M19 9l-7 7-7-7" /></a>
            </div>
          </div>
          <span className="hero-stage-index">DEPOK · JAWA BARAT</span>
        </div>
      </section>

      <section className="wrap stats">
        {[["3", "Jenjang pendidikan"], ["6", "Jurusan vokasi SMK"], ["24 jam", "Pendaftaran online"], ["2004", "Mulai mendidik"]].map(([a, b], i) => (
          <div key={a} className={`stat s${i}`}>
            <strong>{a}</strong>
            <span>{b}</span>
          </div>
        ))}
      </section>

      <section className="wrap sec center roadmap-section" id="alur">
        <span className="eyebrow">PROSEDUR PENERIMAAN RESMI</span>
        <h2>Alur Pendaftaran SPMB</h2>
        <p className="lead">Empat langkah ringkas untuk memulai perjalananmu bersama Citra Negara.</p>
        <p className="roadmap-hint" aria-hidden="true">Geser untuk melihat semua tahap <Icon d="M5 12h14m-6-6l6 6-6 6" /></p>
        <ol className="roadmap" aria-label="Empat tahap alur pendaftaran SPMB">
          {steps.map((step) => (
            <li className={`roadmap-item roadmap-${step.illustration}`} key={step.number}>
              <span className="roadmap-marker" aria-hidden="true">{step.number}</span>
              <div className="roadmap-card">
                <div className="roadmap-art">
                  <RoadmapIllustration type={step.illustration} />
                </div>
                <div className="roadmap-copy">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <span className="roadmap-meta">{step.note}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="gray" id="pendidikan">
        <div className="wrap sec">
          <div className="program-heading">
            <div>
              <span className="eyebrow left">PILIH JALUR BELAJARMU</span>
              <h2 className="left-h">Satu sekolah, tiga jenjang.</h2>
              <p className="lead left">Temukan lingkungan belajar yang sesuai dengan langkah dan cita-citamu.</p>
            </div>
          </div>
          <div className="program-grid">
            {programs.map((program, index) => (
              <article className="program-card" key={program.level}>
                <Link className="program-image" href={program.href} aria-label={`Lihat detail ${program.title}`}>
                  <Image
                    src={program.image}
                    alt={program.imageAlt}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw"
                    priority={index === 0}
                  />
                  <span className="program-image-shade" />
                  <span className="program-level">{program.level}</span>
                </Link>
                <div className="program-card-body">
                  <span className="program-subtitle">{program.subtitle}</span>
                  <h3>{program.title}</h3>
                  <p>{program.description}</p>
                  <Link className="program-link" href={program.href}>
                    Lihat detail <Icon d="M5 12h14m-6-6l6 6-6 6" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap sec center" id="gelombang">
        <span className="eyebrow">JADWAL & ALOKASI KURSI</span>
        <h2>Periode Gelombang Pendaftaran T.A. 2026/2027</h2>
        <p className="lead">Pendaftaran dapat ditutup sewaktu-waktu apabila kuota kursi masing-masing rombongan belajar (rombel) telah terpenuhi.</p>
        <div className="waves">
          <div className="card wave open">
            <div className="wave-tag"><b className="tag t-green">PENERIMAAN 2026/2027</b><i>Jalur reguler & prestasi</i></div>
            <h3>Temukan jenjang yang sesuai denganmu.</h3>
            <small className="period">Informasi jadwal dan biaya dapat dikonfirmasi kepada panitia SPMB.</small>
            <div className="wave-programs"><span>SMP Citra Negara</span><span>SMA Citra Negara</span><span>SMK Citra Negara</span></div>
            <ul className="checks">
              <li>⊙ Buat akun calon siswa secara online.</li>
              <li>⊙ Lengkapi data diri dan dokumen persyaratan.</li>
              <li>⊙ Pantau verifikasi melalui dashboard pendaftaran.</li>
            </ul>
            <Link href="/register" className="btn-block green">Buat akun pendaftaran</Link>
          </div>
          <div className="card wave">
            <div className="wave-tag"><b className="tag t-gray">BUTUH BANTUAN?</b><i className="gr">Panitia SPMB</i></div>
            <h3>Bicarakan rencana belajarmu bersama kami.</h3>
            <small className="period">Konsultasi informasi jenjang, berkas, dan proses penerimaan.</small>
            <div className="notice">Hubungi loket SPMB pada jam layanan atau kirim pertanyaan melalui WhatsApp resmi sekolah.</div>
            <ul className="checks plain">
              <li>⌂ Jl. Raya Tanah Baru No. 99, Beji, Depok.</li>
              <li>◷ Senin–Jumat, 07.30–15.30 WIB.</li>
              <li>◷ Sabtu, 07.30–13.00 WIB.</li>
            </ul>
            <a href="tel:+622177201052" className="btn-block gray">Hubungi (021) 77201052</a>
          </div>
        </div>
      </section>

      <section className="campus-story">
        <div className="wrap campus-story-inner">
          <div className="campus-copy">
            <span className="eyebrow left">KEHIDUPAN DI CITRA NEGARA</span>
            <h2>Belajar, berkarya, dan tumbuh bersama.</h2>
            <p>Ruang kelas, kegiatan, dan pendampingan membentuk pengalaman belajar yang utuh—akademik, keterampilan, dan karakter berjalan beriringan.</p>
            <Link href="/register" className="text-link">Mulai perjalananmu <Icon d="M5 12h14m-6-6l6 6-6 6" /></Link>
          </div>
          <div className="campus-gallery" aria-label="Placeholder foto kegiatan siswa">
            <div className="gallery-large" />
            <div className="gallery-small gallery-top" />
            <div className="gallery-small gallery-bottom" />
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="cta-ico">🎓</div>
        <h2>Siap Bergabung dengan Keluarga Besar Citra Negara?</h2>
        <p>Wujudkan masa depan berakhlak terpuji, berwawasan global, dan berkeahlian industri bersama Yayasan At-Taqwa Kemiri Jaya Depok.</p>
        <Link href="/register" className="btn-orange big">Buat akun pendaftaran <Icon d="M5 12h14m-6-6l6 6-6 6" /></Link>
        <small>Portal pendaftaran SMP, SMA, dan SMK Citra Negara</small>
      </section>

      <section className="wrap sec help" id="kontak">
        <div className="help-l">
          <span className="eyebrow left">BANTUAN & KONSULTASI LANGSUNG</span>
          <h2 className="left-h">Loket Pelayanan Kampus & Helpdesk</h2>
          <p className="lead left">Jika Ayah/Bunda membutuhkan bimbingan teknis pendaftaran atau konsultasi peminatan jurusan, silakan kunjungi kantor sekretariat SPMB Citra Negara.</p>
          <div className="info2">
            <div className="info">
              <span className="ic-box"><Icon d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0zM12 7a3 3 0 100 6 3 3 0 000-6z" /></span>
              <div>
                <h4>Alamat Citra Negara</h4>
                <p>Jl. Raya Tanah Baru No. 99, Kel. Beji, Kec. Beji, Kota Depok, Jawa Barat 16421</p>
              </div>
            </div>
            <div className="info">
              <span className="ic-box"><Icon d="M12 6v6l4 2M12 2a10 10 0 100 20 10 10 0 000-20z" /></span>
              <div>
                <h4>Jam Layanan Loket SPMB</h4>
                <p className="hours"><span>Senin – Jumat</span><b>07:30 – 15:30 WIB</b></p>
                <p className="hours"><span>Sabtu</span><b>07:30 – 13:00 WIB</b></p>
                <p className="note">Pendaftaran website tetap melayani 24 jam</p>
              </div>
            </div>
          </div>
          <div className="map">
            <iframe
              title="Lokasi Citra Negara"
              src="https://www.google.com/maps?q=Jl.+Raya+Tanah+Baru+No.+99,+Beji,+Depok,+Jawa+Barat+16421&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <a className="map-btn" href="https://www.google.com/maps/search/?api=1&query=Jl.+Raya+Tanah+Baru+No.+99,+Beji,+Depok" target="_blank" rel="noreferrer">
              <Icon d="M7 17L17 7M8 7h9v9" /> Buka di Google Maps
            </a>
          </div>
        </div>
        <aside className="card contact">
          <h3>Kontak Cepat Panitia SPMB</h3>
          <p className="c-sub">Hubungi kanal resmi jika mendapati kendala teknis pembuatan akun atau unggah bukti pembayaran.</p>
          {[
            ["wa", "M21 12a9 9 0 01-13.4 7.8L3 21l1.3-4.4A9 9 0 1121 12z", "Hotline WhatsApp 1", "0812–3456–7890 (Ibu Fitriani)", "https://wa.me/6281234567890"],
            ["wa", "M21 12a9 9 0 01-13.4 7.8L3 21l1.3-4.4A9 9 0 1121 12z", "Hotline WhatsApp 2", "0813–8901–2345 (Bapak Rahardian)", "https://wa.me/6281389012345"],
            ["mail", "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm0 1l8 7 8-7", "Surel Resmi Panitia", "info@citranegara.sch.id", "mailto:info@citranegara.sch.id"],
            ["tel", "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z", "Telepon Kantor (Hunting)", "(021) 77201052", "tel:+622177201052"],
          ].map(([k, d, h, sub, href]) => (
            <a className="contact-item" href={href} key={h} target={k === "wa" ? "_blank" : undefined} rel="noreferrer">
              <span className={`c-ic ${k}`}><Icon d={d} /></span>
              <div><b>{h}</b><small>{sub}</small></div>
              <span className="c-arrow">›</span>
            </a>
          ))}
          <div className="resp"><i /> Respon cepat jam kerja: 08.00 – 15.00 WIB</div>
        </aside>
      </section>

      <footer className="footer">
        <div className="wrap f-grid">
          <div>
            <strong className="f-brand">CITRA NEGARA</strong>
            <p>Yayasan At-Taqwa Kemiri Jaya telah mendidik dan membina generasi berakhlak mulia, berdisiplin tinggi, dan berkompetensi unggul sejak tahun 2004.</p>
            <div className="motto">Motto: M.A.N.T.A.P <b className="pill-gold">Akreditasi A</b></div>
          </div>
          <div>
            <h4>Jenjang Pendidikan</h4>
            {["SMP Citra Negara", "SMA Citra Negara", "SMK Citra Negara (Teknologi & Bisnis)", "Program Keunggulan Unggulan", "Ekstrakurikuler & Karakter"].map((x) => <a key={x} href="#">{x}</a>)}
          </div>
          <div>
            <h4>Layanan & Jam Operasional</h4>
            <a>Sekretariat SPMB & Pelayanan</a>
            <a>Administrasi:</a>
            <p className="f-hours"><b>Senin – Jumat: 07:00 – 15:30 WIB</b></p>
            <p className="f-hours"><b>Sabtu: 07:00 – 13:00 WIB</b></p>
            <p className="f-hours"><b>Minggu/Hari Libur: Tutup (Pendaftaran Online 24 Jam)</b></p>
          </div>
          <div>
            <h4>Kontak & Lokasi</h4>
            <p>Jl. Raya Tanah Baru No. 99, Kel. Beji, Kec. Beji, Kota Depok, Jawa Barat 16421</p>
            <p>Telepon: (021) 77201052<br />Email: info@citranegara.sch.id</p>
          </div>
        </div>
        <div className="wrap f-bottom">
          <span>© 2025 Yayasan At-Taqwa Kemiri Jaya (Citra Negara Depok). Hak Cipta Dilindungi.</span>
          <span><a href="#">Kebijakan Privasi</a><a href="#">Syarat & Ketentuan</a><a href="#">Peta Situs</a></span>
        </div>
      </footer>
    </div>
  );
}