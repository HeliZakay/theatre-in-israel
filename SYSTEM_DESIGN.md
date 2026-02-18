# System Design — Theatre in Israel

Last updated: 2026-02-18

## Architecture Overview

```mermaid
graph TB
    subgraph Browser["Browser (Client)"]
        SSR["Server-Rendered Pages\n(Home, Shows, Show Detail,\nMy Reviews, My Watchlist)"]
        CC["Client Components\n(ReviewForm, WatchlistButton,\nSearchBar, ShowsFilterBar,\nShowCarousel, Header)"]
    end

    subgraph NextServer["Next.js Server (Node.js 20)"]
        MW["Middleware\nCSRF Origin Check\n(all /api/* mutations)"]
        
        subgraph APIRoutes["API Routes"]
            AUTH_API["/api/auth/*\nNextAuth + Signup"]
            REV_API["/api/reviews\nPOST - PATCH - DELETE"]
            WL_API["/api/watchlist\nGET - POST - DELETE"]
            ME_API["/api/me/reviews\nGET"]
        end

        subgraph DataLayer["Data Layer (src/lib/data/)"]
            HP["homepage.ts"]
            SL["showsList.ts"]
            SD["showDetail.ts"]
        end

        subgraph ServiceLayer["Service Layer (src/lib/)"]
            AUTH_SVC["auth.ts\nrequireAuth - authOptions"]
            REV_SVC["reviews.ts\naddReview - updateReview\ndeleteReview - getByUser"]
            WL_SVC["watchlist.ts\nadd - remove - check\ngetShowIds"]
            SHOW_SVC["showHelpers.ts\nnormalizeShow\nfetchShowsByIds"]
        end

        RL["Rate Limiter\nCreate: 3/hr (DB query)\nEdit: 10/hr (in-memory Map)"]
        PRISMA["Prisma Client\n(Singleton, auto-selects\nNeon or pg adapter)"]
    end

    subgraph ISR["Caching"]
        ISR_CACHE["Next.js ISR\nrevalidate = 120s\n(Home, Show Detail)"]
        REACT_CACHE["React.cache()\n(dedupe within request)"]
    end

    subgraph DB["PostgreSQL (Neon Serverless)"]
        MODELS["User - Show - Review\nWatchlist - Genre - ShowGenre\nAccount - Session"]
    end

    subgraph ExtAuth["External Auth"]
        GOOGLE["Google OAuth"]
    end

    SSR -->|"Initial page request"| DataLayer
    CC -->|"fetch() mutations"| MW
    MW -->|"Pass if valid origin"| APIRoutes

    AUTH_API -->|"OAuth callback"| GOOGLE
    AUTH_API --> AUTH_SVC
    REV_API --> RL
    RL --> REV_SVC
    WL_API --> WL_SVC
    ME_API --> REV_SVC

    DataLayer --> ServiceLayer
    ServiceLayer --> PRISMA
    DataLayer --> PRISMA

    PRISMA -->|"SQL over\nNeon WebSocket / TCP"| MODELS

    DataLayer -.->|"ISR pages"| ISR_CACHE
    SD -.->|"dedupe getShowById"| REACT_CACHE

    style Browser fill:#e8f4fd,stroke:#2196F3
    style NextServer fill:#fff3e0,stroke:#FF9800
    style DB fill:#e8f5e9,stroke:#4CAF50
    style ExtAuth fill:#fce4ec,stroke:#E91E63
    style ISR fill:#f3e5f5,stroke:#9C27B0
```

## Component Summary

| Component | Technology | Role |
|-----------|-----------|------|
| **Client** | React 19 + Next.js App Router | SSR pages + interactive client components |
| **Server** | Next.js 16 on Node.js 20 | Renders pages (SSR/ISR), hosts API routes, runs middleware |
| **Data Layer** | `src/lib/data/` | Server-side data-fetching functions consumed by page components |
| **Service Layer** | `src/lib/` | Business logic for reviews, watchlist, auth |
| **API Routes** | 7 endpoints under `src/app/api/` | REST-style mutations (reviews CRUD, watchlist CRUD, auth) |
| **Auth** | NextAuth v4 (JWT sessions) | Google OAuth + credentials provider; Prisma adapter |
| **ORM** | Prisma 7 with driver adapters | Auto-selects Neon serverless adapter or standard pg |
| **Database** | PostgreSQL (Neon) | 7 models: User, Show, Review, Watchlist, Genre, ShowGenre, Account/Session |
| **Middleware** | `src/middleware.ts` | CSRF protection on all `/api/*` mutating requests |
| **Rate Limiter** | `src/utils/reviewRateLimit.ts` | DB-based (create: 3/hr) + in-memory Map (edit/delete: 10/hr) |
| **Cache** | Next.js ISR + `React.cache()` | No external cache — ISR for home/show detail; force-dynamic for filtered lists |

## Data Flow

1. **Page loads** — Browser → Next.js Server Components → Data Layer → Prisma → PostgreSQL. Home and show detail use ISR (2-min revalidation); shows list is always dynamic.
2. **Client mutations** — Client Components call API Routes via `fetch()` → CSRF middleware → auth + rate-limit guard → Service Layer → Prisma → PostgreSQL.
3. **Auth** — Google OAuth or email/password signup. JWT sessions (30-day expiry). Server pages use `requireAuth()`; API routes use `requireApiAuth()`.

## Database Schema

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Review : writes
    User ||--o{ Watchlist : has

    Show ||--o{ Review : "has reviews"
    Show ||--o{ Watchlist : "on watchlists"
    Show ||--o{ ShowGenre : "tagged with"
    Genre ||--o{ ShowGenre : "tags"

    User {
        string id PK
        string name
        string email UK
        string password
        string image
    }

    Show {
        int id PK
        string title
        string description
        string theater
        date startDate
        date endDate
        string imageUrl
    }

    Review {
        int id PK
        int rating
        string title
        string body
        string userId FK
        int showId FK
        datetime createdAt
        datetime updatedAt
    }

    Watchlist {
        string userId PK_FK
        int showId PK_FK
    }

    Genre {
        int id PK
        string name UK
    }

    ShowGenre {
        int showId PK_FK
        int genreId PK_FK
    }
```

## Scaling Improvements

| Area | Current State | Recommendation |
|------|--------------|----------------|
| **Caching** | No external cache; ISR only on a few pages | Add **Redis** (Upstash) for API response caching, session storage, and shared rate-limit backend |
| **Rate Limiting** | Edit/delete uses in-memory `Map` — resets on redeploy, per-instance | Move to **Redis-backed rate limiting** (`@upstash/ratelimit`) |
| **Database** | Direct queries for every filtered/paginated request | Add a **read replica** for heavy reads and/or CDN-level caching |
| **Search** | DB `LIKE` queries via URL params | Introduce **full-text search** (Postgres `tsvector` or Meilisearch/Algolia) |
| **Images** | Static images in `/public` | Offload to **CDN/image service** (Cloudinary, Imgix) for responsive sizing + format conversion |
| **Background Jobs** | Profanity filtering runs synchronously | Add a **message queue** (Inngest, QStash) for async moderation |
| **Observability** | No logging/tracing infrastructure | Add **structured logging** (Pino) + **tracing** (OpenTelemetry) + **error tracking** (Sentry) |
