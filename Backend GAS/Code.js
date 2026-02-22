// ============================================================
//  GAS Backend API — Presensi QR, Batch Telemetry, GPS Tracking
//  Runtime: V8 | Timezone: Asia/Jakarta
// ============================================================

// ─── CONFIGURATION ──────────────────────────────────────────
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // ← Ganti dengan ID Spreadsheet Anda

const SHEET_PRESENSI = 'Presensi';
const SHEET_TELEMETRY = 'Telemetry';
const SHEET_GPS_LOG = 'GPS_Log';

const HEADERS = {
    [SHEET_PRESENSI]: ['Timestamp', 'UserId', 'UserName', 'QRToken', 'Status', 'CheckInTime', 'Latitude', 'Longitude'],
    [SHEET_TELEMETRY]: ['Timestamp', 'UserId', 'AccelX', 'AccelY', 'AccelZ', 'DeviceInfo'],
    [SHEET_GPS_LOG]: ['Timestamp', 'UserId', 'Latitude', 'Longitude', 'Accuracy', 'Speed', 'Bearing'],
};


// ─── ROUTER ─────────────────────────────────────────────────

/**
 * Handles all GET requests.
 * Route by `action` query parameter.
 */
function doGet(e) {
    try {
        const action = (e && e.parameter && e.parameter.action) || '';
        const params = e ? e.parameter : {};

        switch (action) {
            case 'presensi_status':
                return jsonResponse(getPresensiStatus(params.userId));

            case 'latest_telemetry':
                return jsonResponse(getLatestTelemetry(params.userId, parseInt(params.limit) || 10));

            case 'latest_gps':
                return jsonResponse(getLatestGPS(params.userId));

            case 'gps_history':
                return jsonResponse(getGPSHistory(params.userId, params.startDate, params.endDate));

            default:
                return jsonResponse({
                    status: 'ok',
                    message: 'GAS Backend API is running.',
                    availableActions: [
                        'presensi_status', 'latest_telemetry',
                        'latest_gps', 'gps_history',
                    ],
                });
        }
    } catch (err) {
        return errorResponse(err.message);
    }
}

/**
 * Handles all POST requests.
 * Route by `action` query parameter.
 */
function doPost(e) {
    try {
        const action = (e && e.parameter && e.parameter.action) || '';
        const payload = e && e.postData ? JSON.parse(e.postData.contents) : {};

        switch (action) {
            case 'checkin':
                return jsonResponse(handleCheckIn(payload));

            case 'batch_telemetry':
                return jsonResponse(handleBatchTelemetry(payload));

            case 'log_gps':
                return jsonResponse(logGPS(payload));

            default:
                return errorResponse('Unknown POST action: ' + action, 400);
        }
    } catch (err) {
        return errorResponse(err.message);
    }
}


// ─── RESPONSE HELPERS ───────────────────────────────────────

/**
 * Returns a JSON success response.
 * @param {Object} data
 * @returns {ContentService.TextOutput}
 */
function jsonResponse(data) {
    const output = {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
    };
    return ContentService
        .createTextOutput(JSON.stringify(output))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Returns a JSON error response.
 * @param {string} message
 * @param {number} [code=500]
 * @returns {ContentService.TextOutput}
 */
function errorResponse(message, code) {
    const output = {
        success: false,
        error: {
            code: code || 500,
            message: message || 'Internal server error',
        },
        timestamp: new Date().toISOString(),
    };
    return ContentService
        .createTextOutput(JSON.stringify(output))
        .setMimeType(ContentService.MimeType.JSON);
}


// ─── SHEET HELPERS ──────────────────────────────────────────

/**
 * Returns the spreadsheet reference.
 * @returns {SpreadsheetApp.Spreadsheet}
 */
function getSpreadsheet() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Returns an existing sheet or creates it with the predefined headers.
 * @param {string} name - Sheet tab name
 * @returns {SpreadsheetApp.Sheet}
 */
function getOrCreateSheet(name) {
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
        sheet = ss.insertSheet(name);
        const headers = HEADERS[name];
        if (headers) {
            sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
            sheet.getRange(1, 1, 1, headers.length)
                .setFontWeight('bold')
                .setBackground('#4a86e8')
                .setFontColor('#ffffff');
            sheet.setFrozenRows(1);
        }
    }
    return sheet;
}

