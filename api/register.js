import { registerDevice } from './lib/store.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId, codecNumber } = req.body;

    if (!deviceId || !codecNumber) {
      return res.status(400).json({ error: 'Missing deviceId or codecNumber' });
    }

    // Register the device
    await registerDevice(deviceId, codecNumber);

    res.status(200).json({
      success: true,
      deviceId,
      codecNumber,
      message: 'Device registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
