// ============================================================
//  GAS Backend API v1 — Presensi QR Dinamis, Telemetry, GPS
//  Routing: e.parameter.path  |  Runtime: V8  |  TZ: Asia/Jakarta
// ============================================================

// ─── CONFIGURATION ──────────────────────────────────────────
const SPREADSHEET_ID = '1A-PRMkgt7YbXCelkrrfSLMBHh1fdzACXiM4gy4trONM';

const SHEET = {
    TOKENS: 'tokens',
    PRESENCE: 'presence',
    ACCEL: 'accel',
    GPS: 'gps',
};

const HEADERS = {
    [SHEET.TOKENS]: ['qr_token', 'course_id', 'session_id', 'created_at', 'expires_at', 'used'],
    [SHEET.PRESENCE]: ['presence_id', 'user_id', 'device_id', 'course_id', 'session_id', 'qr_token', 'ts', 'recorded_at'],
    [SHEET.ACCEL]: ['device_id', 'x', 'y', 'z', 'sample_ts', 'batch_ts', 'recorded_at'],
    [SHEET.GPS]: ['device_id', 'lat', 'lng', 'accuracy', 'altitude', 'ts', 'recorded_at'],
};

// QR token validity duration (in milliseconds) — default 2 minutes
const QR_TOKEN_TTL_MS = 120 * 1000;


// ─── ROUTER ─────────────────────────────────────────────────

/**
 * GET router — routes by e.parameter.path
 *
 * Supported paths:
 *   ?path=presence/status
 *   ?path=telemetry/gps/latest
 *   ?path=telemetry/gps/history
 *   ?path=telemetry/gps/devices
 *   ?path=telemetry/gps/global
 *   ?path=ui  (default — serves Dashboard HTML)
 */
function doGet(e) {
    try {
        const path = (e.parameter && e.parameter.path) ? e.parameter.path : 'ui';
        const params = e ? e.parameter : {};

        switch (path) {
            case 'presence/status':
                return sendSuccess(getPresenceStatus(params.user_id, params.course_id, params.session_id));
            case 'presence/history':
                return sendSuccess(getPresenceHistory(params.course_id, params.session_id, params.limit));

            case 'telemetry/accel/latest':
                return sendSuccess(getAccelLatest(params.device_id));

            case 'telemetry/gps/latest':
                return sendSuccess(getGpsLatest(params.device_id));

            case 'telemetry/gps/history':
                return sendSuccess(getGpsHistory(params.device_id, params.limit));

            case 'telemetry/gps/devices':
                return sendSuccess({ items: getGpsDevices() });

            case 'telemetry/gps/global':
                return sendSuccess(getGpsGlobal(params.limit));

            case 'accel-ui':
                return HtmlService.createHtmlOutputFromFile('AccelDashboard')
                    .setTitle('Accelerometer Monitor')
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

            case 'gps-ui':
                return HtmlService.createHtmlOutputFromFile('GPSDashboard')
                    .setTitle('GPS Monitor')
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

            case 'ui':
                return HtmlService.createHtmlOutputFromFile('Index')
                    .setTitle('Dashboard Presensi QR')
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

            case 'accel-ui':
                return HtmlService.createHtmlOutputFromFile('AccelDashboard')
                    .setTitle('Accelerometer Dashboard')
                    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

            default:
                return sendSuccess({
                    status: 'ok',
                    message: 'GAS Backend API v1 is running.',
                    endpoints: {
                        GET: [
                            '?path=presence/status',
                            '?path=presence/history',
                            '?path=telemetry/accel/latest',
                            '?path=telemetry/gps/latest',
                            '?path=telemetry/gps/history',
                            '?path=telemetry/gps/devices',
                            '?path=telemetry/gps/global',
                            '?path=gps-ui',
                            '?path=ui',
                            '?path=accel-ui',
                        ],
                        POST: [
                            '?path=presence/qr/generate',
                            '?path=presence/checkin',
                            '?path=telemetry/accel',
                            '?path=telemetry/gps',
                        ],
                    },
                });
        }
    } catch (err) {
        return sendError(err.message);
    }
}

/**
 * POST router — routes by e.parameter.path
 *
 * Supported paths:
 *   ?path=presence/qr/generate
 *   ?path=presence/checkin
 *   ?path=telemetry/accel
 *   ?path=telemetry/gps
 */
