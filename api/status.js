import {
  updateDeviceStatus,
  getOnlineDevices,
  getIncomingCall,
  checkCallAccepted,
  checkCallDeclined,
  getAudioQueue,
  registerDevice
} from './lib/store.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { deviceId, codecNumber } = req.query;

    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' });
    }

    // Update last seen / heartbeat
    await updateDeviceStatus(deviceId);

    // Also register if codecNumber provided (handles cold start)
    if (codecNumber) {
      await registerDevice(deviceId, codecNumber);
    }

    // Get list of online devices
    const connections = await getOnlineDevices(deviceId);

    // Check for incoming calls
    const incomingCall = await getIncomingCall(deviceId);

    // Check if our outgoing call was accepted
    const callAccepted = await checkCallAccepted(deviceId);

    // Check if our outgoing call was declined
    const callDeclined = await checkCallDeclined(deviceId);

    // Get any pending audio
    const audioQueue = await getAudioQueue(deviceId);

    res.status(200).json({
      success: true,
      connections,
      incomingCall,
      callAccepted,
      callDeclined,
      audioQueue
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
