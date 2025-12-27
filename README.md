# Professional Network - Social Networking Platform

A modern, full-stack social networking application designed specifically for professional African Americans. Built with Next.js, TypeScript, PostgreSQL, and AWS services.

## 🎯 Overview

Professional Network is a social platform that enables professionals to connect, share updates, engage with content, and build meaningful relationships in a safe and inclusive space.

### Key Features

- ✅ **User Authentication** - Secure sign-up/sign-in via AWS Cognito
- ✅ **User Profiles** - Customizable profiles with avatars, bios, and privacy settings
- ✅ **Friend/Follower System** - Build your network through friend requests and follows
- ✅ **Content Feed** - Personalized feed showing posts from friends and followed users
- ✅ **Posts** - Share text, images, and videos with privacy controls
- ✅ **Engagement** - Like and comment on posts
- ✅ **Direct Messaging** - Private one-on-one conversations
- ✅ **Notifications** - Real-time updates for interactions
- ✅ **Responsive Design** - Mobile-friendly interface with bright blue theme

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Hook Form + Zod validation

**Backend**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (AWS RDS)
- Redis (ElastiCache) - Optional caching layer

**Authentication**
- NextAuth.js
- AWS Cognito

**Media & Storage**
- AWS S3 - Media storage
- CloudFront - CDN for global delivery

**Infrastructure**
- Vercel (recommended) or AWS Amplify
- AWS RDS PostgreSQL
- AWS ElastiCache Redis (optional)
- AWS S3 + CloudFront

### System Architecture

```
┌─────────────────────────────────────────┐
│     Client (Next.js + React)            │
│  - Pages & Components                   │
│  - State Management (Zustand)           │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     API Layer (Next.js API Routes)      │
│  - REST endpoints                       │
│  - Authentication middleware            │
│  - Request validation (Zod)             │
└─────────────────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      ▼           ▼           ▼
┌──────────┬──────────┬──────────┐
│PostgreSQL│  Redis   │   S3     │
│  (RDS)   │ (Cache)  │ (Media)  │
└──────────┴──────────┴──────────┘
```

## 📊 Database Schema

### Core Models

- **User** - User accounts with profiles, settings, and privacy controls
- **Friendship** - Friend connections with request/accept workflow
- **Follow** - Asymmetric following relationships
- **Post** - Content posts with media support and privacy levels
- **PostLike** - Like relationships for posts
- **Comment** - Comments and replies on posts
- **Conversation** - Direct message conversations between users
- **Message** - Individual messages within conversations
- **Notification** - System notifications for user activities

See [prisma/schema.prisma](prisma/schema.prisma) for complete schema definition.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- PostgreSQL database (local or AWS RDS)
- AWS account (for S3, CloudFront, Cognito)
- Redis (optional, for production caching)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd SocialNetwork
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# AWS Cognito
COGNITO_USER_POOL_ID="us-east-1_XXXXXXXXX"
COGNITO_CLIENT_ID="your-cognito-client-id"
COGNITO_CLIENT_SECRET="your-cognito-client-secret"
COGNITO_REGION="us-east-1"
COGNITO_ISSUER="https://cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"
CLOUDFRONT_URL="https://your-cloudfront-domain.cloudfront.net"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# App Config
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Set up the database**

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### AWS Setup

#### 1. Cognito User Pool

1. Create a User Pool in AWS Cognito
2. Configure sign-in options (email)
3. Set password requirements
4. Create an app client
5. Note the User Pool ID, Client ID, Client Secret, and Region

#### 2. S3 Bucket

1. Create an S3 bucket for media storage
2. Enable CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

3. Set up bucket policy for public read access (or use presigned URLs)
4. Note the bucket name and region

#### 3. CloudFront Distribution

1. Create a CloudFront distribution
2. Set origin to your S3 bucket
3. Configure caching behavior
4. Note the distribution domain name

#### 4. RDS PostgreSQL

1. Create a PostgreSQL instance
2. Configure security groups to allow connections
3. Note the connection details for DATABASE_URL

#### 5. ElastiCache Redis (Optional)

1. Create a Redis cluster
2. Configure security groups
3. Note the endpoint for REDIS_URL

## 📝 API Documentation

### Authentication Endpoints

```
POST   /api/auth/signup         - Create new user account
POST   /api/auth/signin         - Sign in user
POST   /api/auth/signout        - Sign out user
GET    /api/auth/session        - Get current session
```

### User Endpoints

```
GET    /api/users/me            - Get current user profile
PATCH  /api/users/me            - Update current user profile
GET    /api/users/:id           - Get user profile by ID
GET    /api/users/search?q=     - Search users
```

### Post Endpoints

```
POST   /api/posts               - Create new post
GET    /api/posts/:id           - Get single post
PATCH  /api/posts/:id           - Update post
DELETE /api/posts/:id           - Delete post
POST   /api/posts/:id/like      - Like a post
DELETE /api/posts/:id/like      - Unlike a post
GET    /api/posts/:id/comments  - Get comments
POST   /api/posts/:id/comments  - Add comment
```

### Friend/Follow Endpoints

```
POST   /api/friends             - Send friend request
GET    /api/friends             - Get friends list
GET    /api/friends/requests    - Get pending requests
PATCH  /api/friends/:id         - Accept/reject request
DELETE /api/friends/:id         - Remove friend

POST   /api/follows             - Follow a user
DELETE /api/follows/:userId     - Unfollow a user
```

### Feed Endpoints

```
GET    /api/feed?limit=20&cursor=  - Get personalized feed
```

