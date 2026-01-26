import { endCallsForDevice } from './lib/store.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' });
    }

    // End all calls for this device
    await endCallsForDevice(deviceId);

    res.status(200).json({
      success: true,
      message: 'Call ended',
      deviceId
    });

  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