function doPost(e) {
    try {
        const path = (e.parameter && e.parameter.path) ? e.parameter.path : '';
        const body = e && e.postData ? JSON.parse(e.postData.contents) : {};

        switch (path) {
            case 'presence/qr/generate':
                return sendSuccess(generateQRToken(body));

            case 'presence/checkin':
                return sendSuccess(checkin(body));

            case 'telemetry/accel':
                return sendSuccess(batchAccel(body));

            case 'telemetry/gps':
                return sendSuccess(logGPS(body));

            case 'telemetry/gps':
                logGPS(body);
                return sendSuccess({ accepted: true });

            default:
                return sendError('Unknown endpoint: POST ?' + path);
        }
    } catch (err) {
        return sendError(err.message);
    }
}


// ─── NAVIGATION HELPER ───────────────────────────────────────

/**
 * Called by HTML pages via google.script.run to get the real deployment URL.
 * window.location inside a GAS iframe points to googleusercontent.com, not
 * the actual script.google.com deployment URL — so we resolve it server-side.
 *
 * @returns {string} The base deployment URL (without query params)
 */
function getDeployUrl() {
    return ScriptApp.getService().getUrl();
}


// ─── RESPONSE HELPERS ───────────────────────────────────────

/**
 * @param {Object} data
 * @returns {ContentService.TextOutput} JSON { ok: true, data: {...} }
 */
function sendSuccess(data) {
    return ContentService
        .createTextOutput(JSON.stringify({ ok: true, data: data }))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * @param {string} message
 * @returns {ContentService.TextOutput} JSON { ok: false, error: "..." }
 */
function sendError(message) {
    return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: message || 'Internal server error' }))
        .setMimeType(ContentService.MimeType.JSON);
}


// ─── SHEET HELPERS ──────────────────────────────────────────

/** @returns {SpreadsheetApp.Spreadsheet} */
function getSpreadsheet() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Returns an existing sheet or creates it with predefined headers.
 * @param {string} name
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
 * Returns current time as ISO-8601 string.
 * @returns {string} e.g. "2026-02-22T15:30:00.000Z"
 */
function nowISO() {
    return new Date().toISOString();
}

/**
 * Generates a unique ID (simple UUID-like).
 * @returns {string}
 */
function generateId() {
    return Utilities.getUuid();
}


// ─── MODULE 1: PRESENSI QR DINAMIS ─────────────────────────

/**
 * POST ?path=presence/qr/generate
 *
 * Generates a unique QR token for a course session with a 2-minute TTL.
 *
 * @param {Object} body - { course_id, session_id, ts }
 * @returns {Object} { qr_token, expires_at }
 */
function generateQRToken(body) {
    if (!body.course_id || !body.session_id) {
        throw new Error('Missing required fields: course_id, session_id');
    }

    const sheet = getOrCreateSheet(SHEET.TOKENS);
    const now = body.ts ? new Date(body.ts) : new Date();
    const expiresAt = new Date(now.getTime() + QR_TOKEN_TTL_MS);
    const qrToken = 'TKN-' + Utilities.getUuid().substring(0, 6).toUpperCase();

    const row = [
        qrToken,                  // qr_token
        body.course_id,           // course_id
        body.session_id,          // session_id
        now.toISOString(),        // created_at
        expiresAt.toISOString(),  // expires_at
        false,                    // used
    ];

    sheet.appendRow(row);

    return {
        qr_token: qrToken,
        expires_at: expiresAt.toISOString(),
    };
}

/**
 * POST ?path=presence/checkin
 *
 * Validates a QR token and records attendance.
 *
 * @param {Object} body - { user_id, device_id, course_id, session_id, qr_token, ts }
 * @returns {Object} { presence_id, status }
 */
