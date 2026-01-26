import { createCall, registerDevice } from './lib/store.js';

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
    const { callerId, callerNumber, targetId } = req.body;

    if (!callerId || !targetId) {
      return res.status(400).json({ error: 'Missing callerId or targetId' });
    }

    // Ensure caller is registered (handles cold start)
    if (callerNumber) {
      await registerDevice(callerId, callerNumber);
    }

    // Create the call
    const callId = await createCall(callerId, callerNumber, targetId);

    res.status(200).json({
      success: true,
      message: 'Call initiated',
      callId,
      callerId,
      targetId
    });

  } catch (error) {
    console.error('Call error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
