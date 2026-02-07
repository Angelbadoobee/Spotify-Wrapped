# Changelog - Multi-File Upload & Genre Fallback

## Changes Made

### 1. Multi-File Upload (Up to 10 Files)
- ✅ Updated `FileUploader.tsx` to accept multiple JSON files
- ✅ Added file selection UI showing all selected files
- ✅ Added remove button for each selected file
- ✅ Files are merged and sorted by timestamp before processing
- ✅ Maximum 10 files can be uploaded at once
- ✅ All files are processed together as one continuous listening history

### 2. Genre Landscape Fix
- ✅ Added fallback genre detection when Spotify API is not configured
- ✅ Detects genres based on artist name patterns:
  - Latin/Reggaeton artists → "Latin" genre
  - Classic soul/R&B artists → "Soul" genre  
  - Unknown artists → "Various" genre
- ✅ Added empty state handling in GenreBarChart
- ✅ Shows helpful message when no genre data is available
- ✅ Genre distribution now works even without Spotify API credentials

### 3. UI Improvements
- ✅ Selected files list with remove functionality
- ✅ File count display
- ✅ Better upload instructions mentioning multiple files
- ✅ Empty state for genre chart with explanation

## How to Use Multi-File Upload

1. Click "Choose Files" or drag & drop multiple JSON files
2. You'll see a list of all selected files
3. Remove any files you don't want by clicking the × button
4. Click "Analyze X Files" to process all files together
5. The app will merge all listening events and sort them chronologically

## Genre Detection

**With Spotify API** (recommended):
- Get accurate genres from Spotify's database
- More detailed genre classification
- Better genre diversity metrics

**Without Spotify API** (fallback):
- Basic genre detection based on artist names
- Works immediately without configuration
- Limited to broad categories (Latin, Soul, Various, etc.)
- Still provides genre distribution visualization

## Next Steps

To get full genre data, configure Spotify API:
1. Create a Spotify app at https://developer.spotify.com/dashboard
2. Copy your Client ID and Client Secret
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
4. Restart the dev server
