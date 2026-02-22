---
description: Workflow untuk membangun, memvalidasi, dan men-deploy backend API Google Apps Script (GAS) untuk sistem Presensi QR Dinamis, Batch Telemetry Accelerometer, dan GPS Tracking (Marker & Polyline).
---


> **⚠️ PENTING — Routing Fix:** Gunakan `e.parameter.path`, **bukan** `e.pathInfo`

---

## 🚨 Root Cause: Kenapa `/exec/presence/checkin` Redirect ke Login?

Google Apps Script Web App **hanya expose satu URL**: `/exec`.

Saat kamu akses `/exec/presence/checkin`, GAS **tidak mengenalinya** sebagai bagian dari Web App
dan langsung redirect ke halaman login Google — bahkan untuk deployment "Anyone can access".

`e.pathInfo` memang tersedia di GAS, tapi **tidak bekerja** pada deployment Web App publik modern.

### ✅ Solusi: Routing via Query Parameter `?path=`

```
# ❌ SALAH — selalu redirect ke login page
POST https://.../exec/presence/qr/generate
POST https://.../exec/presence/checkin

# ✅ BENAR — selalu bisa diakses
POST https://.../exec?path=presence/qr/generate
POST https://.../exec?path=presence/checkin
GET  https://.../exec?path=presence/status&user_id=xxx&course_id=yyy&session_id=zzz
```

Di GAS, baca routing dari `e.parameter.path`:

```javascript
// ❌ JANGAN pakai ini
const path = e.pathInfo;

// ✅ PAKAI ini
const path = (e.parameter && e.parameter.path) ? e.parameter.path : "";
```


---

## Step 1: Inisialisasi Database (Google Sheets) & Router

- Siapkan file `Code.gs` di Google Apps Script.
- Buat 4 Sheet (tab) wajib sebagai storage: `tokens`, `presence`, `accel`, dan `gps`.
- Buat fungsi `doGet(e)` dan `doPost(e)`.
- ~~Implementasikan routing menggunakan `e.pathInfo`~~ → **Gunakan `e.parameter.path`** (lihat fix di atas).

**Struktur header tiap sheet:**

| Sheet      | Kolom |
|------------|-------|
| `tokens`   | qr_token, course_id, session_id, created_at, expires_at, used |
| `presence` | presence_id, user_id, device_id, course_id, session_id, qr_token, ts, recorded_at |
| `accel`    | device_id, x, y, z, sample_ts, batch_ts, recorded_at |
| `gps`      | device_id, lat, lng, accuracy, altitude, ts, recorded_at |

---

## Step 2: Implementasi Modul Presensi QR Dinamis

### Generate QR Token — `POST /exec?path=presence/qr/generate`

**Request body:**
```json
{ "course_id": "cloud-101", "session_id": "sesi-02", "ts": "2026-02-18T10:00:00Z" }
```

**Response:**
```json
{ "ok": true, "data": { "qr_token": "TKN-8F2A19", "expires_at": "2026-02-18T10:02:00Z" } }
```

- Generate `qr_token` unik (UUID prefix TKN-).
- Hitung `expires_at` = sekarang + TTL (default 120 detik).
- Simpan ke sheet `tokens`.

### Check-in — `POST /exec?path=presence/checkin`

**Request body:**
```json
{
  "user_id": "2023xxxx", "device_id": "dev-001",
  "course_id": "cloud-101", "session_id": "sesi-02",
  "qr_token": "TKN-8F2A19", "ts": "2026-02-18T10:01:10Z"
}
```

**Response:**
```json
{ "ok": true, "data": { "presence_id": "PR-0001", "status": "checked_in" } }
```

- Validasi token: cari di sheet `tokens`, cek expired, cek sudah dipakai.
- Error: `token_invalid`, `token_expired`, `token_already_used`.
- Simpan presensi ke sheet `presence`.

### Cek Status — `GET /exec?path=presence/status&user_id=...&course_id=...&session_id=...`

**Response:**
```json
{
  "ok": true,
  "data": {
    "user_id": "2023xxxx", "course_id": "cloud-101",
    "session_id": "sesi-02", "status": "checked_in",
    "last_ts": "2026-02-18T10:01:10Z"
  }
}
```

---

