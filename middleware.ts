export const config = {
  // Match all paths except for static assets
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};

// Helper function to escape HTML entities
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Helper function to create a URL-friendly slug from a term name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Check if a string looks like a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function middleware(req: Request) {
  const url = new URL(req.url);
  const termId = url.searchParams.get('term');

  // FORCE the bot detection to true for a specific debug parameter
  // This helps you test if the HTML generation is working in your own browser
  const isDebug = url.searchParams.get('debug') === '1';

  const userAgent = req.headers.get('user-agent') || '';
  // Expanded bot list including common preview fetchers
  const isBot = isDebug || /bot|googlebot|crawler|spider|robot|crawling|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discordbot|slackbot|applebot|bingbot|yandex|baiduspider|duckduckbot/i.test(userAgent);

  // If it's a bot, we serve the HTML with meta tags
  if (isBot) {
    // Handle base URL (main site)
    if (!termId) {
      const title = 'Vine Lingo - The Unofficial Vine Dictionary';
      const description = 'A quick-reference guide for Amazon Vine Voices. Demystify acronyms and slang used in community forums and Discord servers.';
      // Use absolute URL for the image - ensure https protocol
      const protocol = url.protocol === 'https:' ? 'https' : 'https';
      const ogImageUrl = `${protocol}://${url.host}/api/og`;
      const canonicalUrl = `${protocol}://${url.host}${url.pathname}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    <meta property="og:site_name" content="Vine Lingo">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${canonicalUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#09BE82">
    
    <!-- Fallback for simple parsers -->
    <meta itemprop="name" content="${title}">
    <meta itemprop="description" content="${description}">
    <meta itemprop="image" content="${ogImageUrl}">
</head>
<body style="font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
    <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 2rem;">
        <div style="width: 80px; height: 80px; border-radius: 16px; background-color: #09BE82; display: flex; align-items: center; justify-center; color: white; font-size: 48px; font-weight: bold;">
            V
        </div>
        <h1 style="font-size: 3rem; margin: 0;">Vine Lingo</h1>
    </div>
    <p style="font-size: 1.5rem; max-width: 800px; line-height: 1.6; color: #cbd5e1;">${description}</p>
    <!-- We delay the redirect slightly for bots that execute JS -->
    <script>
      setTimeout(function() {
        window.location.href = "/";
      }, 500);
    </script>
</body>
</html>`.trim();

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      });
    }

    // Handle term permalink
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        if (isDebug) {
          return new Response(`Missing Environment Variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY`, { status: 500 });
        }
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }

      let term: any = null;

      // Try to find by slug first (if it doesn't look like a UUID)
      if (!isUUID(termId)) {
        // Query all approved terms and find by slug
        const slug = termId.toLowerCase().trim();
        const response = await fetch(
          `${supabaseUrl}/rest/v1/terms?select=*&status=eq.approved`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Find term where slugified name matches
          term = data.find((t: any) => slugify(t.term) === slug);
        }
      }

      // If not found by slug, or if it's a UUID, try ID lookup
      if (!term) {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/terms?id=eq.${encodeURIComponent(termId)}&select=*`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        if (!response.ok) {
          if (isDebug) {
            return new Response(`Supabase Fetch Error: ${response.status} ${response.statusText}`, { status: 500 });
          }
          return new Response(null, { headers: { 'x-middleware-next': '1' } });
        }

        const data = await response.json();
        term = data[0];
      }

      if (!term) {
        if (isDebug) {
          return new Response(`Term not found in database for ID: ${termId}`, { status: 404 });
        }
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
      }

      // Escape HTML to prevent breaking meta tags
      const escapedTerm = escapeHtml(term.term);
      const escapedDefinition = escapeHtml(term.definition);
      const title = `${escapedTerm} - Vine Lingo`;
      const description = escapedDefinition;
      // Use absolute URL for the image - use slug for better URLs
      const protocol = url.protocol === 'https:' ? 'https' : 'https';
      const termSlug = slugify(term.term);
      const ogImageUrl = `${protocol}://${url.host}/api/og?term=${encodeURIComponent(termSlug)}`;
      const canonicalUrl = `${protocol}://${url.host}${url.pathname}${url.search}`;

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    
    <!-- Open Graph / Facebook / Discord -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${ogImageUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    <meta property="og:site_name" content="Vine Lingo">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${canonicalUrl}">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${ogImageUrl}">
    <meta name="twitter:image:alt" content="${escapedTerm} definition">
    
    <!-- Theme Color -->
    <meta name="theme-color" content="#09BE82">
    
    <!-- Fallback for simple parsers -->
    <meta itemprop="name" content="${title}">
    <meta itemprop="description" content="${description}">
    <meta itemprop="image" content="${ogImageUrl}">
</head>
<body style="font-family: sans-serif; background: #0f172a; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; text-align: center;">
    <h1 style="font-size: 3rem; margin-bottom: 1rem;">${escapedTerm}</h1>
    <p style="font-size: 1.5rem; max-width: 800px; line-height: 1.6; color: #cbd5e1;">${escapedDefinition}</p>
    <!-- We delay the redirect slightly for bots that execute JS -->
    <script>
      setTimeout(function() {
        window.location.href = "/?term=${termSlug}";
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
    } catch (error: any) {
      console.error('Middleware error:', error);
      if (isDebug) {
        return new Response(`Middleware Exception: ${error.message}`, { status: 500 });
      }
      return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }
  }

  // For real users, just continue to the app
  return new Response(null, {
    headers: { 'x-middleware-next': '1' },
  });
}
