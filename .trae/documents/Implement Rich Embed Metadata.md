# Implement Rich Embed Metadata for Term Permalinks

To enable rich previews on platforms like Discord and Twitter, we need to provide Open Graph (OG) and Twitter Card metadata. Since this is a client-side React application, we will implement a dual approach: a static foundation in the HTML and dynamic updates in React.

## Technical Implementation

### 1. Update Base Metadata in `index.html`
Add static meta tags to provide a default embed for the home page and a fallback for crawlers that do not execute JavaScript.
- Add `og:site_name`, `og:type`, and `twitter:card`.
- Add a default `og:title` and `og:description`.
- Add a `theme-color` tag using the app's accent color (`#09BE82`).

### 2. Implement Dynamic Metadata Logic in `Glossary.tsx`
Add logic to detect when a single term is being viewed via a permalink and update the page's metadata accordingly.
- **Helper Function**: Create a utility to update `<title>` and `<meta>` tags (e.g., `og:title`, `og:description`, `description`) in the document head.
- **Effect Hook**: Add a `useEffect` that runs when the `filteredTerms` list changes.
- **Logic**:
  - If `filteredTerms` contains exactly one term (permalink mode), set the title to `Term Name | Vine Lingo` and the description to the term's definition.
  - If not in permalink mode, reset to the default site title and description.

### 3. Considerations for Social Platforms
- **Browser Support**: This will correctly update the browser tab title and metadata for SEO-conscious bots (like Google).
- **Social Crawlers**: Platforms like Discord and Twitter often fetch the raw HTML without executing JavaScript. For 100% reliability on these platforms, a server-side solution (like Vercel Edge Middleware or SSR) would be required. However, the proposed client-side implementation is the standard "best effort" for SPAs.

## Verification Plan
1. **Manual Check**: Open a permalink (e.g., `?term=etv`) and verify the browser tab title updates.
2. **Inspector Check**: Use the browser's DevTools to verify that `<meta>` tags in the `<head>` are correctly updated with the term's information.
3. **Social Preview**: Test the URL with tools like the [Open Graph Debugger](https://opengraph.dev/) or [Twitter Card Validator](https://cards-dev.twitter.com/validator).
