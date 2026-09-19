<div align="center">
  
  # 🍰 DapoerDjawa
  **Platform E-Commerce Modern untuk Pecinta Kuliner Nusantara**

  [![Next.js](https://img.shields.io/badge/Built_with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Styled_with-Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Netlify](https://img.shields.io/badge/Deployed_on-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://www.netlify.com/)

  [Kunjungi Website](https://dapoerdjawa.netlify.app) • [Laporkan Bug](https://github.com/RahmatRohmatDoni/DapoerDjawa/issues) • [Request Fitur](https://github.com/RahmatRohmatDoni/DapoerDjawa/issues)

</div>

---

## 👥 Tim Pengembang (90's Dev Studio)

Website ini dirancang dan dikembangkan oleh **90's Dev Studio**, yang beranggotakan:
1. **Rahmat RohmatDoni** (NIM: 2413006)
2. **Satria Ryudha Pradana** (NIM: 2413007)

---

## 📖 Tentang Projek

**DapoerDjawa** adalah platform antarmuka web e-commerce yang dirancang untuk memberikan pengalaman berbelanja kue dan kuliner tradisional yang mulus dan modern. Projek ini dibangun menggunakan ekosistem terbaru **Next.js**, menghadirkan UI yang interaktif dan dioptimalkan secara khusus untuk pengalaman Desktop yang maksimal.

Projek ini diinisiasi menggunakan `create-next-app` dan berfokus pada pengalaman pengguna (UX) tingkat tinggi, mulai dari penjelajahan produk, manajemen keranjang belanja, hingga ringkasan pesanan.

### ✨ Fitur Utama

*   **🔐 Firebase Authentication:** Sistem masuk log (Login) yang aman terintegrasi dengan Google Auth Provider dan Firebase App Ecosystem.
*   **🏠 Interactive Main Page & Catalog:** Halaman utama interaktif yang menyajikan katalog produk kuliner DapoerDjawa secara estetis, lengkap dengan navigasi instan dan fitur langsung ke keranjang (*Add to Cart*).
*   **🛒 Interaktif Shopping Cart:** Manajemen kuantitas produk secara *real-time* dengan kalkulasi otomatis berbasis penyimpanan lokal.
*   **🎟️ Sistem Kode Promo:** Validasi diskon dinamis (seperti event Lebaran, Imlek, Nataru) yang langsung memotong total tagihan secara akurat.
*   **🛡️ Secure Checkout Gate:** Proteksi alur checkout pintar yang otomatis mengecek sesi pengguna dan memblokir tindakan jika belum login dengan menampilkan pop-up modal interaktif.
*   **📍 Regional API Integration (Provinsi & Kota):** Integrasi API Wilayah Indonesia pada halaman checkout untuk memuat data Provinsi, Kota/Kabupaten, hingga Kecamatan secara dinamis demi akurasi data pengiriman dan logistik.
*   **📊 Interactive Business Analytics Dashboard:** Halaman khusus Owner untuk memantau performa bisnis secara dinamis, dilengkapi filter rentang waktu (Hari Ini, Minggu Ini, Bulan Ini), visualisasi data pembayaran, pelacakan performa promo, tren pendapatan, hingga grafik distribusi kurir logistik.
*   **🖼️ Banner Carousel:** *Slide* promo estetik yang bergerak otomatis dengan pengatur waktu internal untuk meningkatkan daya tarik visual.
*   **⚡ Optimasi Font:** Menggunakan fitur `next/font` untuk memuat dan mengoptimalkan font secara otomatis demi performa maksimal.

---

## 🛠️ Teknologi yang Digunakan

DapoerDjawa dibangun menggunakan kombinasi teknologi modern berskala produksi (*production-ready*) untuk memastikan performa, keamanan, dan pengalaman pengguna yang maksimal:

*   **Core Framework:** [Next.js (App Router)](https://nextjs.org/) – Framework React modern untuk performa rendering yang optimal dan SEO-friendly.
*   **Backend & Ecosystem:** [Firebase App & Auth](https://firebase.google.com/) – Layanan backend-as-a-service untuk manajemen aplikasi dan autentikasi pengguna yang aman.
*   **Styling & UI:** [Tailwind CSS](https://tailwindcss.com/) – Framework CSS berbasis utility untuk pembangunan antarmuka yang modern dan cepat.
*   **Icons & Visuals:** [Lucide React](https://lucide.dev/) – Set ikon vektor yang konsisten, bersih, dan ringan untuk mempercantik UI.
*   **External APIs:** [Indonesia Regional API](https://github.com/izzulabadi/api-wilayah-indonesia-2026) – Integrasi API data wilayah pihak ketiga untuk memuat data Provinsi, Kota/Kabupaten, secara dinamis.
*   **Deployment Platform:** [Netlify](https://www.netlify.com/) – Platform cloud modern untuk hosting aplikasi web dengan skalabilitas tinggi.

---

## 🚀 Memulai Projek di Komputer Anda

Ikuti langkah-langkah berikut untuk menjalankan projek DapoerDjawa secara lokal di mesin Anda.

### Prasyarat
Pastikan Anda sudah menginstal Node.js dan NPM/Yarn/PNPM/Bun di komputer Anda.

### Instalasi & Menjalankan Server

1. **Clone repositori ini:**
```bash
   git clone [https://github.com/RahmatRohmatDoni/DapoerDjawa.git](https://github.com/RahmatRohmatDoni/DapoerDjawa.git)
   cd DapoerDjawa
# DapoerDjawa
