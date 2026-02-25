# Theatre in Israel 🎭

A Hebrew-first web app for discovering theatre shows across Israel and reading & writing audience reviews.

**Live site:** [theatre-in-israel.co.il](https://theatre-in-israel.co.il)

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, React 19, Turbopack)
- **Language** — TypeScript
- **Database** — PostgreSQL via [Neon](https://neon.tech) serverless driver
- **ORM** — [Prisma 7](https://www.prisma.io)
- **Auth** — [NextAuth.js v4](https://next-auth.js.org) (Google OAuth + email/password credentials)
- **UI** — CSS Modules, [Radix UI](https://www.radix-ui.com) primitives, [Embla Carousel](https://www.embla-carousel.com)
- **Forms** — [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) validation
- **Testing** — [Jest](https://jestjs.io) + [React Testing Library](https://testing-library.com), [Playwright](https://playwright.dev) (E2E)
- **Font** — Noto Sans Hebrew (via `next/font`)

## Features

- **Browse shows** — filterable list with search, genre & theatre filters, and sorting
- **Show detail pages** — summary, description, genres, duration, average rating, and all reviews
- **Write reviews** — authenticated users can create, edit, and delete reviews (one per show)
- **Watchlist** — save shows to a personal watchlist
- **Contact form** — public contact form with email delivery via Resend
- **User dashboard** — manage your own reviews at `/me/reviews`
- **Homepage** — featured show carousel, curated show sections, and search bar with autocomplete
- **SEO** — dynamic `sitemap.xml`, `robots.txt`, Open Graph metadata, JSON-LD structured data, breadcrumbs
- **RTL** — full right-to-left layout with Radix direction provider
- **Security** — CSRF origin check middleware, profanity filter, rate limiting on review mutations

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
│   ├── api/          # REST endpoints (auth, reviews, me)
│   ├── auth/         # Sign-in & sign-up pages
│   ├── me/reviews/   # User review dashboard & edit page
│   ├── reviews/new/  # New review form
│   └── shows/        # Shows list & detail pages
├── components/       # Reusable UI components
├── constants/        # App-wide constants (routes, sorts, validation)
├── hooks/            # Custom React hooks
├── lib/              # Server-side helpers (auth, prisma, data fetchers, SEO)
├── types/            # Shared TypeScript types
└── utils/            # Utility functions
prisma/
├── schema.prisma     # Database schema
├── seed.js           # Seed script (E2E/dev only, reads e2e/data/shows.json)
└── migrations/       # Schema + data migrations (includes production show data)
e2e/
└── data/shows.json   # Minimal test fixture (fake shows for E2E tests)
```

## Getting Started

### Prerequisites

- Node.js 20.x
- A PostgreSQL database (Neon recommended)

### Environment Variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="<generate with: openssl rand -base64 32>"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional — sign-in still works with credentials)
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

# Resend (for contact form emails)
RESEND_API_KEY="..."
```

### Install & Run

```bash
# Install dependencies
npm install

# Apply migrations (creates schema + seeds production show data)
npx prisma migrate deploy

# Optionally seed fake test shows for local development
npx prisma db seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Available Scripts

| Script                  | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | Start development server                                         |
| `npm run build`         | Run migrations, generate Prisma client, and build for production |
| `npm start`             | Start the production server                                      |
| `npm run lint`          | Run ESLint                                                       |
| `npm test`              | Run unit & component tests (Jest)                                |
| `npm run test:watch`    | Run tests in watch mode                                          |
| `npm run test:coverage` | Run tests with coverage report                                   |
| `npm run e2e`           | Run end-to-end tests (Playwright)                                |
| `npm run e2e:headed`    | Run E2E tests in headed browser mode                             |
| `npm run e2e:ui`        | Open Playwright UI for interactive test debugging                |
| `npm run e2e:setup`     | Set up E2E test database (Docker + migrations + seed)            |
| `npm run e2e:teardown`  | Tear down E2E test database                                      |
| `npm run db:check`      | Verify database connectivity                                     |

## Deployment

The app is deployed on [Vercel](https://vercel.com) with a Neon PostgreSQL database. Set the environment variables above in your Vercel project settings and deploy — the build script handles migrations and Prisma client generation automatically.
