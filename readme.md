# 📱 GAS Backend API v1 — Presensi, Telemetry & GPS

Backend API ringan (Serverless) berbasis **Google Apps Script (GAS)**. Dirancang untuk menangani sistem presensi kelas/mahasiswa menggunakan QR Code dinamis yang *auto-refresh*, serta memproses pencatatan data telemetri sensor (Accelerometer & GPS) secara langsung dari perangkat smartphone ke Google Sheets.

## 📚 API Documentation (OpenAPI / Swagger)

Dokumentasi spesifikasi API ini menggunakan standar **OpenAPI 3.0**. Kamu bisa melihat detail endpoint, parameter, format *request/response*, hingga mencoba simulasi *dummy request* langsung menggunakan **Swagger UI**.

👉 **[Buka Dokumentasi API di Swagger UI](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/USERNAME/REPO_KAMU/main/openapi.yaml)**

*(Atau klik *badge* di bawah ini)*

[![View in Swagger UI](https://img.shields.io/badge/Swagger-View_API_Docs-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://petstore.swagger.io/?url=https://raw.githubusercontent.com/USERNAME/REPO_KAMU/main/openapi.yaml)

> **⚠️ Cara Setup Link Swagger:**
> 1. Pastikan file `openapi.yaml` sudah di-*push* ke GitHub dan repository kamu bersifat **Public**.
> 2. Ganti teks `USERNAME/REPO_KAMU` pada link di atas dengan *username* dan *nama repository* GitHub kamu yang sebenarnya.

---

## ✨ Fitur Utama (Modul)

1. **Modul Presensi QR Dinamis**
   - Menghasilkan QR Code presensi dengan masa berlaku (*TTL*) 2 menit.
   - UI Dashboard terintegrasi yang melakukan *auto-refresh* QR setiap 2 menit.
   - Mendukung multi-user check-in untuk satu QR Code yang sama.

2. **Modul Telemetry: Accelerometer**
   - Endpoint untuk menerima pengiriman data sensor (x, y, z) secara *batch* untuk efisiensi.
   - Mengambil data getaran/pergerakan terakhir (*latest*).

3. **Modul Telemetry: GPS Tracker**
   - Merekam titik lokasi latitude & longitude.
   - Endpoint untuk mendapatkan *Marker* (titik lokasi terakhir).
   - Endpoint untuk mendapatkan *Polyline* (riwayat jejak rute perjalanan).

---

## 🛠️ Arsitektur Routing (Query Parameter)

Karena keterbatasan arsitektur modern Web App Google Apps Script yang hanya mengekspos satu rute (`/exec`), API ini menggunakan metode *routing* berbasis *Query Parameter* `?path=`.

**Contoh Penggunaan:**
- ❌ `POST https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec/presence/checkin` *(Akan diblokir/Redirect ke Google Login)*
- ✅ `POST https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec?path=presence/checkin` *(Berhasil diproses)*

---

## 🚀 Cara Instalasi & Deployment

1. **Siapkan Google Sheets**
   - Buat file Google Sheets baru.
   - Buat 4 Sheet (tab) dengan nama: `tokens`, `presence`, `accel`, `gps`.
   - Ambil *Spreadsheet ID* dari URL file kamu dan masukkan ke konstanta `SPREADSHEET_ID` di dalam `Code.gs`.

2. **Push Code ke Apps Script**
   - Gunakan `clasp push` jika menggunakan CLI, atau *copy-paste* langsung isi `Code.gs` dan `Index.html` ke editor GAS.

3. **Deploy sebagai Web App**
   - Di kanan atas editor GAS, klik **Deploy > New Deployment**.
   - Pilih tipe **Web App**.
   - **Execute as:** `Me` (Email kamu).
   - **Who has access:** `Anyone` (Sangat penting agar API bisa diakses klien publik).
   - Klik **Deploy** dan simpan URL Web App yang berakhiran `/exec`.

> **Catatan Penting:** Setiap kali ada perubahan kode di file `.gs` atau `.html`, kamu **WAJIB** melakukan *New Deployment*. Melakukan save biasa (Ctrl+S) tidak akan mengupdate versi produksi URL `/exec`.
