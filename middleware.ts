import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: '/',
};

export async function middleware(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const termId = searchParams.get('term');

  // If there's no term ID, just continue to the normal app
  if (!termId) {
    return NextResponse.next();
  }

  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /bot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegram|discordbot/i.test(userAgent);

  // If it's a bot, we want to serve a page with dynamic meta tags
  if (isBot) {
    // Rewrite to our dedicated share handler
    return NextResponse.rewrite(new URL(`/api/share?term=${termId}`, req.url));
  }

  // For real users, just serve the normal app (the client-side React will handle the ?term= logic)
  return NextResponse.next();
}
