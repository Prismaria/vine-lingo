export const config = {
  // Match all paths except for static assets
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const termId = url.searchParams.get('term');

  // We only care about requests with a term ID
  if (!termId) {
    return new Response(null, {
      headers: { 'x-middleware-next': '1' },
    });
  }

  // FORCE the bot detection to true for a specific debug parameter
  // This helps you test if the HTML generation is working in your own browser
  const isDebug = url.searchParams.get('debug') === '1';

  const userAgent = req.headers.get('user-agent') || '';
  // Expanded bot list including common preview fetchers
  const isBot = isDebug || /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discordbot|slackbot|applebot|bingbot|yandex|baiduspider|duckduckbot/i.test(userAgent);

  // If it's a bot, we serve the HTML with meta tags
  if (isBot) {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
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
      // Use absolute URL for the image
      const ogImageUrl = `https://${url.host}/api/og?term=${termId}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${url.toString()}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${url.toString()}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">
    
    <!-- Fallback for simple parsers -->
    <meta itemprop="name" content="${title}">
    <meta itemprop="description" content="${description}">
    <meta itemprop="image" content="${ogImageUrl}">
</head>
<body style="font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
    <h1 style="font-size: 3rem; margin-bottom: 1rem;">${term.term}</h1>
    <p style="font-size: 1.5rem; max-width: 800px; line-height: 1.6; color: #cbd5e1;">${term.definition}</p>
    <!-- We delay the redirect slightly for bots that execute JS -->
    <script>
      setTimeout(function() {
        window.location.href = "/?term=${termId}";
      }, 500);
    </script>
</body>
</html>`.trim();

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8', // Ensure UTF-8
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    } catch (error) {
      console.error('Middleware error:', error);
      return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }
  }

  // For real users, just continue to the app
  return new Response(null, {
    headers: { 'x-middleware-next': '1' },
  });
}
