# ⛺ GoCamp - Casual Camping Gear Store

**GoCamp** adalah aplikasi web e-commerce sederhana untuk penjualan peralatan camping kasual. Proyek ini dibangun dengan pendekatan **Serverless** yang unik, memanfaatkan **Google Sheets** sebagai database real-time dan **Google Apps Script** sebagai backend API, tanpa biaya hosting server (Zero-Cost).

---

## 🚀 Fitur Utama

### 🛒 Sisi Pelanggan (Frontend)
* **Katalog Produk:** Menampilkan daftar produk lengkap dengan foto, harga, dan stok real-time.
* **Filter:** Mencari produk berdasarkan kategori.
* **Keranjang Belanja:** Menyimpan barang belanjaan sementara di browser (*Local Storage*).
* **Checkout System:** Pembaruan stok otomatis saat pemesanan.
* **Notifikasi Email:** Pelanggan otomatis menerima invoice via email setelah checkout.

### 🛠 Sisi Admin (Back-Office)
* **Secure Login:** Sistem login menggunakan keamanan PIN dengan enkripsi *Client-Side Hashing*.
* **Dashboard Real-time:** Memantau pesanan masuk (*Pending*) dan riwayat transaksi.
* **Manajemen Pesanan:**
    * Input Ongkos Kirim manual.
    * **WhatsApp Integration:** Kirim tagihan ke pelanggan via WhatsApp dengan satu klik.
    * Konfirmasi Pembayaran (*Paid*) atau Tolak Pesanan (*Decline/Restock*).

---

## 🛠️ Teknologi yang Digunakan

Project ini dibangun menggunakan teknologi web standar yang ringan dan cepat:

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Backend:** Google Apps Script (GAS).
* **Database:** Google Sheets.
* **Asset Management:** Google Drive (untuk penyimpanan foto produk).
* **Deployment:** Vercel / GitHub Pages.

---

## 🗄️ Akses Database & Backend

Karena proyek ini menggunakan Google Sheets sebagai database, data dapat dilihat secara transparan melalui link di bawah ini:

* **📂 Database (Google Sheets):** [KLIK DISINI UNTUK LIHAT DATA](https://docs.google.com/spreadsheets/d/1vIQOSxNETZqMhKOBtbLgoh8luqCuf8MjWfT6nTLiSdM/edit?usp=sharing)
* **⚠️ Catatan:** Spreadsheet ini diset dalam mode **View Only** untuk menjaga keamanan struktur data. Data pesanan baru dari web akan masuk secara otomatis ke sini.

---

## 🔐 Akun Demo Admin

Untuk keperluan pengujian atau penilaian dosen, silakan gunakan akses berikut untuk masuk ke Panel Admin:

* **URL Akses:** Buka file `admin.html` atau tambahkan `/admin.html` di akhir URL website.
* **PIN Akses:**
    ```
    gocampAdmin2026
    ```

---

## 📂 Struktur Folder

```text
/
├── index.html          # Halaman Utama (Homepage)
├── product.html        # Katalog Produk
├── checkout.html       # Halaman Checkout
├── admin.html          # Dashboard Admin (Protected)
├── admin-login.html    # Halaman Login Admin
├── css/
│   ├── style.css       # Styling Utama
│   └── admin.css       # Styling Khusus Admin
└── js/
    ├── script.js       # Logic Frontend Umum
    ├── checkout.js     # Logic Keranjang & Transaksi
    └── admin.js        # Logic Dashboard Admin