/**
 * Formats a Date object to string in Asia/Jakarta timezone.
 * @param {Date} [date=new Date()]
 * @returns {string} yyyy-MM-dd HH:mm:ss
 */
function formatTimestamp(date) {
    return Utilities.formatDate(date || new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Returns today's date string (yyyy-MM-dd) in Asia/Jakarta.
 * @returns {string}
 */
function todayString() {
    return Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
}


// ─── MODULE 1: PRESENSI QR ─────────────────────────────────

/**
 * Validates a QR token and records a check-in.
 * Prevents duplicate check-in on the same day.
 *
 * @param {Object} payload - { userId, userName, qrToken, latitude?, longitude? }
 * @returns {Object} result with status and checkInTime
 */
function handleCheckIn(payload) {
    if (!payload.userId || !payload.qrToken) {
        throw new Error('Missing required fields: userId, qrToken');
    }

    const sheet = getOrCreateSheet(SHEET_PRESENSI);
    const now = new Date();
    const today = todayString();

    // Check if user already checked in today
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
        const rowDate = Utilities.formatDate(new Date(data[i][0]), 'Asia/Jakarta', 'yyyy-MM-dd');
        if (data[i][1] === payload.userId && rowDate === today && data[i][4] === 'CHECKED_IN') {
            return {
                status: 'ALREADY_CHECKED_IN',
                message: 'User sudah melakukan check-in hari ini.',
                checkInTime: data[i][5],
            };
        }
    }

    // Record new check-in
    const row = [
        formatTimestamp(now),      // Timestamp
        payload.userId,            // UserId
        payload.userName || '',    // UserName
        payload.qrToken,           // QRToken
        'CHECKED_IN',              // Status
        formatTimestamp(now),       // CheckInTime
        payload.latitude || '',    // Latitude
        payload.longitude || '',   // Longitude
    ];

    sheet.appendRow(row);

    return {
        status: 'CHECKED_IN',
        message: 'Check-in berhasil dicatat.',
        checkInTime: formatTimestamp(now),
        userId: payload.userId,
    };
}

/**
 * Returns today's attendance status for a specific user.
 *
 * @param {string} userId
 * @returns {Object} with userId, date, status, checkInTime, isPresent
 */
function getPresensiStatus(userId) {
    if (!userId) {
        throw new Error('Missing required parameter: userId');
    }

    const sheet = getOrCreateSheet(SHEET_PRESENSI);
    const data = sheet.getDataRange().getValues();
    const today = todayString();

    // Search from bottom for most recent entry
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][1] === userId) {
            const rowDate = Utilities.formatDate(new Date(data[i][0]), 'Asia/Jakarta', 'yyyy-MM-dd');
            if (rowDate === today) {
                return {
                    userId: userId,
                    date: today,
                    status: data[i][4],
                    checkInTime: data[i][5],
                    isPresent: true,
                };
            }
        }
    }

    return {
        userId: userId,
        date: today,
        status: 'NOT_CHECKED_IN',
        checkInTime: null,
        isPresent: false,
    };
}


// ─── MODULE 2: BATCH TELEMETRY (ACCELEROMETER) ─────────────

/**
 * Receives an array of accelerometer readings and bulk-writes them.
 * Uses getRange().setValues() for performance — avoids timeout on large batches.
 *
 * @param {Object} payload - { userId, deviceInfo?, readings: [{ accelX, accelY, accelZ, timestamp? }] }
 * @returns {Object} result with count of saved records
 */
function handleBatchTelemetry(payload) {
    if (!payload.userId || !Array.isArray(payload.readings) || payload.readings.length === 0) {
        throw new Error('Missing required fields: userId, readings (non-empty array)');
    }

    const sheet = getOrCreateSheet(SHEET_TELEMETRY);
    const now = new Date();
    const deviceInfo = payload.deviceInfo || '';

    // Build 2D array for batch insert
    const rows = payload.readings.map(function (r) {
        return [
            r.timestamp ? formatTimestamp(new Date(r.timestamp)) : formatTimestamp(now),
            payload.userId,
            r.accelX || 0,
            r.accelY || 0,
            r.accelZ || 0,
            deviceInfo,
        ];
    });

    // Batch write — much faster than appendRow in a loop
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);

    return {
        status: 'OK',
        message: rows.length + ' telemetry record(s) saved.',
        count: rows.length,
        userId: payload.userId,
    };
}

