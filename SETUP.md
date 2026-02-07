# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd spotify-analytics
npm install
```

### 2. Configure Spotify API (Optional but Recommended)

**Get Credentials:**
1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create app"
4. Fill in:
   - App name: "My Listening Analytics"
   - App description: "Personal listening analysis"
   - Redirect URI: http://localhost:3000
5. Accept terms and click "Create"
6. Click "Settings" and copy your Client ID and Client Secret

**Add to Project:**
1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
   SPOTIFY_CLIENT_SECRET=your_client_secret_here
   ```

### 3. Run the App
```bash
npm run dev
```

Open http://localhost:3000

### 4. Get Your Spotify Data

**Request Data:**
1. Visit https://www.spotify.com/account/privacy/
2. Scroll to "Download your data"
3. Request "Extended streaming history" (NOT "Account data")
4. Wait for email (2-30 days)

**Note:** While waiting, you can test with the sample data provided or create a test JSON file.

## 📁 Project Structure

```
spotify-analytics/
├── app/                   # Pages
│   ├── page.tsx          # Upload page
│   ├── overview/         # Dashboard
│   └── api/              # API endpoints
├── components/           # UI components
├── lib/                  # Core logic
├── context/              # State management
├── hooks/                # Custom hooks
└── styles/               # CSS
```

## 🎨 Key Features You Built

✅ File upload with drag & drop
✅ JSON parsing and validation
✅ Data cleaning (filters short plays, duplicates)
✅ Spotify API integration for genres
✅ Behavioral metrics calculation
✅ Listener archetype classification
✅ Beautiful visualizations
✅ Warm, cozy dark theme

## 🔧 Customization

### Change Colors
Edit `styles/globals.css`:
```css
:root {
  --color-primary: #FF6B9D;    /* Pink */
  --color-secondary: #C56CD6;  /* Purple */
  --color-accent: #FFA500;     /* Orange */
}
```

### Adjust Analysis Thresholds
Edit `lib/config.ts`:
```typescript
MIN_PLAY_DURATION_MS: 30000,  // 30 seconds
SESSION_GAP_MS: 30 * 60 * 1000,  // 30 minutes
```

## 🐛 Troubleshooting

**App won't start:**
- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again

**"Invalid JSON" error:**
- Make sure you're uploading the Spotify extended streaming history file
- File should be named something like `Streaming_History_Audio_2023-2024_0.json`

**No genres showing:**
- Add Spotify API credentials to `.env.local`
- Restart the dev server after adding credentials

**Slow processing:**
- Normal for large files (50k+ events)
- Processing happens in batches with progress indicators

## 📊 Understanding Your Results

### Listener Archetypes
- **Comfort Listener**: Loves familiar favorites
- **Explorer**: Always discovering new music
- **Genre Hopper**: Eclectic taste across genres
- **Loyal Fan**: Deep dives into favorite artists
- **Obsessive Repeater**: Plays favorites on repeat
- **Passive Listener**: Background music while doing other things
- **Active Curator**: Intentional, curated listening

### Key Metrics
- **Active Score**: 0-100% how intentionally you listen
- **Repeat Rate**: Percentage of tracks played more than once
- **Artist Loyalty**: How concentrated your listens are
- **Genre Diversity**: Shannon entropy (higher = more diverse)

## 🚢 Deployment

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Follow prompts to deploy. Don't forget to add environment variables in Vercel dashboard!

### Deploy to Other Platforms
- Works on any platform that supports Next.js
- Remember to set environment variables
- Build command: `npm run build`
- Start command: `npm start`

## 📚 Next Steps

1. **Test with your data** once you receive it from Spotify
2. **Customize the archetypes** to match your preferences
3. **Add new visualizations** in the components/charts folder
4. **Share your insights** (the app is privacy-first)

## 💡 Ideas for Enhancement

- Export insights as images
- Compare different time periods
- Mood-based analysis
- Time-of-day heatmaps
- Playlist recommendations
- Friend comparisons

Enjoy exploring your listening identity! 🎵
