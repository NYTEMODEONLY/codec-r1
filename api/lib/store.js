// Persistent store using Neon Postgres
// This enables real-time state sharing across all serverless function instances

import { neon } from '@neondatabase/serverless';

// Get SQL client
function getSQL() {
  return neon(process.env.DATABASE_URL);
}

// Device management
export async function registerDevice(deviceId, codecNumber) {
  const sql = getSQL();
  const lastSeen = Date.now();

  // Upsert device
  await sql`
    INSERT INTO devices (id, codec_number, last_seen, online)
    VALUES (${deviceId}, ${codecNumber}, ${lastSeen}, true)
    ON CONFLICT (id) DO UPDATE SET
      last_seen = ${lastSeen},
      online = true
  `;

  return { codecNumber, lastSeen, online: true };
}

export async function updateDeviceStatus(deviceId) {
  const sql = getSQL();
  const lastSeen = Date.now();

  const result = await sql`
    UPDATE devices
    SET last_seen = ${lastSeen}, online = true
    WHERE id = ${deviceId}
    RETURNING codec_number, last_seen, online
  `;

  if (result.length > 0) {
    return {
      codecNumber: result[0].codec_number,
      lastSeen: result[0].last_seen,
      online: result[0].online
    };
  }
  return null;
}

export async function getOnlineDevices(excludeId = null) {
  const sql = getSQL();
  const now = Date.now();
  const timeout = 30000; // 30 seconds
  const cutoff = now - timeout;

  // Get devices seen within the last 30 seconds
  let devices;
  if (excludeId) {
    devices = await sql`
      SELECT id, codec_number, last_seen, online, avatar
      FROM devices
      WHERE id != ${excludeId}
      AND last_seen > ${cutoff}
      ORDER BY last_seen DESC
    `;
  } else {
    devices = await sql`
      SELECT id, codec_number, last_seen, online, avatar
      FROM devices
      WHERE last_seen > ${cutoff}
      ORDER BY last_seen DESC
    `;
  }

  return devices.map(d => ({
    id: d.id,
    codecNumber: d.codec_number,
    online: (now - d.last_seen) < timeout,
    avatar: d.avatar || null
  }));
}

export async function findDeviceByNumber(codecNumber) {
  const sql = getSQL();

  const result = await sql`
    SELECT id, codec_number, last_seen, online
    FROM devices
    WHERE codec_number = ${codecNumber}
    LIMIT 1
  `;

  if (result.length > 0) {
    const d = result[0];
    return {
      id: d.id,
      codecNumber: d.codec_number,
      lastSeen: d.last_seen,
      online: d.online
    };
  }
  return null;
}

// Call management
export async function createCall(callerId, callerNumber, targetId) {
  const sql = getSQL();
  const callId = `${callerId}-${targetId}`;
  const createdAt = Date.now();

  // Delete any existing calls between these users first
  await sql`
    DELETE FROM calls
    WHERE (caller_id = ${callerId} AND target_id = ${targetId})
    OR (caller_id = ${targetId} AND target_id = ${callerId})
  `;

  // Create new call
  await sql`
    INSERT INTO calls (id, caller_id, caller_number, target_id, status, created_at)
    VALUES (${callId}, ${callerId}, ${callerNumber}, ${targetId}, 'ringing', ${createdAt})
  `;

  return callId;
}

export async function getIncomingCall(deviceId) {
  const sql = getSQL();
  const now = Date.now();
  const timeout = 60000; // Calls expire after 60 seconds
  const cutoff = now - timeout;

  // Join with devices to get caller's avatar
  const result = await sql`
    SELECT c.id, c.caller_id, c.caller_number, c.status, d.avatar
    FROM calls c
    LEFT JOIN devices d ON c.caller_id = d.id
    WHERE c.target_id = ${deviceId}
    AND c.status = 'ringing'
    AND c.created_at > ${cutoff}
    ORDER BY c.created_at DESC
    LIMIT 1
  `;

  if (result.length > 0) {
    const call = result[0];
    return {
      callId: call.id,
      id: call.caller_id,
      codecNumber: call.caller_number,
      avatar: call.avatar || null
    };
  }
  return null;
}

