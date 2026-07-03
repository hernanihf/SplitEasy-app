import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// Site-wide fallback for SEO/social previews — used as-is by crawlers that
// don't run JS (WhatsApp, Facebook, Twitter) and by any route that doesn't
// override it with <ScreenMeta> (see src/components/screen-meta.tsx).
const SITE_URL = 'https://spliteasy-app.onrender.com';
const DEFAULT_TITLE = 'SplitEasy — Split bills, not friendships';
const DEFAULT_DESCRIPTION =
  'Add an expense, split it with your group, and keep everyone square. Done.';
const OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * Customizes the root HTML for the web build (static export). This file only
 * runs in Node during static rendering and has no effect on native.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        <title>{DEFAULT_TITLE}</title>
        <meta name="description" content={DEFAULT_DESCRIPTION} />

        {/* Open Graph — link previews on WhatsApp, Facebook, iMessage, etc. */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SplitEasy" />
        <meta property="og:title" content={DEFAULT_TITLE} />
        <meta property="og:description" content={DEFAULT_DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:url" content={SITE_URL} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={DEFAULT_TITLE} />
        <meta name="twitter:description" content={DEFAULT_DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0E7C5A" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS standalone */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SplitEasy" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Register the service worker so the app is installable / works offline. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `,
          }}
        />

        {/* Match native: drop the browser's focus outline on inputs (the app
            draws its own field styling). Otherwise focused inputs show a white
            rectangle in the standalone PWA. */}
        <style
          dangerouslySetInnerHTML={{
            __html: 'input, textarea { outline: none; }',
          }}
        />

        {/*
          Disable body scrolling on web to match the native ScrollView behavior.
          Remove if you want to allow the body to scroll.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
