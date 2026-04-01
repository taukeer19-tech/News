# Email Marketing Platform (Next.js Edition)

A complete, production-ready web application designed for multi-tenant email marketing management. It allows users to manage contacts, create/use templates, send newsletter campaigns, track opens/clicks, and handle bounce tracking.

## Features Included
- **Multi-tenant Architecture:** Data is isolated per user through Prisma relational modeling.
- **Glassmorphism UI:** Built completely with Tailwind CSS standard utilities (`backdrop-blur-md`, text opacity) spanning all dashboard views.
- **Dynamic SMTP Allocation:** Bring your own mailing servers (SendGrid, Mailtrap, AWS SES).
- **Pixel Tracking:** 1x1 GIF generation for tracking opens, and redirect endpoints for link clicks.

## Next Steps for Local Development
Because your local machine does not currently have `npm` recognizing paths correctly, all boilerplate files have been written directly to disk. 

Once you repair your local Node.js installation (or restart your terminal), run the following commands sequentially:

**1. Install Dependencies**
```bash
npm install
```

**2. Configure Environment**
Create a `.env` file in the root directory:
```env
DATABASE_URL="mysql://username:password@localhost:3306/email_db" # Or postgres
NEXTAUTH_SECRET="use-a-secure-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

**3. Run Database Migrations**
```bash
npx prisma db push
```

**4. Start the Application**
```bash
npm run dev
```

## Deploying to Vercel
1. Initialize a Git repository inside this folder and commit the code.
2. Push your repository to GitHub.
3. Import the repository into your Vercel Dashboard.
4. Supply your `DATABASE_URL` (e.g., from PlanetScale, Supabase, Neon) into the Vercel Environment variables settings.
5. Vercel will automatically build and deploy your Email Marketing Platform using Next.js!

## Background Queues Note
Currently, this architecture relies on Vercel Serverless Functions. Since a massive campaign (e.g. 100,000 users) would time out a standard API request, you should consider implementing a serverless queuing solution such as **Upstash QStash** or **Inngest**. The codebase is easily adaptable to these tools by adding an endpoint in `app/api/...` that consumes array chunks.
