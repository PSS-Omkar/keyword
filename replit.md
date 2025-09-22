# Traffid Projects - Full Stack Application

## Overview
Traffid Projects is a full-stack web application for managing advertising projects and campaigns. It offers a dashboard to create, manage, and track advertising efforts across multiple advertisers, countries, and languages. The application integrates with Google Keyword Planner for keyword generation, supports Meta Ads API for campaign management, and provides robust features for campaign creation (including bulk upload), advertiser management, and AI-driven content prompts. Its vision is to streamline advertising project workflows, offering comprehensive tools for campaign lifecycle management and external API access for automation.

## User Preferences
Preferred communication style: Simple, everyday language.
Company details: Traffid AI Ltd, Dubai International Financial Centre (DIFC), Gate Avenue, Zone D, Dubai, UAE

## System Architecture
### Frontend
- **Framework**: React 18 with TypeScript.
- **Build Tool**: Vite.
- **UI Framework**: shadcn/ui (Radix UI primitives) and Tailwind CSS.
- **State Management**: TanStack Query (React Query).
- **Routing**: Wouter.
- **Form Handling**: React Hook Form with Zod validation.

### Backend
- **Runtime**: Node.js with Express.js.
- **Language**: TypeScript with ESM.
- **Database**: PostgreSQL with Drizzle ORM.
- **Authentication**: Replit OAuth with session management.
- **API Design**: RESTful API with structured error handling.

### Database
- **ORM**: Drizzle with PostgreSQL dialect.
- **Connection**: Neon serverless PostgreSQL with connection pooling.
- **Schema**: Shared schema definitions for users, projects, campaigns, advertisers, and sessions. Includes fields for keyword generation (volume, bid), AI prompt fields (aiPrimaryText, aiHeadline, aiCta, aiImage, aiVideo), and Meta Ads configurations.
- **Migrations**: Drizzle Kit for database migrations.

### Key Features and Implementations
- **Authentication**: Replit OAuth (OpenID Connect) with PostgreSQL-backed sessions using `connect-pg-simple`.
- **Project Management**: CRUD operations for projects, supporting multi-country, multi-language, and topic associations. Includes keyword quantity and bid estimates.
- **Campaign Management**: CRUD operations for campaigns within projects, supporting optional fields (traffic source, primary text, headline, description, CTA, image, video). Features bulk creation via CSV, keyword targeting, and status tracking.
- **Advertiser Management**: CRUD operations for advertisers with channel IDs.
- **Traffic Sources Management**: Full CRUD for configurable traffic sources, compulsory for campaign creation.
- **Campaign Groups**: Functionality to group campaigns with automatic keyword selection from projects, supporting bulk upload/export.
- **Google Keyword Planner Integration**: ✅ **WORKING** - Full integration with Google Ads API for authentic keyword generation using user's working code. Automatically generates keywords when project status becomes "active". Supports exact topic matching without variations, uses proper country location IDs and language IDs from shared data, USD bid conversion using environment variable USD_RATE (87.67), and filtering by minimum bid amount and search volume. Uses provided Google credentials for OAuth authentication. Successfully tested with diamond/engagement rings keywords returning real data from Google's API (e.g., 301K volume for "diamond rings", $5.00 bid).
- **Meta Ads Integration**: Comprehensive section for managing Meta Ads campaigns, including fetching ad accounts, pixels, conversion events, and full CRUD for Meta campaign configurations (location targeting, budgets, objectives).
- **External API Access**: `/api/external/*` endpoints for authenticated access to project data, campaign creation, countries, languages, and Meta campaign management.
- **UI/UX**: shadcn/ui component library, responsive design with mobile-first approach, interactive data tables, and consistent form components. Fixed number input fields to allow direct typing of single digits.
- **Data Flow**: Handled by React Query for caching, synchronization, optimistic updates, and error handling with toast notifications.
- **Country/Language Data**: Updated with accurate Google Ads API country codes and language IDs from official JSON sources.
- **Deployment**: Vite for frontend assets, esbuild for backend bundling. Utilizes Neon PostgreSQL.

## External Dependencies
- **Database**: `@neondatabase/serverless`, `drizzle-orm`.
- **Frontend State & UI**: `@tanstack/react-query`, `@radix-ui/***`, `react-hook-form`, `zod`.
- **Authentication**: `openid-client`, `passport`, `express-session`, `connect-pg-simple`.
- **API Integrations**: `google-auth-library`, `axios` (Google Ads API), Meta Ads API.
- **Utilities**: `express-fileupload` (for bulk uploads), `xlsx` (for Excel export), `tsx` (development), `esbuild` (production), `tailwindcss`.