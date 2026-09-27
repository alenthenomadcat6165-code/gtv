import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://grand-theft-vehicles.dingus-uia.chatgpt.site'),
  title: 'Grand Theft Vehicles — Open World Driving',
  description: 'Pick a car and drive, drift, jump and explore a neon open city right in your browser.',
  openGraph: {
    title: 'Grand Theft Vehicles — Open World Driving',
    description: 'No missions. No limits. Pick a ride and make the city your playground.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grand Theft Vehicles — Open World Driving',
    description: 'No missions. No limits. Pick a ride and make the city your playground.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
