// Avatar management endpoint
import { neon } from '@neondatabase/serverless';

function getSQL() {
  return neon(process.env.DATABASE_URL);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb', // Allow up to 2MB for avatar images
    },
  },
};

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
      // Save avatar for a device
      const { deviceId, avatarData } = req.body;

      if (!deviceId || !avatarData) {
        return res.status(400).json({ error: 'Missing deviceId or avatarData' });
      }

      // Update device with avatar
      await sql`
        UPDATE devices
        SET avatar = ${avatarData}
        WHERE id = ${deviceId}
      `;

      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      // Get avatar for a device
      const { deviceId } = req.query;

      if (!deviceId) {
        return res.status(400).json({ error: 'Missing deviceId' });
      }

      const result = await sql`
        SELECT avatar FROM devices WHERE id = ${deviceId}
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }

      return res.status(200).json({
        success: true,
        avatar: result[0].avatar || null
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Avatar error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
