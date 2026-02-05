# Implement Dynamic Server-Side OG Embeds

## 1. Backend Infrastructure

* Install `@vercel/og` and `@vercel/edge` for server-side image generation and request interception.

* Create a Vercel Serverless Function `api/og.tsx` that:

  * Fetches term data from Supabase.

  * Renders a professional dictionary card using JSX/Satori (matches the app's "nice layout").

  * Returns a high-quality PNG image.

## 2. Request Interception (Middleware)

* Create `middleware.ts` to:

  * Detect `?term=ID` query parameters.

  * Fetch term metadata (title/definition).

  * Inject dynamic `<meta>` tags into the `index.html` response specifically for the `og:image`, `og:title`, and `og:description` fields.

## 3. Frontend Integration

* Update `index.html` to remove redundant static tags.

* Update `Glossary.tsx` to ensure the "Copy Permalink" button uses the correct URL format that triggers the middleware.

* Remove "Download as Image" button.

## 4. Verification

* Validate the image generation API.

* Test the middleware's HTML injection using CLI tools.

* Confirm rich previews on Discord and Twitter.