function checkin(body) {
    if (!body.user_id || !body.qr_token || !body.course_id || !body.session_id) {
        throw new Error('Missing required fields: user_id, qr_token, course_id, session_id');
    }

    // ── Validate token ──
    const tokensSheet = getOrCreateSheet(SHEET.TOKENS);
    const tokensData = tokensSheet.getDataRange().getValues();
    const headers = tokensData[0];
    let tokenRowIndex = -1;

    const checkTime = body.ts ? new Date(body.ts) : new Date();

    // Column indices based on HEADERS.tokens:
    // 0=qr_token, 1=course_id, 2=session_id, 3=created_at, 4=expires_at, 5=used
    for (let i = 1; i < tokensData.length; i++) {
        const rowQRToken = tokensData[i][0];
        const rowCourseId = tokensData[i][1];
        const rowSessionId = tokensData[i][2];
        const rowExpiresAt = new Date(tokensData[i][4]);
        const rowUsed = tokensData[i][5];

        if (rowQRToken === body.qr_token &&
            String(rowCourseId) === String(body.course_id) &&
            String(rowSessionId) === String(body.session_id)) {

            // Check if already used
            if (rowUsed === true || rowUsed === 'TRUE' || rowUsed === 'true') {
                throw new Error('token_already_used');
            }

            // Check expiration
            if (checkTime > rowExpiresAt) {
                throw new Error('token_expired');
            }

            tokenRowIndex = i;
            break;
        }
    }

    if (tokenRowIndex === -1) {
        throw new Error('token_invalid');
    }

    // ── Mark token as used ──
    tokensSheet.getRange(tokenRowIndex + 1, 6).setValue(true); // Column 6 = "used"

    // ── Record presence ──
    const presenceSheet = getOrCreateSheet(SHEET.PRESENCE);
    const presenceId = 'PR-' + Utilities.getUuid().substring(0, 4).toUpperCase();

    const row = [
        presenceId,               // presence_id
        body.user_id,             // user_id
        body.device_id || '',     // device_id
        body.course_id,           // course_id
        body.session_id,          // session_id
        body.qr_token,            // qr_token
        checkTime.toISOString(),  // ts
        nowISO(),                 // recorded_at
    ];

    presenceSheet.appendRow(row);

    return {
        presence_id: presenceId,
        status: 'checked_in',
    };
}

/**
 * GET ?path=presence/status&user_id=...&course_id=...&session_id=...
 *
 * Returns the latest attendance status for a user in a specific course session.
 *
 * @param {string} userId
 * @param {string} courseId
 * @param {string} sessionId
 * @returns {Object}
 */
function getPresenceStatus(userId, courseId, sessionId) {
    if (!userId || !courseId || !sessionId) {
        throw new Error('Missing required parameters: user_id, course_id, session_id');
    }

    const sheet = getOrCreateSheet(SHEET.PRESENCE);
    const data = sheet.getDataRange().getValues();

    // Column indices: 0=presence_id, 1=user_id, 2=device_id, 3=course_id, 4=session_id, 5=qr_token, 6=ts, 7=recorded_at
    // Walk backwards — most recent first
    for (let i = data.length - 1; i >= 1; i--) {
        if (String(data[i][1]) === String(userId) &&
            String(data[i][3]) === String(courseId) &&
            String(data[i][4]) === String(sessionId)) {
            return {
                user_id: userId,
                course_id: courseId,
                session_id: sessionId,
                status: 'checked_in',
                last_ts: data[i][6],
            };
        }
    }

    return {
        user_id: userId,
        course_id: courseId,
        session_id: sessionId,
        status: 'not_checked_in',
        last_ts: null,
    };
}

/**
 * GET ?path=presence/history&course_id=...&session_id=...&limit=...
 *
 * Returns attendance list for a specific course session.
 *
 * @param {string} courseId
 * @param {string} sessionId
 * @param {string|number} limit - max number of rows (default 300)
 * @returns {Object}
 */
function getPresenceHistory(courseId, sessionId, limit) {
    if (!courseId || !sessionId) {
        throw new Error('Missing required parameters: course_id, session_id');
    }

    const parsedLimit = Number(limit);
    const maxItems = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.floor(parsedLimit), 1000)
        : 300;
    const courseKey = String(courseId);
    const sessionKey = String(sessionId);

    const sheet = getOrCreateSheet(SHEET.PRESENCE);
    const data = sheet.getDataRange().getValues();
    const items = [];

    // Column indices: 0=presence_id, 1=user_id, 2=device_id, 3=course_id, 4=session_id, 5=qr_token, 6=ts, 7=recorded_at
    // Walk backwards to return most recent first.
    for (let i = data.length - 1; i >= 1 && items.length < maxItems; i--) {
        if (String(data[i][3]) === courseKey &&
            String(data[i][4]) === sessionKey) {
            items.push({
                presence_id: data[i][0],
                user_id: data[i][1],
                device_id: data[i][2],
                course_id: data[i][3],
                session_id: data[i][4],
                qr_token: data[i][5],
                ts: data[i][6],
                recorded_at: data[i][7],
            });
        }
    }

    return {
        course_id: courseId,
        session_id: sessionId,
        total: items.length,
        items: items,
    };
}


