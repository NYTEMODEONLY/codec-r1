// Database initialization endpoint - run once to create tables
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Create devices table
    await sql`
      CREATE TABLE IF NOT EXISTS devices (
        id VARCHAR(64) PRIMARY KEY,
        codec_number VARCHAR(10) NOT NULL,
        last_seen BIGINT NOT NULL,
        online BOOLEAN DEFAULT true,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add avatar column if it doesn't exist (for existing tables)
    await sql`
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS avatar TEXT
    `;

    // Create calls table
    await sql`
      CREATE TABLE IF NOT EXISTS calls (
        id VARCHAR(128) PRIMARY KEY,
        caller_id VARCHAR(64) NOT NULL,
        caller_number VARCHAR(10),
        target_id VARCHAR(64) NOT NULL,
        status VARCHAR(20) DEFAULT 'ringing',
        created_at BIGINT NOT NULL
      )
    `;

    // Create index on codec_number for lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_codec_number ON devices(codec_number)
    `;

    // Create index on target_id for incoming call lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_target_id ON calls(target_id)
    `;

    // Create audio_messages table for walkie-talkie voice clips
    await sql`
      CREATE TABLE IF NOT EXISTS audio_messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(64) NOT NULL,
        target_id VARCHAR(64) NOT NULL,
        audio_data TEXT NOT NULL,
        created_at BIGINT NOT NULL,
        played BOOLEAN DEFAULT false
      )
    `;

    // Create index on target_id for audio retrieval
    await sql`
      CREATE INDEX IF NOT EXISTS idx_audio_target ON audio_messages(target_id)
    `;

    // Create signaling table for WebRTC
    await sql`
      CREATE TABLE IF NOT EXISTS signaling (
        id SERIAL PRIMARY KEY,
        from_id VARCHAR(64) NOT NULL,
        to_id VARCHAR(64) NOT NULL,
        type VARCHAR(20) NOT NULL,
        data TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_signal_to ON signaling(to_id)
    `;

    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['devices', 'calls', 'audio_messages', 'signaling']
    });

  } catch (error) {
    console.error('Database init error:', error);
    res.status(500).json({ error: 'Database initialization failed', details: error.message });
  }
}
