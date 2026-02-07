import type { Metadata } from 'next';
import { ListeningDataProvider } from '@/context/ListeningDataContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Spotify Listening Analytics',
  description: 'Discover your unique listening identity through behavioral analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ListeningDataProvider>
          {children}
        </ListeningDataProvider>
      </body>
    </html>
  );
}
