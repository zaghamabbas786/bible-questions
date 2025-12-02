# Bible Questions

An ultra-minimalist, focused Bible study assistant built with Next.js 16, Clerk authentication, and Supabase PostgreSQL.

## Features

- **Deep Biblical Analysis**: Provides historical context, original language analysis (Greek/Hebrew), and theological insights
- **Clerk Authentication**: Simple login after a few searches
- **Supabase Database**: Public search database for SEO purposes
- **Search Tracking**: Tracks searches and requires authentication after 3 free searches

## Tech Stack

- **Next.js 16**: Latest version with App Router
- **Clerk**: Authentication and user management
- **Supabase**: PostgreSQL database for storing searches
- **Google Gemini AI**: For generating study notes and analysis
- **Tailwind CSS**: For styling
- **TypeScript**: For type safety

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```env
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Gemini API
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Set up Supabase database**:
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor

4. **Set up Clerk**:
   - Create a Clerk account and application
   - Add your Clerk keys to `.env.local`

5. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

The application uses two main tables:

1. **searches**: Public table for SEO purposes, stores all searches
2. **user_searches**: Private table for tracking per-user search count

See `supabase/schema.sql` for the complete schema.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── components/      # React components
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── lib/                 # Utility functions
├── supabase/            # Database schema
└── types.ts             # TypeScript types
```

## Features

- **Search Limit**: Users can make 3 free searches before requiring authentication
- **Public Search Database**: All searches are saved to a public database for SEO
- **User Search Tracking**: Authenticated users have their searches tracked separately
- **Dark Mode**: Toggle between light and dark themes
- **Export**: Save study results as Markdown files

## Build

```bash
npm run build
npm start
```

## License

MIT
