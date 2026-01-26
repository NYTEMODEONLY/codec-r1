// Handle audio transmission between devices
// Audio is sent as base64 and stored in database

import { queueAudio } from './lib/store.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Allow up to 4MB for audio clips
    },
  },
};

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
    const { senderId, targetId, audioData } = req.body;

    if (!senderId || !targetId || !audioData) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['senderId', 'targetId', 'audioData']
      });
    }

    // Store audio in database
    await queueAudio(targetId, audioData, senderId);

    res.status(200).json({
      success: true,
      message: 'Audio sent'
    });

  } catch (error) {
    console.error('Audio error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
