import { NextRequest, NextResponse } from 'next/server';
import { getSpotifyClient } from '@/lib/spotify/client';

interface ImageRequest {
  artists?: string[];
  tracks?: Array<{ name: string; artist: string }>;
}

interface ImageResponse {
  artistImages: { [artistName: string]: { imageUrl: string; spotifyUrl: string } };
  trackImages: { [trackKey: string]: { albumArtUrl: string; spotifyUrl: string } };
  artistCountries: { [artistName: string]: { country: string; iso: string } };
}

// ISO 3166-1 alpha-2 to numeric mapping
const ISO_ALPHA_TO_NUMERIC: { [key: string]: string } = {
  'US': '840', 'PR': '630', 'CO': '170', 'MX': '484', 'AR': '032',
  'ES': '724', 'DO': '214', 'PA': '591', 'JM': '388', 'CA': '124',
  'BR': '076', 'CL': '152', 'PE': '604', 'VE': '862', 'FR': '250',
  'DE': '276', 'IT': '380', 'JP': '392', 'KR': '410', 'AU': '036',
  'NZ': '554', 'SE': '752', 'NO': '578', 'NL': '528', 'BE': '056',
  'IE': '372', 'CH': '756', 'AT': '040', 'PT': '620', 'GR': '300',
  'TR': '792', 'RU': '643', 'PL': '616', 'IN': '356', 'CN': '156',
  'ZA': '710', 'NG': '566', 'EG': '818', 'KE': '404', 'GB': '826',
  'CU': '192', 'UY': '858', 'PY': '600', 'BO': '068', 'EC': '218',
  'GT': '320', 'HN': '340', 'SV': '222', 'NI': '558', 'CR': '188',
};

// Country name variations to ISO alpha-2
const COUNTRY_NAME_TO_ALPHA: { [key: string]: string } = {
  'puerto rico': 'PR',
  'united states': 'US',
  'colombia': 'CO',
  'mexico': 'MX',
  'argentina': 'AR',
  'spain': 'ES',
  'dominican republic': 'DO',
  'panama': 'PA',
  'jamaica': 'JM',
  'canada': 'CA',
  'brazil': 'BR',
  'chile': 'CL',
  'peru': 'PE',
  'venezuela': 'VE',
  'france': 'FR',
  'germany': 'DE',
  'italy': 'IT',
  'japan': 'JP',
  'south korea': 'KR',
  'korea': 'KR',
  'australia': 'AU',
  'new zealand': 'NZ',
  'sweden': 'SE',
  'norway': 'NO',
  'netherlands': 'NL',
  'belgium': 'BE',
  'ireland': 'IE',
  'switzerland': 'CH',
  'austria': 'AT',
  'portugal': 'PT',
  'greece': 'GR',
  'turkey': 'TR',
  'russia': 'RU',
  'poland': 'PL',
  'india': 'IN',
  'china': 'CN',
  'south africa': 'ZA',
  'nigeria': 'NG',
  'egypt': 'EG',
  'kenya': 'KE',
  'united kingdom': 'GB',
  'uk': 'GB',
  'cuba': 'CU',
  'uruguay': 'UY',
  'paraguay': 'PY',
  'bolivia': 'BO',
  'ecuador': 'EC',
  'guatemala': 'GT',
  'honduras': 'HN',
  'el salvador': 'SV',
  'nicaragua': 'NI',
  'costa rica': 'CR',
};

function getCountryFromArtistName(artistName: string): { country: string; iso: string } | null {
  const lower = artistName.toLowerCase();
  
  // Puerto Rican artists (most important for your data)
  const prArtists = ['bad bunny', 'daddy yankee', 'rauw alejandro', 'ozuna', 'anuel aa', 
                     'farruko', 'myke towers', 'jhay cortez', 'nio garcia', 'lyanno',
                     'lunay', 'bryant myers', 'arcangel', 'de la ghetto', 'plan b'];
  if (prArtists.some(a => lower.includes(a))) {
    return { country: 'Puerto Rico', iso: '630' };
  }
  
  // Colombian artists
  const coArtists = ['j balvin', 'karol g', 'maluma', 'feid', 'sebastián yatra',
                     'manuel turizo', 'ryan castro', 'kaliii'];
  if (coArtists.some(a => lower.includes(a))) {
    return { country: 'Colombia', iso: '170' };
  }
  
  // Dominican artists
  const doArtists = ['tokischa', 'el alfa', 'mozart la para', 'chimbala'];
  if (doArtists.some(a => lower.includes(a))) {
    return { country: 'Dominican Republic', iso: '214' };
  }
  
  // Argentine artists
  const arArtists = ['young miko', 'nicki nicole', 'bizarrap', 'maria becerra', 'tini'];
  if (arArtists.some(a => lower.includes(a))) {
    return { country: 'Argentina', iso: '032' };
  }
  
  // Mexican artists
  const mxArtists = ['becky g', 'peso pluma', 'natanael cano', 'carin leon', 'christian nodal'];
  if (mxArtists.some(a => lower.includes(a))) {
    return { country: 'Mexico', iso: '484' };
  }
  
  // US artists
  const usArtists = ['marc anthony', 'coi leray', 'eminem', 'beyoncé', 'drake',
                     'imdontai', 'cordae', 'snow tha product', 'crypt', 'jason mraz'];
  if (usArtists.some(a => lower.includes(a))) {
    return { country: 'United States', iso: '840' };
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageRequest = await request.json();
    const { artists = [], tracks = [] } = body;
    
    const client = getSpotifyClient();
    const token = await client.getAccessToken();
    
    const artistImages: { [artistName: string]: { imageUrl: string; spotifyUrl: string } } = {};
    const trackImages: { [trackKey: string]: { albumArtUrl: string; spotifyUrl: string } } = {};
    const artistCountries: { [artistName: string]: { country: string; iso: string } } = {};
    
    // Search for artists and get their images + country data
    for (const artistName of artists) {
      try {
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (searchResponse.ok) {
          const data = await searchResponse.json();
          if (data.artists?.items?.[0]) {
            const artist = data.artists.items[0];
            
            // Store image data
            artistImages[artistName] = {
              imageUrl: artist.images?.[0]?.url || '',
              spotifyUrl: artist.external_urls?.spotify || '',
            };
            
            // Try to get country from Spotify (not reliable) or fallback to our mapping
            let countryData = getCountryFromArtistName(artistName);
            
            // If still no country, default to US (safest assumption for most artists)
            if (!countryData) {
              countryData = { country: 'United States', iso: '840' };
            }
            
            artistCountries[artistName] = countryData;
          }
        }
      } catch (error) {
        console.error(`Failed to fetch artist ${artistName}:`, error);
      }
    }
    
    // Search for tracks and get their album art
    for (const track of tracks) {
      try {
        const query = `track:${track.name} artist:${track.artist}`;
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        
        if (searchResponse.ok) {
          const data = await searchResponse.json();
          if (data.tracks?.items?.[0]) {
            const trackData = data.tracks.items[0];
            const trackKey = `${track.name}|||${track.artist}`;
            trackImages[trackKey] = {
              albumArtUrl: trackData.album?.images?.[0]?.url || '',
              spotifyUrl: trackData.external_urls?.spotify || '',
            };
          }
        }
      } catch (error) {
        console.error(`Failed to fetch track ${track.name}:`, error);
      }
    }
    
    const response: ImageResponse = {
      artistImages,
      trackImages,
      artistCountries,
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Image fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images from Spotify' },
      { status: 500 }
    );
  }
}
