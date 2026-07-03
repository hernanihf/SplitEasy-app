import Head from 'expo-router/head';

type Props = {
  title: string;
  description?: string;
};

// Overrides the browser tab title (and, for routes worth sharing — like
// invite links — the description/Open Graph preview) for the current
// screen. Baked into that route's static HTML at export time and updated
// live on client navigation. Falls back to the site-wide defaults in
// +html.tsx when no description is given.
export function ScreenMeta({ title, description }: Props) {
  const fullTitle = `SplitEasy — ${title}`;
  return (
    <Head>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {description && <meta property="og:title" content={fullTitle} />}
      {description && <meta property="og:description" content={description} />}
      {description && <meta name="twitter:title" content={fullTitle} />}
      {description && <meta name="twitter:description" content={description} />}
    </Head>
  );
}