## Step 3: Implementasi Sensor Accelerometer (Batch)

**Endpoint:** `POST /exec?path=sensor/accel/batch`

**Request body:**
```json
{
  "device_id": "dev-001",
  "ts": "2026-02-18T10:00:00Z",
  "data": [
    { "x": 0.12, "y": -0.05, "z": 9.81, "ts": "2026-02-18T10:00:00.100Z" },
    { "x": 0.11, "y": -0.06, "z": 9.80, "ts": "2026-02-18T10:00:00.200Z" }
  ]
}
```

- Gunakan `sheet.getRange(...).setValues(rows)` untuk batch write (lebih cepat dari appendRow loop).

---

## Step 4: Implementasi GPS Tracking

### Post GPS — `POST /exec?path=sensor/gps`
```json
{ "device_id": "dev-001", "lat": -7.983908, "lng": 112.621391, "ts": "2026-02-18T10:00:00Z" }
```

### GPS Marker (titik terakhir) — `GET /exec?path=sensor/gps/marker&device_id=dev-001`

### GPS Polyline (rentang waktu) — `GET /exec?path=sensor/gps/polyline&device_id=dev-001&from=ISO&to=ISO`

---

## Step 5: Standardisasi Format Response & Waktu

```javascript
function sendSuccess(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendError(error) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Semua timestamp menggunakan ISO-8601: `new Date().toISOString()` → `"2026-02-18T10:15:30.000Z"`

---

## Step 6: Deployment & Version Control

1. Push kode ke GAS:
   ```bash
   clasp push
   ```

2. Di GAS Dashboard → **Deploy → New Deployment:**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone** ← wajib agar tidak perlu login
   - Klik **Deploy**, catat Script ID

3. Base URL:
   ```
   https://script.google.com/macros/s/<SCRIPT_ID>/exec
   ```

4. **Setiap kali ubah kode**, buat **New Deployment** (bukan update) agar perubahan aktif.

5. Backup ke GitHub:
   ```bash
   git add . && git commit -m "feat: GAS API v1 with query-param routing" && git push
   ```

> ⚠️ **Gotcha penting:** Kalau kamu edit kode lalu test tanpa deploy ulang, kamu masih test kode lama.
> Selalu buat New Deployment setiap push ke production.

---

## Step 7: Dokumentasi OpenAPI (Swagger)

- Buat file `openapi.yaml` di repository.
- Base URL: `https://script.google.com/macros/s/{SCRIPT_ID}/exec`
- Semua endpoint menggunakan query parameter `path` sebagai "virtual path".
- Lihat file `openapi.yaml` yang sudah disertakan.

---

Step 8: Implementasi Frontend (HTML View untuk QR & UI)
Selain merespons dengan JSON untuk API, Google Apps Script juga bisa menampilkan halaman web (UI) menggunakan HtmlService. Kita akan buat satu route khusus untuk menampilkan Dashboard QR.

1. Update Routing di doGet(e)
Modifikasi fungsi doGet di Code.gs agar mengembalikan halaman HTML jika path-nya adalah ui (atau jika tidak ada path yang diberikan).

JavaScript

