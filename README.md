# CODEC - Metal Gear Style Walkie-Talkie for rabbit r1

A real-time voice communication app inspired by the iconic CODEC system from Metal Gear Solid, built specifically for the [rabbit r1](https://www.rabbit.tech/) device.

![CODEC Screenshot](https://img.shields.io/badge/Platform-rabbit%20r1-00ff41?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

## Features

- **Real-time Voice Chat** - WebRTC-powered live audio streaming between devices
- **Unique CODEC Frequencies** - Each device gets a permanent unique identifier (####.##)
- **Metal Gear Aesthetic** - Authentic green CRT scanline effect with pixel-perfect 240x282 display
- **Avatar Support** - Snap a photo with the r1 camera to set your profile picture
- **Iconic Sound Effects** - Classic Metal Gear codec call sounds
- **Push-to-Talk** - Hold to transmit, release to listen
- **Connection List** - See all online CODEC users in real-time

## How It Works

1. **Install on r1** - Scan the QR code at `/qr` to install as a creation
2. **Get Your Frequency** - First launch assigns you a permanent CODEC number
3. **Find Contacts** - Online users appear in your connection list
4. **Make Calls** - Tap a contact to initiate a call
5. **Talk** - Hold the "HOLD TO TALK" button to transmit

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (optimized for r1's 240x282 screen)
- **Backend**: Vercel Serverless Functions
- **Database**: Neon PostgreSQL (serverless)
- **Real-time Audio**: WebRTC with polling-based signaling
- **Styling**: CSS with CRT scanline effects and Metal Gear green palette

## Project Structure

```
codec-app/
├── public/
│   ├── index.html        # Main app (all frontend code)
│   ├── qr.html           # QR code installation page
│   └── metalgearcodec.mp3 # Ring sound effect
├── api/
│   ├── init-db.js        # Database initialization
│   ├── register.js       # Device registration
│   ├── status.js         # Polling endpoint (connections, calls)
│   ├── call.js           # Initiate calls
│   ├── answer.js         # Answer/decline calls
│   ├── endcall.js        # End active calls
│   ├── signal.js         # WebRTC signaling exchange
│   ├── avatar.js         # Avatar upload/retrieval
│   ├── lookup.js         # Find device by CODEC number
│   ├── audio.js          # Legacy audio endpoint
│   └── lib/
│       └── store.js      # Database operations
├── vercel.json           # Vercel routing configuration
└── package.json          # Dependencies
```

## Database Schema

```sql
-- Devices (users)
devices (
  id VARCHAR(64) PRIMARY KEY,
  codec_number VARCHAR(10),
  last_seen BIGINT,
  online BOOLEAN,
  avatar TEXT,
  created_at TIMESTAMP
)

-- Active calls
calls (
  id VARCHAR(128) PRIMARY KEY,
  caller_id VARCHAR(64),
  caller_number VARCHAR(10),
  target_id VARCHAR(64),
  status VARCHAR(20),  -- 'ringing', 'connected', 'declined'
  created_at BIGINT
)

-- WebRTC signaling
signaling (
  id SERIAL PRIMARY KEY,
  from_id VARCHAR(64),
  to_id VARCHAR(64),
  type VARCHAR(20),    -- 'offer', 'answer', 'ice-candidate', 'call-ended'
  data TEXT,
  created_at BIGINT
)
```

## Deployment

### Prerequisites

- [Vercel CLI](https://vercel.com/cli)
- [Neon PostgreSQL](https://neon.tech/) account

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/NYTEMODEONLY/codec-r1.git
   cd codec-r1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a Neon database**
   - Sign up at [neon.tech](https://neon.tech/)
   - Create a new project
   - Copy the connection string

4. **Configure Vercel**
   ```bash
   vercel link
   vercel env add DATABASE_URL
   # Paste your Neon connection string
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

6. **Initialize the database**
   ```bash
   curl https://your-deployment.vercel.app/api/init-db
   ```

## Installing on rabbit r1

1. Visit `https://your-deployment.vercel.app/qr` on any device
2. Scan the QR code with your rabbit r1
3. The CODEC creation will be installed

## r1 Hardware Integration

The app responds to rabbit r1 hardware events:

| Input | Action |
|-------|--------|
| Scroll Up/Down | Navigate connection list |
| Side Click | Select contact / Answer call |
| Long Press | Push-to-talk (transmit) |

## Color Palette

```css
--codec-dark: #0a0f0a;
--codec-darker: #050805;
--codec-green: #00ff41;
--codec-green-dim: #00aa2a;
--codec-green-glow: #3bcb86;
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/register` | POST | Register a device |
| `/api/status` | GET | Poll for connections, calls, signals |
| `/api/call` | POST | Initiate a call |
| `/api/answer` | POST | Answer or decline a call |
| `/api/endcall` | POST | End an active call |
| `/api/signal` | GET/POST | WebRTC signaling exchange |
| `/api/avatar` | GET/POST | Get/set user avatar |
| `/api/lookup` | GET | Find device by CODEC number |
| `/api/init-db` | GET/POST | Initialize database tables |

## Browser Compatibility

- Optimized for rabbit r1's embedded browser
- Also works on desktop Chrome/Firefox/Safari for testing
- Requires WebRTC and getUserMedia support

## Known Limitations

- r1's hardware PTT button may trigger the system assistant (use on-screen button instead)
- Audio requires user interaction to unlock (browser autoplay policy)
- Polling-based signaling (Vercel doesn't support WebSockets)

## Credits

- **Built by**: [NYTEMODE](https://github.com/NYTEMODEONLY)
- **Inspired by**: Metal Gear Solid (Konami)
- **Platform**: [rabbit r1](https://www.rabbit.tech/)

## License

MIT License - feel free to modify and distribute.

---

*"This is Snake. Do you read me?"*
