# Spotify Listening Analytics

A Next.js application that analyzes your Spotify listening history to discover your unique listening identity through behavioral analysis.

## Features

- **Upload & Parse** Spotify streaming history JSON files
- **Behavioral Analysis**
  - Active vs passive listening detection
  - Repeat patterns and obsessive listening
  - Artist loyalty vs exploration
  - Genre diversity and evolution
- **Listener Archetypes**
  - Comfort Listener
  - Musical Explorer
  - Genre Hopper
  - Loyal Fan
  - Obsessive Repeater
  - Background Player
  - Active Curator
- **Rich Visualizations**
  - Genre distribution charts
  - Top artists and tracks
  - Listening patterns
  - Time-based analysis
- **Warm, Cozy Design**
  - Dark mode with sunset color palette
  - Amatic SC headers for friendly feel
  - Smooth animations and transitions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Spotify Developer account (optional, for genre enrichment)

### Installation

1. Clone the repository:
```bash
cd spotify-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (optional, for Spotify API):
```bash
cp .env.local.example .env.local
```

4. Add your Spotify credentials to `.env.local`:
- Go to https://developer.spotify.com/dashboard
- Create a new app
- Copy Client ID and Client Secret

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting Your Spotify Data

1. Go to [Spotify Privacy Settings](https://www.spotify.com/account/privacy/)
2. Scroll down to "Download your data"
3. Request "Extended streaming history"
4. Wait for Spotify to email you (usually takes 2-30 days)
5. Download the ZIP file
6. Extract and upload the JSON file(s) to this app

## How It Works

### Data Pipeline

1. **Parse** - Reads and validates Spotify JSON format
2. **Clean** - Filters out short plays, removes duplicates
3. **Enrich** - (Optional) Fetches genre data from Spotify API
4. **Analyze** - Calculates behavioral metrics
5. **Classify** - Determines listener archetype
6. **Visualize** - Displays insights and charts

### Key Metrics

- **Active Score**: How intentionally you listen (completion rate, skip behavior)
- **Repeat Rate**: Percentage of repeated tracks
- **Artist Loyalty**: Concentration of listens among top artists
- **Genre Diversity**: Shannon entropy of genre distribution
- **Exploration Score**: Inverse of Gini coefficient

### Architecture

```
spotify-analytics/
├── app/                    # Next.js pages
│   ├── page.tsx           # Upload page
│   ├── overview/          # Dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── upload/           # File uploader
│   ├── charts/           # Visualization components
│   └── insights/         # Metric displays
├── context/              # React context
├── hooks/                # Custom React hooks
├── lib/                  # Core logic
│   ├── analytics/       # Metrics & classification
│   ├── data/            # Parsing & cleaning
│   └── spotify/         # API client
├── styles/              # CSS styles
└── types/               # TypeScript definitions
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules
- **Charts**: Recharts
- **State**: React Context + Custom Hooks
- **API**: Spotify Web API

## Configuration

All configuration is centralized in `lib/config.ts`:

- Cleaning thresholds (min play duration, session gaps)
- Active listening thresholds
- Archetype definitions
- Genre normalization
- Color palette

## Customization

### Adding New Archetypes

Edit `lib/config.ts` to add new listener types:

```typescript
ARCHETYPES: {
  YOUR_ARCHETYPE: {
    name: 'Your Name',
    traits: ['Trait 1', 'Trait 2'],
    description: 'Description here',
  },
}
```

Then add scoring logic in `lib/analytics/classifier.ts`.

### Changing Theme Colors

Edit CSS variables in `styles/globals.css`:

```css
:root {
  --color-primary: #FF6B9D;
  --color-secondary: #C56CD6;
  /* ... */
}
```

## Performance

- Handles 50,000+ listening events
- Client-side processing with progress indicators
- Batched API requests (50 tracks at a time)
- Memoized calculations
- Efficient data structures (Maps, Sets)

## Privacy

- All processing happens locally in your browser
- No data is sent to external servers (except Spotify API for genres)
- No tracking or analytics
- Your listening data stays with you

## Limitations

- Requires extended streaming history (not available immediately)
- Genre data requires Spotify API credentials
- Some events may have incomplete metadata
- Archived streams have limited information

## Troubleshooting

### "Invalid JSON file" error
- Make sure you're uploading the extended streaming history file
- Check that it's a valid JSON file (not HTML or error message)

### Slow processing
- Large files (>50k events) may take a minute to process
- Spotify API enrichment is intentionally rate-limited

### Missing genres
- Add Spotify API credentials to `.env.local`
- Some artists may not have genre tags

## Future Enhancements

- [ ] Export shareable insights
- [ ] Compare multiple time periods
- [ ] Friend comparison mode
- [ ] Playlist generation
- [ ] Machine learning predictions
- [ ] Time-of-day heatmaps
- [ ] Mood-based analysis

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT

## Acknowledgments

- Spotify for the amazing API and data export feature
- The Next.js team for the excellent framework
- Recharts for beautiful visualizations