function doGet(e) {
  const path = (e.parameter && e.parameter.path) ? e.parameter.path : "ui"; // Default ke UI

  // Routing untuk API GET yang sudah ada
  if (path === "presence/status") {
    return handleGetStatus(e);
  } else if (path === "sensor/gps/marker") {
    return handleGetGpsMarker(e);
  } else if (path === "sensor/gps/polyline") {
    return handleGetGpsPolyline(e);
  } 
  
  // Routing untuk Frontend UI
  else if (path === "ui") {
    // Render file Index.html
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('Dashboard Presensi QR')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  return sendError("Route not found");
}
2. Buat File Index.html di Editor GAS
Tambahkan file HTML baru di project Google Apps Script kamu dengan nama Index.html. File ini akan berisi UI sederhana dan menggunakan library eksternal (via CDN) untuk me-render QR Code.

HTML

<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <title>Dashboard Presensi</title>
  <style>
    body { font-family: sans-serif; text-align: center; padding: 2rem; background: #f4f4f9; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 400px; margin: auto; }
    button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px; }
    button:hover { background: #0056b3; }
    #qr-container { margin-top: 20px; display: flex; justify-content: center; min-height: 200px; align-items: center; }
    .status { margin-top: 15px; font-weight: bold; color: #333; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
</head>
<body>

  <div class="card">
    <h2>Generate QR Presensi</h2>
    <p>Course: <strong>Cloud-101</strong> | Sesi: <strong>02</strong></p>
    
    <div id="qr-container">
      <span id="placeholder">Klik tombol di bawah untuk generate QR</span>
    </div>
    
    <div id="status-text" class="status"></div>
    
    <button onclick="generateQR()">Generate QR Baru</button>
  </div>

  <script>
    let qrcode = null;

    function generateQR() {
      document.getElementById('placeholder').style.display = 'none';
      document.getElementById('status-text').innerText = 'Generating token...';
      
      const payload = {
        course_id: "cloud-101",
        session_id: "sesi-02",
        ts: new Date().toISOString()
      };

      // Memanggil fungsi server GAS menggunakan google.script.run
      google.script.run
        .withSuccessHandler(onSuccess)
        .withFailureHandler(onError)
        .processGenerateQR(payload); // Pastikan kamu membuat fungsi processGenerateQR() di Code.gs
    }

    function onSuccess(response) {
      if(response.ok) {
        document.getElementById('status-text').innerText = 'Token: ' + response.data.qr_token + '\nBerakhir: ' + new Date(response.data.expires_at).toLocaleTimeString();
        
        // Hapus QR lama jika ada
        document.getElementById('qr-container').innerHTML = '';
        
        // Render QR baru
        qrcode = new QRCode(document.getElementById("qr-container"), {
          text: response.data.qr_token,
          width: 200,
          height: 200,
          colorDark : "#000000",
          colorLight : "#ffffff",
          correctLevel : QRCode.CorrectLevel.H
        });
      } else {
        document.getElementById('status-text').innerText = 'Error: ' + response.error;
      }
    }

    function onError(error) {
      document.getElementById('status-text').innerText = 'Terjadi kesalahan jaringan!';
      console.error(error);
    }
  </script>
</body>
</html>
3. Tambahkan Helper Function di Code.gs
Karena UI HTML tidak bisa langsung nge-HIT route POST web app-nya sendiri tanpa ribet urusan URL endpoint, cara paling mulus di GAS adalah membuat jembatan fungsi menggunakan google.script.run yang bisa diakses langsung dari frontend.

JavaScript

// Tambahkan ini di Code.gs agar bisa dipanggil oleh frontend HTML
function processGenerateQR(payload) {
  // Asumsi kamu sudah punya fungsi logika untuk generate token
  // Contoh: generateTokenLogic(course_id, session_id, ts)
  
  try {
    const token = "TKN-" + Utilities.getUuid().substring(0,6).toUpperCase();
    const expires = new Date(new Date().getTime() + 120000); // +2 menit
    
    // TODO: Simpan ke sheet 'tokens' sesuai Step 2
    
    return {
      ok: true,
      data: {
        qr_token: token,
        expires_at: expires.toISOString()
      }
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
Catatan Integrasi:
Dengan tambahan Step 8 ini, ketika user membuka URL deployment GAS (contoh: https://script.google.com/macros/s/<SCRIPT_ID>/exec?path=ui), mereka tidak akan melihat file JSON mentah, melainkan tampilan Dashboard HTML. Tombol "Generate QR" akan langsung mengeksekusi fungsi di backend secara asynchronous dan menampilkan QR Code di layar.

## Referensi URL Lengkap

| Method | URL | Deskripsi |
|--------|-----|-----------|
| POST | `/exec?path=presence/qr/generate` | Generate QR token |
| POST | `/exec?path=presence/checkin` | Check-in mahasiswa |
| GET  | `/exec?path=presence/status&user_id=X&course_id=Y&session_id=Z` | Cek status presensi |
| POST | `/exec?path=sensor/accel/batch` | Batch accelerometer |
| POST | `/exec?path=sensor/gps` | Post GPS |
| GET  | `/exec?path=sensor/gps/marker&device_id=X` | GPS marker terakhir |
| GET  | `/exec?path=sensor/gps/polyline&device_id=X&from=ISO&to=ISO` | GPS polyline |