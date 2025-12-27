# Quick Reference Guide

Fast reference for common tasks and commands.

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (dev only)
npm run db:push

# Create migration
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Seed database
npm run db:seed

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

---

## Project Structure (Quick View)

```
├── src/
│   ├── app/
│   │   ├── (app)/          # Authenticated pages
│   │   │   └── feed/       # Main feed
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed data
└── Configuration files
```

---

## API Endpoints (Quick Reference)

### Auth
- `GET /api/auth/session` - Get session

### Users
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update profile
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/search?q=` - Search users

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post
- `PATCH /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `DELETE /api/posts/:id/like` - Unlike post
- `GET /api/posts/:id/comments` - Get comments
- `POST /api/posts/:id/comments` - Add comment

### Friends
- `GET /api/friends` - Get friends
- `POST /api/friends` - Send friend request
- `GET /api/friends/requests` - Get pending requests
- `PATCH /api/friends/:id` - Accept/reject request
- `DELETE /api/friends/:id` - Remove friend

### Follows
- `POST /api/follows` - Follow user
- `DELETE /api/follows/:userId` - Unfollow user

### Feed
- `GET /api/feed?limit=20&cursor=` - Get feed

### Messages
- `GET /api/messages/conversations` - Get conversations
- `POST /api/messages/conversations` - Create conversation
- `GET /api/messages/:id` - Get messages
- `POST /api/messages/:id` - Send message

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/:id` - Mark as read
- `PATCH /api/notifications` - Mark all as read

### Upload
- `POST /api/upload/presigned` - Get upload URL

---

## Environment Variables (Required)

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl>"

# AWS Cognito
COGNITO_USER_POOL_ID="us-east-1_XXX"
COGNITO_CLIENT_ID="..."
COGNITO_CLIENT_SECRET="..."
COGNITO_REGION="us-east-1"
COGNITO_ISSUER="https://cognito-idp..."

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="..."
CLOUDFRONT_URL="https://..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Database Models (Quick Reference)

- **User** - User accounts
- **Friendship** - Friend relationships (PENDING, ACCEPTED, REJECTED, BLOCKED)
- **Follow** - Follow relationships
- **Post** - Content posts (PUBLIC, FRIENDS, PRIVATE)
- **PostLike** - Post likes
- **Comment** - Post comments (supports nested replies)
- **Conversation** - DM conversations
- **Message** - Individual messages
- **Notification** - System notifications

---

## Common Development Tasks

### Create a new API endpoint

1. Create file: `src/app/api/your-route/route.ts`
2. Export GET, POST, PATCH, or DELETE functions
3. Use `getServerSession` for auth
4. Validate input with Zod
5. Use Prisma for database operations

### Create a new page

1. Create file: `src/app/(app)/your-page/page.tsx`
2. Use `'use client'` if needed
3. Import components from `@/components`
4. Use `useSession` for auth

### Create a new component

1. Create file: `src/components/category/component-name.tsx`
2. Export function component
3. Add tests in `__tests__/` folder

### Add database field

1. Edit `prisma/schema.prisma`
2. Run `npm run db:migrate`
3. Update TypeScript types if needed

---

## Troubleshooting (Quick Fixes)

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill
# Or use different port
npm run dev -- -p 3001
```

### Database connection error
```bash
# Check PostgreSQL is running
pg_ctl status
# Or start it
pg_ctl start
```

### Prisma client out of sync
```bash
npm run db:generate
```

### Next.js cache issues
```bash
rm -rf .next
npm run dev
```

### Module not found
```bash
rm -rf node_modules
npm install
```

---

## Testing

### Run specific test
```bash
npm test -- utils.test.ts
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Update snapshots
```bash
npm test -- -u
```

---

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Add feature"

# Push to remote
git push origin feature/your-feature

# Create pull request (on GitHub)
```

---

## Production Deployment (Vercel)

```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel automatically deploys

# 3. Check deployment status
# Visit Vercel dashboard
```

---

## Useful URLs (Development)

- App: http://localhost:3000
- Prisma Studio: `npm run db:studio`
- API Docs: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

---

## File Locations (Quick Find)

| What | Where |
|------|-------|
| Database schema | `prisma/schema.prisma` |
| API routes | `src/app/api/` |
| Pages | `src/app/(app)/` |
| Components | `src/components/` |
| Utils | `src/lib/` |
| Auth config | `src/lib/auth.ts` |
| DB client | `src/lib/prisma.ts` |
| Global styles | `src/app/globals.css` |
| Tests | `src/**/__tests__/` |

---

## Cost Estimates (Quick Reference)

### MVP (1K-5K users)
- **Total:** ~$55-80/month
- Vercel: $0-20
- RDS: $15-30
- Redis: $15
- S3+CDN: $5-20
- Cognito: $0-5

### Growth (50K users)
- **Total:** ~$300-600/month
- Vercel: $20-150
- RDS: $100-200
- Redis: $50
- S3+CDN: $100-200
- Cognito: $25

---

## Performance Targets

- Uptime: >99.9%
- Response time: <500ms
- Error rate: <0.1%
- Lighthouse: >90 (desktop), >70 (mobile)

---

## Security Checklist (Quick)

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevented (React)
- [ ] CSRF protection (NextAuth)
- [ ] Rate limiting (recommended)
- [ ] File upload validation

---

## Next Steps After Setup

1. Configure AWS services (see SETUP_GUIDE.md)
2. Run migrations
3. Seed database (optional)
4. Create test user
5. Test all features
6. Deploy to Vercel
7. Set up monitoring
8. Launch!

---

## Getting Help

- **Setup Issues:** See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API Questions:** See [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **General Info:** See [README.md](README.md)
- **Deployment:** See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## Keyboard Shortcuts (VS Code)

- `Ctrl+Shift+P` - Command palette
- `Ctrl+P` - Quick file open
- `Ctrl+Shift+F` - Search in files
- `F12` - Go to definition
- `Ctrl+Space` - Autocomplete

---

**Keep this file handy for quick reference during development!**
