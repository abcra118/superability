import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Metro Guide — Calm Transit',
  description: 'A step-by-step Melbourne train journey planner for a calmer travel experience.',
  keywords: ['Melbourne', 'train', 'journey planner', 'PTV', 'metro'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
