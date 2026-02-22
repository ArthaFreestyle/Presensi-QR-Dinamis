---
description: Workflow untuk membangun, memvalidasi, dan men-deploy backend API Google Apps Script (GAS) untuk sistem Presensi QR Dinamis, Batch Telemetry Accelerometer, dan GPS Tracking (Marker & Polyline).
---

**Description:** Workflow untuk membangun dan men-deploy backend API Google Apps Script (GAS) sesuai dengan API Contract Simple v1. Meliputi routing dinamis via `pathInfo`, Presensi QR Dinamis, Telemetry, GPS, dan standardisasi response JSON.

## Step 1: Inisialisasi Database (Google Sheets) & Router
- Siapkan file `Code.js` (atau `.gs`).
- Buat 4 Sheet (tab) wajib sebagai storage: `tokens`, `presence`, `accel`, dan `gps`.
- Buat fungsi `doGet(e)` dan `doPost(e)`.
- Implementasikan sistem *routing* menggunakan `e.pathInfo` untuk menangkap *endpoint* (misal: membedakan `/presence/checkin` dan `/presence/qr/generate`).

## Step 2: Implementasi Modul Presensi QR Dinamis
- **Generate QR Token (`POST /presence/qr/generate`):**
  - Tangkap payload: `course_id`, `session_id`, `ts` (ISO-8601).
  - Generate `qr_token` unik dan hitung `expires_at`.
  - Simpan ke sheet `tokens`.
  - Return token dan waktu kedaluwarsa.
- **Check-in (`POST /presence/checkin`):**
  - Tangkap payload minimal: `user_id`, `device_id`, `course_id`, `session_id`, `qr_token`, `ts`.
  - Validasi token di sheet `tokens` (pastikan ada dan belum *expired*). Jika gagal, return error (misal: `token_expired` atau `token_invalid`).
  - Simpan data presensi ke sheet `presence`.
  - Return `presence_id` dan status `checked_in`.
- **Cek Status (`GET /presence/status`):**
  - Tangkap query parameters: `user_id`, `course_id`, `session_id`.
  - Cari data di sheet `presence` dan return status terakhir beserta `last_ts`.

## Step 3: Implementasi Sensor Accelerometer (Batch)
- Siapkan *endpoint* (misal: `POST /sensor/accel/batch`).
- Tangkap payload array data accelerometer, pastikan ada identifier `device_id` dan `ts` (ISO-8601).
- Tulis data secara *batch* ke sheet `accel` agar efisien dan menghindari *timeout*.

## Step 4: Implementasi GPS Tracking (Marker & Polyline)
- Siapkan *endpoint* untuk mencatat lokasi (misal: `POST /sensor/gps`).
- Tangkap payload koordinat dengan `device_id` dan `ts` (ISO-8601). Simpan ke sheet `gps`.
- Buat *endpoint* untuk Marker: Mengambil 1 baris terakhir dari sheet `gps` berdasarkan `device_id`.
- Buat *endpoint* untuk Polyline: Mengambil kumpulan baris dari sheet `gps` berdasarkan `device_id` dan rentang waktu.

## Step 5: Standardisasi Format Response & Waktu
- Buat fungsi *helper* `sendSuccess(data)` yang memformat *return* menjadi: `{ "ok": true, "data": { ... } }`.
- Buat fungsi *helper* `sendError(message)` yang memformat *return* menjadi: `{ "ok": false, "error": "pesan error singkat" }`.
- Pastikan semua waktu yang dicatat dan dikembalikan menggunakan format standar ISO-8601 (contoh: `2026-02-18T10:15:30Z`).
- Bungkus response dengan `ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)`.

## Step 6: Deployment & Version Control
- Lakukan *push* kode ke GAS (`clasp push`).
- Deploy script sebagai **Web App** (akses "Anyone").
- Catat Base URL: `https://script.google.com/macros/s/<SCRIPT_ID>/exec`.
- Backup kode menggunakan Git (`git commit` & `git push` ke GitHub).

## Step 7: Dokumentasi OpenAPI (Swagger)
- Buat file `openapi.yaml` atau `swagger.json` di dalam *repository*.
- Definisikan Base URL, komponen schema, dan semua *endpoint* (`/presence/qr/generate`, `/presence/checkin`, `/presence/status`, accelerometer, dan GPS) sesuai kontrak v1.
- Pastikan *request body* dan *response body* di Swagger sama persis dengan contoh di kontrak.