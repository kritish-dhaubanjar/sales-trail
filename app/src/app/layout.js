import PropTypes from 'prop-types';
import './globals.css';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import QueryClientProvider from '@/components/provider/QueryClientProvider';
import { ThemeProvider } from '@/components/provider/ThemeProvider';

export const metadata = {
  title: 'Sales-Trail',
  description: 'Sales-Trail',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
      </head>
      <body className="antialiased">
        <ThemeProvider defaultTheme="light" storageKey="sales-trail-theme">
          <QueryClientProvider>{children}</QueryClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

RootLayout.propTypes = {
  children: PropTypes.any,
};