/**
 * Returns the N most recent telemetry records for a user.
 *
 * @param {string} userId
 * @param {number} [limit=10] - Number of records to return
 * @returns {Object} with userId, count, and readings array
 */
function getLatestTelemetry(userId, limit) {
    if (!userId) {
        throw new Error('Missing required parameter: userId');
    }

    limit = limit || 10;
    const sheet = getOrCreateSheet(SHEET_TELEMETRY);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const results = [];

    // Walk backwards for efficiency — most recent first
    for (let i = data.length - 1; i >= 1 && results.length < limit; i--) {
        if (data[i][1] === userId) {
            const record = {};
            for (let j = 0; j < headers.length; j++) {
                record[headers[j]] = data[i][j];
            }
            results.push(record);
        }
    }

    return {
        userId: userId,
        count: results.length,
        readings: results,
    };
}


// ─── MODULE 3: GPS TRACKING ────────────────────────────────

/**
 * Logs a single GPS coordinate to the GPS_Log sheet.
 *
 * @param {Object} payload - { userId, latitude, longitude, accuracy?, speed?, bearing? }
 * @returns {Object} result with logged coordinate
 */
function logGPS(payload) {
    if (!payload.userId || payload.latitude === undefined || payload.longitude === undefined) {
        throw new Error('Missing required fields: userId, latitude, longitude');
    }

    const sheet = getOrCreateSheet(SHEET_GPS_LOG);
    const now = new Date();

    const row = [
        formatTimestamp(now),
        payload.userId,
        payload.latitude,
        payload.longitude,
        payload.accuracy || '',
        payload.speed || '',
        payload.bearing || '',
    ];

    sheet.appendRow(row);

    return {
        status: 'OK',
        message: 'GPS coordinate logged.',
        userId: payload.userId,
        coordinate: {
            latitude: payload.latitude,
            longitude: payload.longitude,
        },
        timestamp: formatTimestamp(now),
    };
}

/**
 * Returns the single most recent GPS coordinate for a user.
 * Used for displaying a Marker on a map.
 *
 * @param {string} userId
 * @returns {Object} with latest coordinate or null values if not found
 */
function getLatestGPS(userId) {
    if (!userId) {
        throw new Error('Missing required parameter: userId');
    }

    const sheet = getOrCreateSheet(SHEET_GPS_LOG);
    const data = sheet.getDataRange().getValues();

    // Walk backwards to find latest entry
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][1] === userId) {
            return {
                userId: userId,
                timestamp: data[i][0],
                latitude: data[i][2],
                longitude: data[i][3],
                accuracy: data[i][4],
                speed: data[i][5],
                bearing: data[i][6],
            };
        }
    }

    return {
        userId: userId,
        message: 'No GPS data found for this user.',
        latitude: null,
        longitude: null,
    };
}

/**
 * Returns an array of GPS coordinates within a date range.
 * Used for drawing a Polyline on a map.
 *
 * @param {string} userId
 * @param {string} [startDate] - yyyy-MM-dd (defaults to today)
 * @param {string} [endDate]   - yyyy-MM-dd (defaults to today)
 * @returns {Object} with coordinates array and count
 */
function getGPSHistory(userId, startDate, endDate) {
    if (!userId) {
        throw new Error('Missing required parameter: userId');
    }

    const sheet = getOrCreateSheet(SHEET_GPS_LOG);
    const data = sheet.getDataRange().getValues();

    // Default range: today
    const today = todayString();
    const start = startDate || today;
    const end = endDate || today;

    const coordinates = [];

    for (let i = 1; i < data.length; i++) {
        if (data[i][1] !== userId) continue;

        const rowDate = Utilities.formatDate(new Date(data[i][0]), 'Asia/Jakarta', 'yyyy-MM-dd');
        if (rowDate >= start && rowDate <= end) {
            coordinates.push({
                timestamp: data[i][0],
                latitude: data[i][2],
                longitude: data[i][3],
                accuracy: data[i][4],
                speed: data[i][5],
                bearing: data[i][6],
            });
        }
    }

    return {
        userId: userId,
        dateRange: { start: start, end: end },
        count: coordinates.length,
        coordinates: coordinates,
    };
}