// ─── MODULE 2: ACCELEROMETER BATCH ─────────────────────────

/**
 * POST ?path=telemetry/accel
 *
 * Batch-writes accelerometer readings using setValues() for performance.
 *
 * @param {Object} body - { device_id, ts, samples: [{ x, y, z, t }] }
 * @returns {Object} { accepted: <count> }
 */
function batchAccel(body) {
    if (!body.device_id || !Array.isArray(body.samples) || body.samples.length === 0) {
        throw new Error('Missing required fields: device_id, samples (non-empty array)');
    }

    const sheet = getOrCreateSheet(SHEET.ACCEL);
    const batchTs = body.ts || nowISO();
    const recordedAt = nowISO();

    // Columns: device_id, x, y, z, sample_ts, batch_ts, recorded_at
    const rows = body.samples.map(function (r) {
        return [
            body.device_id,
            r.x || 0,
            r.y || 0,
            r.z || 0,
            r.t || nowISO(),   // sample_ts
            batchTs,            // batch_ts
            recordedAt,         // recorded_at
        ];
    });

    // Batch write
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, rows[0].length).setValues(rows);

    return {
        accepted: rows.length,
    };
}

/**
 * GET ?path=telemetry/accel/latest&device_id=...
 *
 * Returns the latest accelerometer reading for a device.
 *
 * @param {string} deviceId
 * @returns {Object}
 */
function getAccelLatest(deviceId) {
    if (!deviceId) {
        throw new Error('Missing required parameter: device_id');
    }

    const sheet = getOrCreateSheet(SHEET.ACCEL);
    const data = sheet.getDataRange().getValues();

    // Columns: 0=device_id, 1=x, 2=y, 3=z, 4=sample_ts, 5=batch_ts, 6=recorded_at
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === deviceId) {
            return {
                t: data[i][4] || null,
                x: data[i][1] || null,
                y: data[i][2] || null,
                z: data[i][3] || null,
            };
        }
    }

    return {
        t: null,
        x: null,
        y: null,
        z: null,
    };
}

/**
 * Helper to get a list of unique Device IDs from the ACCEL sheet
 * Called by AccelDashboard.html via google.script.run
 * 
 * @returns {Array<string>} List of device_id strings
 */
function getAccelDevices() {
    const sheet = getOrCreateSheet(SHEET.ACCEL);
    const data = sheet.getDataRange().getValues();
    const unique = new Set();
    
    // Column 0 is device_id, skip header (row 0)
    for (let i = 1; i < data.length; i++) {
        const id = data[i][0];
        if (id) {
            unique.add(String(id));
        }
    }
    
    return Array.from(unique);
}


// ─── MODULE 3: GPS TRACKING ────────────────────────────────

/**
 * POST ?path=telemetry/gps
 *
 * Logs a single GPS coordinate.
 *
 * @param {Object} body - { device_id, lat, lng, ts, accuracy_m? }
 * @returns {Object} { accepted: true }
 */
function logGPS(body) {
    if (!body.device_id || body.lat === undefined || body.lng === undefined) {
        throw new Error('Missing required fields: device_id, lat, lng');
    }

    const sheet = getOrCreateSheet(SHEET.GPS);

    // Columns: device_id, lat, lng, accuracy, altitude, ts, recorded_at
    const row = [
        body.device_id,
        body.lat,
        body.lng,
        body.accuracy_m || body.accuracy || '',
        body.altitude || '',
        body.ts || nowISO(),
        nowISO(),              // recorded_at
    ];

    sheet.appendRow(row);

    return {
        accepted: true,
    };
}

/**
 * GET ?path=telemetry/gps/latest&device_id=...
 *
 * Returns the single most recent GPS coordinate for a device (for Marker).
 *
 * @param {string} deviceId
 * @returns {Object}
 */
