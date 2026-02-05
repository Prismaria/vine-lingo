import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const termId = searchParams.get('term');

  if (!termId) {
    return new Response('Missing term ID', { status: 400 });
  }

  // Fetch term data from Supabase
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/terms?id=eq.${termId}&select=*`,
    {
      headers: {
        apikey: supabaseKey!,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  const data = await response.json();
  const term = data[0];

  if (!term) {
    // If term not found, just return generic HTML
    return new Response(
      `<html><head><title>Vine Lingo</title></head><body>Redirecting...</body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const title = `${term.term} - Vine Lingo`;
  const description = term.definition;
  const ogImageUrl = `https://${req.headers.get('host')}/api/og?term=${termId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Dynamic Meta Tags for Bots -->
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">

    <!-- Redirect for real users just in case -->
    <meta http-equiv="refresh" content="0; url=/?term=${termId}">
</head>
<body>
    <h1>${term.term}</h1>
    <p>${term.definition}</p>
    <script>window.location.href = "/?term=${termId}";</script>
</body>
</html>
  `.trim();

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