export async function answerCall(callerId, answererId) {
  const sql = getSQL();
  const callId = `${callerId}-${answererId}`;

  const result = await sql`
    UPDATE calls
    SET status = 'connected'
    WHERE id = ${callId}
    AND status = 'ringing'
    RETURNING id
  `;

  return result.length > 0;
}

export async function declineCall(callerId, answererId) {
  const sql = getSQL();
  const callId = `${callerId}-${answererId}`;

  const result = await sql`
    UPDATE calls
    SET status = 'declined'
    WHERE id = ${callId}
    AND status = 'ringing'
    RETURNING id
  `;

  return result.length > 0;
}

export async function checkCallAccepted(deviceId) {
  const sql = getSQL();
  const now = Date.now();
  const timeout = 60000;
  const cutoff = now - timeout;

  const result = await sql`
    SELECT id, status
    FROM calls
    WHERE caller_id = ${deviceId}
    AND status = 'connected'
    AND created_at > ${cutoff}
    LIMIT 1
  `;

  return result.length > 0;
}

export async function checkCallDeclined(deviceId) {
  const sql = getSQL();
  const now = Date.now();
  const timeout = 60000;
  const cutoff = now - timeout;

  const result = await sql`
    SELECT id, status
    FROM calls
    WHERE caller_id = ${deviceId}
    AND status = 'declined'
    AND created_at > ${cutoff}
    LIMIT 1
  `;

  // If found, delete the declined call so it doesn't keep triggering
  if (result.length > 0) {
    await sql`
      DELETE FROM calls
      WHERE id = ${result[0].id}
    `;
    return true;
  }

  return false;
}

export async function endCallsForDevice(deviceId) {
  const sql = getSQL();

  await sql`
    DELETE FROM calls
    WHERE caller_id = ${deviceId}
    OR target_id = ${deviceId}
  `;
}

// Cleanup old data (can be called periodically)
export async function cleanupOldData() {
  const sql = getSQL();
  const now = Date.now();
  const deviceCutoff = now - 300000;  // 5 minutes
  const callCutoff = now - 120000;    // 2 minutes

  // Mark old devices as offline
  await sql`
    UPDATE devices
    SET online = false
    WHERE last_seen < ${deviceCutoff}
  `;

  // Delete old calls
  await sql`
    DELETE FROM calls
    WHERE created_at < ${callCutoff}
  `;
}

// Audio queue functions - store voice clips in database
export async function queueAudio(targetId, audioData, fromId) {
  const sql = getSQL();
  const createdAt = Date.now();

  await sql`
    INSERT INTO audio_messages (sender_id, target_id, audio_data, created_at, played)
    VALUES (${fromId}, ${targetId}, ${audioData}, ${createdAt}, false)
  `;

  return true;
}

export async function getAudioQueue(deviceId) {
  const sql = getSQL();
  const now = Date.now();
  const cutoff = now - 30000; // Only get audio from last 30 seconds

  // Get unplayed audio messages
  const messages = await sql`
    SELECT id, sender_id, audio_data, created_at
    FROM audio_messages
    WHERE target_id = ${deviceId}
    AND played = false
    AND created_at > ${cutoff}
    ORDER BY created_at ASC
  `;

  if (messages.length > 0) {
    // Mark as played
    const ids = messages.map(m => m.id);
    await sql`
      UPDATE audio_messages
      SET played = true
      WHERE id = ANY(${ids})
    `;

    return messages.map(m => ({
      audioData: m.audio_data,
      fromId: m.sender_id,
      timestamp: m.created_at
    }));
  }

  return [];
}

export default { getSQL };
