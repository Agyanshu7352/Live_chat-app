<div align="center">

# ChatFlow 💬

**A production-grade real-time chat application**

Built with Next.js · TypeScript · Convex · Clerk · Tailwind CSS v4

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=flat-square)](https://convex.dev)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple?style=flat-square)](https://clerk.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)

[**Live Demo →**](https://your-app.vercel.app) &nbsp;·&nbsp; [**Video Walkthrough →**](https://loom.com/your-video)

![ChatFlow Screenshot](https://via.placeholder.com/900x500/0f0f13/6c63ff?text=ChatFlow+App+Screenshot)

</div>

---

## What is ChatFlow?

ChatFlow is a real-time direct messaging app where users can sign up, discover other users, and chat with them instantly. Messages, typing indicators, and online status all update live across all connected clients — no page refresh, no polling.

Built as part of the **Tars Full Stack Engineer Internship Challenge 2026**.

---

## Features

### ✅ Core (10/10 implemented)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Authentication** | Sign up / log in via email or Google using Clerk. User profiles auto-synced to Convex. |
| 2 | **User Discovery** | Browse all registered users. Real-time search filters by name as you type. |
| 3 | **Direct Messaging** | Private 1-on-1 conversations. Messages appear instantly using Convex subscriptions. |
| 4 | **Smart Timestamps** | `2:34 PM` today · `Feb 15, 2:34 PM` older · `Feb 15 2023` different year |
| 5 | **Empty States** | Helpful UI for no conversations, empty chats, and no search results — no blank screens. |
| 6 | **Responsive Layout** | Sidebar + chat on desktop. Full-screen chat with back button on mobile. |
| 7 | **Online / Offline Status** | Live green dot indicator. Heartbeat-based with stale-session detection. |
| 8 | **Typing Indicator** | Animated bouncing dots with sender name. Auto-expires after 2s of inactivity. |
| 9 | **Unread Message Badges** | Per-conversation unread count. Clears instantly when conversation is opened. |
| 10 | **Smart Auto-Scroll** | Auto-scrolls to new messages. Shows `↓ New messages` button if user scrolled up. |

### ⭐ Bonus (2/4 implemented)

| # | Feature | Description |
|---|---------|-------------|
| 11 | **Delete Own Messages** | Soft delete — shows *"This message was deleted"* placeholder for all users. |
| 12 | **Message Reactions** | Long-press any message for a WhatsApp-style popup. React with 👍 ❤️ 😂 😮 😢. Tap again to remove. |

---

## Tech Stack

| Technology | Version | Role |
|-----------|---------|------|
| [Next.js](https://nextjs.org) | 15 | React framework with App Router |
| [TypeScript](https://typescriptlang.org) | 5 | End-to-end type safety |
| [Convex](https://convex.dev) | Latest | Real-time backend, database & serverless functions |
| [Clerk](https://clerk.com) | Latest | Authentication — sign up, sign in, session management |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Utility-first styling |
| [date-fns](https://date-fns.org) | 3 | Timestamp formatting |
| [lucide-react](https://lucide.dev) | Latest | Icons |

---

## Project Structure

```
chatflow/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                   # Root layout — wraps app with Clerk + Convex providers
│   ├── page.tsx                     # Main chat page (protected, requires auth)
│   ├── globals.css                  # Tailwind v4 import + CSS custom properties + animations
│   ├── sign-in/[[...sign-in]]/      # Clerk catch-all sign-in route
│   └── sign-up/[[...sign-up]]/      # Clerk catch-all sign-up route
│
├── components/
│   ├── ConvexClientProvider.tsx     # Bridges Clerk JWT tokens → Convex auth
│   ├── Sidebar.tsx                  # Left panel: conversation list, search, unread badges
│   ├── ChatArea.tsx                 # Right panel: message thread, input, auto-scroll
│   ├── MessageBubble.tsx            # Single message with reactions + soft delete
│   └── TypingIndicator.tsx          # Animated "Alex is typing..." component
│
├── convex/                          # Convex backend (all server-side logic lives here)
│   ├── schema.ts                   # Database table definitions + indexes
│   ├── auth.config.ts              # Clerk JWT verification for Convex
│   ├── users.ts                    # store, getMe, listAll, getById
│   ├── conversations.ts            # getOrCreate, listMine, get
│   ├── messages.ts                 # list, send, deleteMessage, toggleReaction
│   ├── presence.ts                 # update, getPresence
│   ├── typing.ts                   # setTyping, getTyping
│   └── readReceipts.ts             # markRead
│
├── lib/
│   └── utils.ts                    # formatMessageTime, formatTimestamp, formatHeaderTimestamp
│
├── middleware.ts                    # Clerk middleware — protects all non-auth routes
├── .env.example                    # Environment variable template
└── README.md
```

---

## Database Schema

Five tables, designed for clarity and extensibility:

```
users
├── clerkId        string    ← links Convex user to Clerk identity
├── name           string
├── email          string
├── imageUrl       string
├── isOnline       boolean
└── lastSeen       number    ← unix timestamp for stale-session detection

conversations
├── participants   Id[]      ← array allows future group chat support
├── lastMessageTime  number  ← used to sort sidebar by recency
└── lastMessageText  string  ← preview text shown in sidebar

messages
├── conversationId   Id
├── senderId         Id
├── text             string
├── isDeleted        boolean  ← soft delete flag
└── reactions        Record<userId, emoji[]>

readReceipts
├── conversationId   Id
├── userId           Id
└── lastReadTime     number   ← single timestamp, not per-message (efficient)

typingIndicators
├── conversationId   Id
├── userId           Id
└── lastTypedAt      number   ← query filters out records > 3s old (self-expiring)
```

### Key Schema Decisions

**`readReceipts` uses a single timestamp, not per-message flags.**
Unread count = `messages where _creationTime > lastReadTime`. This is O(1) storage per user per conversation regardless of how many messages exist.

**`reactions` is stored inline on the message as `Record<userId, emoji[]>`.**
No separate reactions table needed. Toggling a reaction is a single `patch()` call. Works well at chat scale.

**`typingIndicators` are self-expiring.**
No cron job or cleanup worker. The `getTyping` query simply filters out records older than 3 seconds. Stale records are harmless and get overwritten naturally.

**`conversations.participants` is an array.**
Enables future group chat support without a schema migration — just add more IDs to the array.

---

## How Real-Time Works

Convex uses a **reactive query model** — not polling, not manual WebSockets.

```
User A types a message
        ↓
  sendMessage mutation runs on Convex server
        ↓
  Message inserted into database
        ↓
  Convex detects data change
        ↓
  All clients subscribed to this conversation are notified via WebSocket
        ↓
  useQuery() re-runs on User B's browser
        ↓
  React re-renders with the new message
```

From the frontend's perspective, you just write:

```ts
const messages = useQuery(api.messages.list, { conversationId });
```

That's it. The array updates automatically whenever anyone sends a message.

---

## Local Setup

### Prerequisites
- Node.js 18+
- A free [Convex](https://convex.dev) account
- A free [Clerk](https://clerk.com) account

### Step 1 — Clone and install

```bash
git clone https://github.com/yourusername/chatflow.git
cd chatflow
npm install
```

### Step 2 — Set up Convex

```bash
npx convex dev
```

This will prompt you to log in, create a deployment, and automatically write `NEXT_PUBLIC_CONVEX_URL` to your `.env.local`.

### Step 3 — Set up Clerk

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application**
2. Enable **Email** and any social providers (Google recommended)
3. Go to **API Keys** → copy your Publishable Key and Secret Key
4. Go to **JWT Templates** → **New Template** → select **Convex**
5. Copy the **Issuer URL** shown on that page



### Step 5 — Add `CLERK_JWT_ISSUER_DOMAIN` to Convex

Go to your [Convex Dashboard](https://dashboard.convex.dev) → **Settings** → **Environment Variables** → add:

```
CLERK_JWT_ISSUER_DOMAIN = https://your-domain.clerk.accounts.dev
```

This allows Convex to verify Clerk's JWT tokens on the backend.

### Step 6 — Run the app

Open two terminals:

```bash
# Terminal 1 — Convex dev server (watches convex/ folder for changes)
npx convex dev

# Terminal 2 — Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign up with two different accounts to test real-time messaging.

---

## Deployment

### Deploy to Vercel

```bash
# 1. Push to GitHub
git push origin main

# 2. Import repo at vercel.com/new
# 3. Add all .env.local variables in Vercel's Environment Variables settings
# 4. Deploy
```

### Deploy Convex to Production

```bash
npx convex deploy
```

This promotes your Convex functions and schema to the production deployment. Make sure your Vercel environment variables point to the production Convex URL.
