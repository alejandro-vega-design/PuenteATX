# Puente ATX responsive prototype

A mobile-first React prototype adapted from the supplied Puente ATX desktop reference.

## Run locally

Requires a current Node.js LTS release (Node 20+ recommended).

```bash
npm install
npm run dev
```

Production checks:

```bash
npm test
npm run lint
npm run build
```

## Resource system and Supabase

The resource directory runs with clearly labeled fictional sample data when Supabase environment variables are absent. To connect production data:

1. Create a Supabase project.
2. Run every SQL file in `supabase/migrations` in numerical order.
3. Copy `.env.example` to `.env.local` and add the project URL and public anon key.
4. Create the first administrator manually in Supabase Auth (email/password; disable public sign-up).
5. Insert that Auth user UUID into `admin_profiles` with role `admin`, using the commented SQL at the end of the first migration.
6. Restart the Vite server.

Never place a service-role key in this project. The browser uses only the public anon key; PostgreSQL RLS enforces public read and administrative write access. Configure the deployment host to rewrite SPA routes to `index.html`.

Detailed architecture, routes, storage, sharing, printing, security and assumptions are documented in `docs/resource-system-spec.md`.

## Structure

- `src/App.jsx` coordinates language, search, History API routing, and drawer state.
- `src/components/` contains the header, homepage sections, saved-list drawer, and the accessible `/conversacion` request page.
- `src/services/conversation.js` isolates the simulated conversation submission so it can be replaced with an API request.
- `src/data.js` centralizes Spanish/English interface copy, categories, FAQs, and local mock content.
- `src/styles.css` contains the visual design tokens and responsive behavior; matching tokens are exposed to Tailwind in `tailwind.config.js`.
- `public/assets/` contains the original logo crop, a cleaned derivative of the supplied family hero photograph, supplied category SVG icons, and locally hosted Poppins headline fonts with their license.

## Responsive decisions

The desktop composition remains four category columns with a wide hero and overlaid search. Below 800px the category grid becomes two columns and the supplied family photo is cropped toward its central subjects. At 480px the search button moves beneath the input to preserve a 44px minimum target and avoid cramped text. At the narrowest supported width (320px), categories switch to one column. Container gutters are 16px at 320px, 20px at 375–390px, and 24px from 430px through small tablet.

## Reference assumptions

The project was empty, so the friendly geometric type is approximated with a self-contained Avenir-style system font stack. Brand colors, border weights, radii, spacing, and restrained shadow values were sampled visually from the reference and centralized as CSS variables. No standalone source assets were initially present; the logo is a lossless crop of the supplied reference. Because the UI text was baked into the screenshot, the hero is an AI-cleaned derivative that removes those interface elements while retaining the reference composition. Category cards now use the supplied SVG files from `public/assets/icons/`.
