# Email Marketing Platform Implementation Plan (Next.js Stack)

## Goal Description
Build a multi-tenant email marketing platform where isolated users can manage contacts, email templates, multiple SMTP servers, and send newsletter campaigns. The app will feature open/click tracking, bounce handling, and a modern Glassmorphism UI. 

Since you requested not to use Laravel and you deploy to Vercel, we will build this using a **Next.js** full-stack architecture.

## User Review Required
> [!IMPORTANT]
> - Since you don't have `node` or `npm` installed locally to run scaffolding commands, I will manually generate all the project files (`package.json`, React components, Prisma schema, etc.) in your folder. You can then push this folder to a GitHub repository connected to Vercel. Is this exactly what you want?
> - **Database**: We will use Prisma ORM. Vercel naturally pairs well with PostgreSQL (e.g., Supabase, Neon). Can we use PostgreSQL instead of MySQL?
> - **Queues**: Vercel Serverless Functions have timeouts. We will use **Inngest** or **Upstash QStash** with Redis for background jobs (sending emails reliably). Which do you prefer? (I recommend Upstash if you already planned for Redis).

## Proposed Changes

### 1. Project Setup (Manual Generation)
- **[NEW] `package.json`**: Next.js 14 (App Router), React, Tailwind CSS, Prisma, NextAuth, Nodemailer, Redis.
- **[NEW] `next.config.mjs`**, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`.

### 2. Database & Models (Prisma)
- **[NEW] `prisma/schema.prisma`**: 
  - `User` & `Account` (NextAuth)
  - `Contact` & `ContactList`
  - `Template`
  - `SmtpConfig`
  - `Campaign` & `CampaignRecipient`
  - `Notification`

### 3. Frontend & UI (Glassmorphism)
- **[NEW] `app/globals.css`**: Tailwind directives and glassmorphism utility classes (`bg-white/30 backdrop-blur-md`).
- **[NEW] `app/layout.tsx`**: Main application shell with navigation.
- **[NEW] UI Components**: Next.js Server & Client components for Contacts, Templates, SMTP, and Campaigns dashboards.

### 4. API Routes & Server Actions
- **[NEW] `app/api/auth/[...nextauth]/route.ts`**: Authentication handling.
- **[NEW] Server Actions** for CRUD operations (Contacts, Templates, SMTP Configs, Campaigns).

### 5. Sending Engine & Tracking (Serverless)
- **[NEW] `app/api/queue/send-campaign/route.ts`**: An Upstash QStash endpoint to process the email sending queue.
- **[NEW] `lib/mailer.ts`**: Dynamic `nodemailer` transporter switching based on the user's `SmtpConfig`.
- **[NEW] `app/api/track/open/route.ts`**: Returns a 1x1 GIF and marks `opened_at`.
- **[NEW] `app/api/track/click/route.ts`**: Logs click and redirects to the original URL.
- **[NEW] `app/unsubscribe/[contactId]/[campaignId]/page.tsx`**: One-click unsubscribe page.

## Verification Plan
1. I will write out all the necessary files to your local directory.
2. You will push the code to a Git repository.
3. You will link it to Vercel.
4. Set up environment variables in Vercel (`DATABASE_URL`, `NEXTAUTH_SECRET`, `UPSTASH_REDIS_REST_URL`, etc.).
5. Vercel will build the app and deploy it successfully.
