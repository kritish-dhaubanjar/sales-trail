import './globals.css';
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
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
