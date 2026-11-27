# Page addresses (routing) in ECLAT CONNECT

This note explains why each page of ECLAT CONNECT now has its own web address, why that is fully
in keeping with the app being a single-page application (SPA), and how it works in the code.

## 1. What "single-page application" means

ECLAT CONNECT is a React single-page application, and that was the right choice. "Single page"
describes **how the app is delivered**:

- The browser downloads `index.html` and the JavaScript bundle **once**.
- After that, React swaps the content on screen without asking the server for a new HTML page.
- The result is fast, app-like navigation: no white flash and no full reload between screens.

"Single page" does **not** mean the whole site should live at a single address. Every
professionally built SPA (Gmail, YouTube, Facebook, Jumia, Paystack's dashboard) still gives
each screen its own address, for example `/inbox`, `/watch?v=…` or `/products`. The page never
reloads, but the address bar always describes what is on screen.

The two ideas work together:

| | Traditional website | SPA without routing (before) | SPA with routing (now) |
|---|---|---|---|
| New HTML page on every click | Yes (slow) | No (fast) | No (fast) |
| Each screen has its own address | Yes | **No**, always `/` | Yes |
| Share a link to a section or listing | Yes | **No** | Yes |
| Refresh keeps you on the same page | Yes | **No**, back to home | Yes |
| Phone Back button goes to the previous screen | Yes | **No**, leaves the site | Yes |
| Google can list individual sections | Yes | **No** | Yes |

## 2. Why it matters for ECLAT CONNECT specifically

1. **WhatsApp sharing.** Students share links. Before, a link to a good tailor opened the home
   page. Now `/artisans?q=tailor` opens Artisans with "tailor" already searched, and a listing
   link such as `/businesses?open=<id>` opens that listing.
2. **The Back button on phones.** Most visitors use Android phones. Before, pressing Back on any
   screen left the site entirely. Now Back returns to the previous screen and closes an open
   listing first, as people expect.
3. **Refresh.** Before, refreshing on any page returned to the home page. Now the visitor stays
   where they were, filters included.
4. **Search engines.** Google can now index `/businesses`, `/services`, `/artisans` and the other
   sections, so someone searching for "laundry near LAUTECH" can land on the right page.
5. **Measurement.** Analytics can count visits per page, which is impossible when every page
   shares one address.

## 3. How it works

The browser has a built-in **History API** made for exactly this:

- `history.pushState(…, '/businesses')` changes the address **without reloading**, and adds a
  step that the Back button can return to.
- `history.replaceState(…)` updates the address without adding a step. It is used while typing
  in a search box, so Back is not cluttered with every letter.
- The `popstate` event fires when the visitor presses Back or Forward, and the app shows the page
  the address describes.

The app already named its pages with strings ('Businesses', 'Post What I Need', and so on). The
new module `src/routing.ts` is a single table that maps each of those names to an address:

| Page | Address |
|---|---|
| Home | `/` |
| Businesses, Products, Artisans, Services, Pre-owned, Requests | `/businesses`, `/products`, `/artisans`, `/services`, `/pre-owned`, `/requests` |
| Post what I need (and the product, service and pre-owned versions) | `/post`, `/post/product`, `/post/service`, `/post/pre-owned` |
| Sell a pre-owned item | `/sell` |
| Sign in | `/sign-in` |
| Account, my requests, offers, reviews | `/account`, `/account/requests`, `/account/offers`, `/account/reviews` |
| Saved, notifications | `/saved`, `/notifications` |
| List your business, workspace, new listing | `/list-your-business`, `/workspace`, `/workspace/new-listing` |
| Admin | `/admin` |
| Privacy policy, terms of service | `/privacy-policy`, `/terms-of-service` |
| Any unknown address | a "Page not found" page (instead of silently showing the home page) |

Search filters live in the address too: `?q=` (words), `?area=` (location) and `?category=`.
An open listing adds `?open=<id>`. Older addresses (`/privacy`, `/login`, `/professionals`)
still work and are switched to the official address automatically.

Each page also sets the browser tab title, for example "Artisans · ECLAT CONNECT".

### Design choices

- **No new library.** React Router is the most common routing library for React. Here, the app's
  existing page names made a small, documented module (`src/routing.ts`, about 160 lines including comments) the
  smaller and safer change: no new dependency, no rewrite of every page, and no change to how
  pages are rendered. If the app grows, moving to React Router later is straightforward, because
  all addresses are already in one table.
- **Normal links.** The header and footer links are now real links (`<a href="/businesses">`).
  A normal click still navigates instantly without a reload, while Ctrl/Cmd-click and long-press
  "open in new tab" work as in any website.

## 4. Server side: nothing to change

When someone opens a deep link such as `https://…/artisans` directly, the server has no file
called `artisans`. It must answer with `index.html` so the app can load and show the right page.
The existing `nginx.conf` already does this:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Vite's development server does the same. **No backend, nginx, Docker or deployment change is
needed.**

## 5. A suggestion for the backend (optional)

Listing links (`?open=<id>`) currently find the listing in the section's list. If a public
endpoint for a single item existed (for example `GET /api/public/listings/:id` and
`GET /api/public/providers/:id`), each listing could have a permanent address such as
`/listing/<id>` that works even when the listing is not on the first page of results. That is a
small backend addition and can come later.
