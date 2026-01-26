// WebRTC signaling endpoint for exchanging SDP offers/answers and ICE candidates
import { neon } from '@neondatabase/serverless';

function getSQL() {
  return neon(process.env.DATABASE_URL);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = getSQL();

  try {
    if (req.method === 'POST') {
      // Store signaling data (offer, answer, or ICE candidate)
      const { fromId, toId, type, data } = req.body;

      if (!fromId || !toId || !type || !data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const createdAt = Date.now();

      await sql`
        INSERT INTO signaling (from_id, to_id, type, data, created_at)
        VALUES (${fromId}, ${toId}, ${type}, ${JSON.stringify(data)}, ${createdAt})
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      // Get pending signaling data for a device
      const { deviceId } = req.query;

      if (!deviceId) {
        return res.status(400).json({ error: 'Missing deviceId' });
      }

      const cutoff = Date.now() - 30000; // Only get signals from last 30 seconds

      const signals = await sql`
        SELECT id, from_id, type, data, created_at
        FROM signaling
        WHERE to_id = ${deviceId}
        AND created_at > ${cutoff}
        ORDER BY created_at ASC
      `;

      // Delete retrieved signals
      if (signals.length > 0) {
        const ids = signals.map(s => s.id);
        await sql`
          DELETE FROM signaling
          WHERE id = ANY(${ids})
        `;
      }

      return res.status(200).json({
        success: true,
        signals: signals.map(s => ({
          fromId: s.from_id,
          type: s.type,
          data: typeof s.data === 'string' ? JSON.parse(s.data) : s.data
        }))
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Signaling error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
