import { answerCall, declineCall } from './lib/store.js';

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
    const { callerId, answererId, declined } = req.body;

    if (!callerId || !answererId) {
      return res.status(400).json({ error: 'Missing callerId or answererId' });
    }

    let success;
    if (declined) {
      // Decline the call
      success = await declineCall(callerId, answererId);
      res.status(200).json({
        success,
        message: success ? 'Call declined' : 'Call not found',
        callerId,
        answererId
      });
    } else {
      // Answer the call
      success = await answerCall(callerId, answererId);
      res.status(200).json({
        success,
        message: success ? 'Call answered' : 'Call not found',
        callerId,
        answererId
      });
    }

  } catch (error) {
    console.error('Answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
