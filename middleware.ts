export const config = {
  matcher: '/',
};

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const termId = url.searchParams.get('term');

  // If there's no term ID, just continue to the normal app
  if (!termId) {
    return new Response(null, {
      headers: { 'x-middleware-next': '1' },
    });
  }

  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /bot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discordbot/i.test(userAgent);

  // If it's a bot, we serve the HTML with meta tags directly from the middleware
  if (isBot) {
    try {
      // Fetch term data from Supabase
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables in middleware');
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/terms?id=eq.${termId}&select=*`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      const data = await response.json();
      const term = data[0];

      if (!term) {
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }

      const title = `${term.term} - Vine Lingo`;
      const description = term.definition;
      const ogImageUrl = `https://${url.host}/api/og?term=${termId}`;

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">
</head>
<body style="font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0;">
    <h1>${term.term}</h1>
    <p style="max-width: 600px; text-align: center; line-height: 1.6;">${term.definition}</p>
    <script>window.location.href = "/?term=${termId}";</script>
</body>
</html>`.trim();

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        },
      });
    } catch (error) {
      console.error('Middleware error:', error);
      return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }
  }

  // For real users, just serve the normal app
  return new Response(null, {
    headers: { 'x-middleware-next': '1' },
  });
}