### Message Endpoints

```
GET    /api/messages/conversations        - Get all conversations
POST   /api/messages/conversations        - Create conversation
GET    /api/messages/:conversationId      - Get messages
POST   /api/messages/:conversationId      - Send message
```

### Notification Endpoints

```
GET    /api/notifications       - Get notifications
PATCH  /api/notifications/:id   - Mark as read
PATCH  /api/notifications       - Mark all as read
```

### Upload Endpoints

```
POST   /api/upload/presigned    - Get S3 presigned URL
```

For detailed request/response formats, see the API route files in `src/app/api/`.

## 🧪 Testing

### Run tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Structure

```
src/
├── lib/__tests__/           - Utility function tests
├── components/*/tests__/    - Component tests
└── app/api/*/tests__/       - API route tests (add as needed)
```

## 🎨 Project Structure

```
SocialNetwork/
├── prisma/
│   ├── schema.prisma        - Database schema
│   └── seed.ts              - Seed data script
├── src/
│   ├── app/
│   │   ├── (app)/           - Authenticated routes
│   │   │   ├── feed/        - Home feed page
│   │   │   ├── profile/     - User profile pages
│   │   │   ├── messages/    - Direct messaging
│   │   │   └── notifications/ - Notifications
│   │   ├── api/             - API routes
│   │   │   ├── auth/        - Authentication
│   │   │   ├── users/       - User operations
│   │   │   ├── posts/       - Post operations
│   │   │   ├── friends/     - Friend management
│   │   │   ├── follows/     - Follow operations
│   │   │   ├── feed/        - Feed generation
│   │   │   ├── messages/    - Messaging
│   │   │   ├── notifications/ - Notifications
│   │   │   └── upload/      - File uploads
│   │   ├── globals.css      - Global styles
│   │   ├── layout.tsx       - Root layout
│   │   └── page.tsx         - Landing page
│   ├── components/
│   │   ├── ui/              - shadcn/ui components
│   │   ├── layout/          - Layout components
│   │   ├── post/            - Post-related components
│   │   └── providers/       - Context providers
│   ├── lib/
│   │   ├── auth.ts          - Auth configuration
│   │   ├── prisma.ts        - Database client
│   │   ├── redis.ts         - Cache client
│   │   ├── s3.ts            - S3 utilities
│   │   └── utils.ts         - Helper functions
│   └── types/
│       └── next-auth.d.ts   - Type definitions
├── .env.example             - Environment variables template
├── next.config.js           - Next.js configuration
├── tailwind.config.ts       - Tailwind configuration
├── tsconfig.json            - TypeScript configuration
└── package.json             - Dependencies
```

## 🔒 Security Considerations

- All API routes check authentication via NextAuth sessions
- User input validated with Zod schemas
- SQL injection prevention via Prisma parameterized queries
- XSS prevention via React's automatic escaping
- CSRF protection via NextAuth
- File upload size limits enforced
- Rate limiting recommended for production (add middleware)
- Privacy levels enforced on post/profile access

## ⚡ Performance Optimizations

1. **Database Indexes** - Critical queries indexed (user lookups, post feeds, relationships)
2. **Redis Caching** - Feed caching, user profile caching, session storage
3. **Pagination** - Cursor-based pagination for feeds and lists
4. **Image Optimization** - Next.js Image component, CloudFront CDN
5. **Lazy Loading** - Components and images loaded on demand
6. **Denormalized Counts** - Like/comment counts stored on Post model
7. **Connection Pooling** - Prisma connection pooling for database

## 💰 Cost Estimates

### Early Stage (1,000-5,000 users)

- Vercel: $0-20/month
- RDS PostgreSQL (db.t3.micro): $15-30/month
- ElastiCache Redis (cache.t3.micro): $15/month
- S3 + CloudFront: $5-20/month
- AWS Cognito: $0-5/month

**Total: ~$55-80/month**

### Growth Stage (50,000 users)

- Vercel: $20-150/month
- RDS PostgreSQL (db.t3.medium + replica): $100-200/month
- ElastiCache Redis: $50/month
- S3 + CloudFront: $100-200/month
- AWS Cognito: $25/month

**Total: ~$300-600/month**

### Scale Optimizations

- Implement read replicas for database
- Use Redis for feed precomputation
- Add CDN caching for API responses
- Consider edge functions for global performance
- Implement background job queues (SQS + Lambda)

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database
```

### Database Migrations

When you modify the schema:

```bash
# Create and apply migration
npm run db:migrate

# Or push changes without migration (dev only)
npm run db:push
```

### Adding New Features

1. Update Prisma schema if needed
2. Create/update API routes in `src/app/api/`
3. Create React components in `src/components/`
4. Create pages in `src/app/(app)/`
5. Add tests
6. Update documentation

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### AWS Amplify

1. Connect your Git repository
2. Configure build settings
3. Add environment variables
4. Deploy

### Environment Variables

Ensure all required environment variables are set in your deployment platform.

## 📈 Future Enhancements

- [ ] Real-time updates via WebSockets
- [ ] Advanced search and filtering
- [ ] Groups and communities
- [ ] Events and networking features
- [ ] Video calling integration
- [ ] Job board integration
- [ ] Recommendation algorithm for feed
- [ ] Mobile apps (React Native)
- [ ] Email notifications
- [ ] Content moderation tools
- [ ] Analytics dashboard
- [ ] Two-factor authentication

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🆘 Support

For issues or questions, please create an issue in the GitHub repository.

---

Built with ❤️ for professional African Americans
