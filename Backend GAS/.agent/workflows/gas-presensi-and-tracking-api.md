---
description: Workflow untuk membangun, memvalidasi, dan men-deploy backend API Google Apps Script (GAS) untuk sistem Presensi QR Dinamis, Batch Telemetry Accelerometer, dan GPS Tracking (Marker & Polyline).
---

## Step 1: Inisialisasi & Setup Router API
- Buat atau pastikan file `Code.js` (atau `.gs`) tersedia.
- Buat fungsi `doGet(e)` dan `doPost(e)` sebagai router utama API.
- Siapkan variabel global untuk ID Google Sheets yang akan dijadikan database.
- Pastikan ada 3 Sheet (tab) utama: "Presensi", "Telemetry", dan "GPS_Log".

## Step 2: Implementasi Endpoint Presensi QR
- Buat fungsi `handleCheckIn(payload)` untuk memvalidasi token QR.
- Catat timestamp, ID User, dan status ke sheet "Presensi".
- Buat fungsi `getPresensiStatus(userId)` untuk mengecek status absen secara cepat.

## Step 3: Implementasi Accelerometer (Batch Telemetry)
- Buat fungsi `handleBatchTelemetry(payload)` untuk menerima array of objects (data accelerometer).
- Gunakan metode penulisan *batch* (misal: `getRange().setValues()`) agar script tidak timeout saat menyimpan ratusan baris data ke sheet "Telemetry".
- Buat endpoint untuk mengambil data accelerometer terbaru.

## Step 4: Implementasi Peta (GPS Log, Marker, Polyline)
- Buat fungsi `logGPS(payload)` untuk mencatat latitude, longitude, dan timestamp ke sheet "GPS_Log".
- Buat fungsi `getLatestGPS(userId)` yang mengembalikan 1 titik koordinat terakhir untuk kebutuhan Marker peta.
- Buat fungsi `getGPSHistory(userId)` yang mengembalikan *array* koordinat berdasarkan rentang waktu tertentu untuk digambar sebagai Polyline di peta.

## Step 5: Pengujian & Response Formatting
- Pastikan semua fungsi mengembalikan response dalam format JSON menggunakan `ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)`.
- Verifikasi penanganan *error* (misalnya jika data yang dikirim kosong atau format salah).

## Step 6: Deployment & Version Control
- Jika menggunakan `clasp`, jalankan perintah untuk *push* kode ke server Google Apps Script.
- Ingatkan pengguna untuk melakukan *deploy* sebagai "Web App" dengan akses "Anyone" (Siapa saja) jika ada perubahan struktur fungsi utama.
- Jalankan perintah Git (`git add`, `git commit`, `git push`) untuk mem-backup kode terbaru ke GitHub.