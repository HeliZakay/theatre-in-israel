## Project Architecture Analysis

### Overview

This is a **Next.js 16 App Router** application for theatre reviews in Israel, built with **React 19**. It's an RTL Hebrew website using CSS Modules for styling and Radix UI for accessible primitives.

### Directory Structure

```
theatre-in-israel/
├── public/                    # Static assets (images)
├── src/
│   ├── app/                   # Next.js App Router (pages & API)
│   │   ├── layout.js          # Root layout with Header/Footer
│   │   ├── page.js            # Home page
│   │   ├── globals.css        # CSS variables & resets
│   │   ├── api/reviews/       # POST endpoint for reviews
│   │   ├── reviews/new/       # New review form page
│   │   └── shows/
│   │       ├── page.js        # Shows listing with filters
│   │       └── [id]/
│   │           ├── page.js    # Show detail page
│   │           └── review/    # Add review to specific show
│   ├── components/            # Reusable UI components
│   │   ├── index.js           # Barrel exports
│   │   ├── Button/
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── Hero/
│   │   ├── ShowCard/
│   │   ├── ReviewCard/
│   │   └── ...
│   ├── data/
│   │   └── shows.json         # JSON file as database
│   ├── lib/
│   │   └── shows.js           # Data access layer
│   └── utils/
│       └── formatDate.js      # Shared utilities
```

### Key Patterns

| Pattern                 | Implementation                                          |
| ----------------------- | ------------------------------------------------------- |
| **Data Access**         | `lib/shows.js` reads/writes JSON file (pseudo-database) |
| **Styling**             | CSS Modules co-located with components                  |
| **Component Structure** | `ComponentName/ComponentName.jsx` + `.module.css`       |
| **Server Components**   | Pages are async server components by default            |
| **API Routes**          | Route handlers for form submissions                     |

---

### Downsides & Risks

| Issue                       | Impact                                                            | Severity |
| --------------------------- | ----------------------------------------------------------------- | -------- |
| **JSON file as database**   | Data loss on concurrent writes, no rollback, not scalable         | High     |
| **No TypeScript**           | Runtime errors, poor IDE support, harder refactoring              | Medium   |
| **No validation library**   | Manual validation in API routes, inconsistent                     | Medium   |
| **No error boundaries**     | Unhandled errors crash the UI                                     | Medium   |
| **Hardcoded featured show** | Hero always shows "גבירתי הנאווה"                                 | Low      |
| **No loading/error states** | Missing Suspense boundaries and error.js files                    | Medium   |
| **No tests**                | No unit or integration tests                                      | High     |
| **Mixed export styles**     | Some components use `export default`, SearchBar uses named export | Low      |
| **No image optimization**   | Only 2 static images, but no dynamic poster images for shows      | Low      |
| **Dark mode incomplete**    | CSS vars defined but components don't fully support dark mode     | Low      |

---

### Recommended Improvements

**High Priority:**

1. **Replace JSON with a database** - SQLite (via Prisma/Drizzle) or Turso for persistence
2. **Add TypeScript** - Define types for `Show`, `Review`, API responses
3. **Add error.js and loading.js** - App Router error/loading boundaries
4. **Add form validation** - Use Zod + react-hook-form

**Medium Priority:** 5. **Add tests** - Vitest for unit tests, Playwright for E2E 6. **Normalize exports** - Use consistent `export default` across all components 7. **Add image support for shows** - Dynamic poster images from data 8. **Create hooks folder** - Extract reusable logic (e.g., `useDebounce` for search)

**Nice to Have:** 9. **Add constants folder** - Centralize routes, config values 10. **Complete dark mode** - Or remove the incomplete CSS variables 11. **Add SEO** - Dynamic metadata for show pages 12. **Add pagination** - Shows list could grow large