function getGpsLatest(deviceId) {
    if (!deviceId) {
        throw new Error('Missing required parameter: device_id');
    }

    const sheet = getOrCreateSheet(SHEET.GPS);
    const data = sheet.getDataRange().getValues();

    // Columns: 0=device_id, 1=lat, 2=lng, 3=accuracy, 4=altitude, 5=ts, 6=recorded_at
    for (let i = data.length - 1; i >= 1; i--) {
        if (data[i][0] === deviceId) {
            return {
                ts: data[i][5],
                lat: data[i][1],
                lng: data[i][2],
                accuracy_m: data[i][3] || null,
            };
        }
    }

    return {
        ts: null,
        lat: null,
        lng: null,
        accuracy_m: null,
    };
}

/**
 * GET ?path=telemetry/gps/history&device_id=...&limit=200
 *
 * Returns the N most recent GPS coordinates for a device (for Polyline).
 *
 * @param {string} deviceId
 * @param {string|number} limit - max number of points (default 200)
 * @returns {Object}
 */
function getGpsHistory(deviceId, limit) {
    if (!deviceId) {
        throw new Error('Missing required parameter: device_id');
    }

    const parsedLimit = Number(limit);
    const maxItems = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.floor(parsedLimit), 1000)
        : 200;
    const sheet = getOrCreateSheet(SHEET.GPS);
    const data = sheet.getDataRange().getValues();

    const items = [];

    // Columns: 0=device_id, 1=lat, 2=lng, 3=accuracy, 4=altitude, 5=ts, 6=recorded_at
    // Walk backwards to get most recent first, then reverse for chronological order
    for (let i = data.length - 1; i >= 1 && items.length < maxItems; i--) {
        if (data[i][0] !== deviceId) continue;

        items.push({
            ts: data[i][5],
            lat: data[i][1],
            lng: data[i][2],
        });
    }

    items.reverse(); // chronological order (oldest first)

    return {
        device_id: deviceId,
        items: items,
    };
}

/**
 * Returns unique list of Device IDs from GPS sheet.
 *
 * @returns {Array<string>}
 */
function getGpsDevices() {
    const sheet = getOrCreateSheet(SHEET.GPS);
    const data = sheet.getDataRange().getValues();
    const unique = new Set();

    for (let i = 1; i < data.length; i++) {
        const id = data[i][0];
        if (id) unique.add(String(id));
    }

    return Array.from(unique);
}

/**
 * GET ?path=telemetry/gps/global&limit=200
 *
 * Returns all device routes (polyline points) and each device last position.
 *
 * @param {string|number} limit - max number of points per device (default 200)
 * @returns {Object}
 */
function getGpsGlobal(limit) {
    const parsedLimit = Number(limit);
    const maxItems = Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(Math.floor(parsedLimit), 1000)
        : 200;
    const devices = getGpsDevices();

    const items = devices.map(function (deviceId) {
        const history = getGpsHistory(deviceId, maxItems).items;
        const latest = getGpsLatest(deviceId);
        return {
            device_id: deviceId,
            polyline: history,
            last_position: latest,
        };
    });

    return { items: items };
}


// ─── FRONTEND HELPER ────────────────────────────────────────

/**
 * Called by Index.html via google.script.run to generate a QR token.
 * This bridges the frontend UI with the backend logic.
 *
 * @param {Object} payload - { course_id, session_id, ts }
 * @returns {Object} { ok, data/error }
 */
function processGenerateQR(payload) {
    try {
        const qrToken = 'TKN-' + Utilities.getUuid().substring(0, 6).toUpperCase();
        const now = payload.ts ? new Date(payload.ts) : new Date();
        const expiresAt = new Date(now.getTime() + QR_TOKEN_TTL_MS);

        // Save to tokens sheet
        const sheet = getOrCreateSheet(SHEET.TOKENS);
        sheet.appendRow([
            qrToken,
            payload.course_id,
            payload.session_id,
            now.toISOString(),
            expiresAt.toISOString(),
            false,
        ]);

        return {
            ok: true,
            data: {
                qr_token: qrToken,
                expires_at: expiresAt.toISOString(),
            },
        };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

/**
 * Called by Index.html via google.script.run to fetch attendance list.
 *
 * @param {Object} payload - { course_id, session_id }
 * @returns {Object} { ok, data/error }
 */
function processGetPresenceHistory(payload) {
    try {
        const safePayload = payload || {};
        return {
            ok: true,
            data: getPresenceHistory(safePayload.course_id, safePayload.session_id, safePayload.limit),
        };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}
