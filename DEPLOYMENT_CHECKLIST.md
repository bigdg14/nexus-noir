# Deployment Checklist

Complete checklist for deploying Professional Network to production.

## Pre-Deployment

### Code & Repository

- [ ] All code committed to Git
- [ ] `.env` file is in `.gitignore` (never commit secrets!)
- [ ] `.env.example` is up to date
- [ ] All TODO comments resolved or documented
- [ ] Code reviewed and tested
- [ ] No console.log statements in production code
- [ ] Package.json version updated

### Testing

- [ ] All tests passing (`npm test`)
- [ ] Manual testing of critical flows:
  - [ ] Sign up new user
  - [ ] Sign in existing user
  - [ ] Create post (text)
  - [ ] Create post with image
  - [ ] Like/unlike post
  - [ ] Comment on post
  - [ ] Send friend request
  - [ ] Accept friend request
  - [ ] Send direct message
  - [ ] View notifications
  - [ ] Update profile
  - [ ] Upload avatar
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive testing (iOS, Android)
- [ ] Performance testing (Lighthouse score >90)

### Documentation

- [ ] README.md is complete
- [ ] API_DOCUMENTATION.md is accurate
- [ ] SETUP_GUIDE.md tested with fresh setup
- [ ] Environment variables documented
- [ ] Deployment steps documented

---

## AWS Setup (Production)

### AWS Cognito

- [ ] Production User Pool created
- [ ] MFA configured (recommended)
- [ ] Password policy set (strong requirements)
- [ ] Account recovery configured
- [ ] Email verification enabled
- [ ] App client created with client secret
- [ ] Callback URLs configured
- [ ] Domain configured (optional)
- [ ] Credentials saved securely

**Environment Variables:**
```
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
COGNITO_REGION=
COGNITO_ISSUER=
```

### AWS S3

- [ ] Production bucket created
- [ ] Bucket name follows naming convention
- [ ] Region selected (same as other services)
- [ ] Versioning enabled (recommended)
- [ ] Server-side encryption enabled
- [ ] CORS configured with production domain
- [ ] Bucket policy configured
- [ ] Lifecycle rules set (optional, for old media cleanup)

**Environment Variables:**
```
S3_BUCKET_NAME=
S3_BUCKET_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### AWS CloudFront

- [ ] Distribution created for S3 bucket
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] Cache policy configured (CachingOptimized)
- [ ] Origin access control configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate configured (if custom domain)
- [ ] Distribution deployed (status: Deployed)

**Environment Variables:**
```
CLOUDFRONT_URL=https://xxxx.cloudfront.net
```

### AWS RDS (PostgreSQL)

- [ ] Production instance created
- [ ] Instance size appropriate for load (db.t3.small minimum)
- [ ] Multi-AZ deployment (recommended for HA)
- [ ] Automated backups enabled (7-day retention minimum)
- [ ] Backup window configured (off-peak hours)
- [ ] Maintenance window configured (off-peak hours)
- [ ] Security group configured (only app servers)
- [ ] Parameter group optimized
- [ ] Enhanced monitoring enabled (recommended)
- [ ] Connection pooling configured
- [ ] Database created
- [ ] Master password saved in secrets manager

**Environment Variables:**
```
DATABASE_URL=postgresql://username:password@host:5432/database
```

### AWS ElastiCache (Redis) - Optional but Recommended

- [ ] Redis cluster created
- [ ] Node type selected (cache.t3.micro minimum)
- [ ] Multi-AZ enabled (recommended)
- [ ] Automatic failover enabled
- [ ] Security group configured
- [ ] Parameter group configured
- [ ] Backup enabled

**Environment Variables:**
```
REDIS_URL=redis://host:6379
```

### AWS IAM

- [ ] Production IAM user created
- [ ] Minimal permissions policy attached (least privilege)
- [ ] Access keys generated
- [ ] Access keys stored securely (secrets manager)
- [ ] MFA enabled for IAM user (recommended)
- [ ] Old/unused access keys rotated

**Required Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

---

## Database Setup

### Migrations

- [ ] All migrations tested locally
- [ ] Migration rollback plan documented
- [ ] Database backed up before migration
- [ ] Migrations run on production:
  ```bash
  npm run db:migrate
  ```
- [ ] Database schema verified:
  ```bash
  npm run db:studio
  ```

### Indexes

- [ ] All indexes created (automatic with Prisma migrations)
- [ ] Query performance verified
- [ ] Explain plans checked for slow queries

### Data

- [ ] Seed data NOT run in production
- [ ] Test users created manually (if needed)
- [ ] Sample content created (optional)

---

## Application Configuration

### Environment Variables

- [ ] All production environment variables set
- [ ] NEXTAUTH_SECRET generated (strong, unique):
  ```bash
  openssl rand -base64 32
  ```
- [ ] NEXTAUTH_URL set to production domain
- [ ] NEXT_PUBLIC_APP_URL set to production domain
- [ ] No development URLs in production env
- [ ] All AWS credentials correct
- [ ] Database URL points to production RDS
- [ ] Redis URL points to production ElastiCache

**Complete .env for Production:**
```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<strong-random-secret>

# AWS Cognito
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
COGNITO_REGION=
COGNITO_ISSUER=

# AWS S3
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET_NAME=
S3_BUCKET_REGION=
CLOUDFRONT_URL=

# Redis
REDIS_URL=

# App Config
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_MAX_IMAGE_SIZE_MB=10
NEXT_PUBLIC_MAX_VIDEO_SIZE_MB=50
```

### Next.js Configuration

- [ ] Production build tested locally:
  ```bash
  npm run build
  npm run start
  ```
- [ ] No build errors or warnings
- [ ] Image optimization configured
- [ ] Analytics configured (optional)
- [ ] Error tracking configured (Sentry recommended)

---

## Vercel Deployment (Recommended)

### Initial Setup

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported to Vercel
- [ ] Production domain configured
- [ ] SSL certificate auto-provisioned

### Environment Variables

- [ ] All environment variables added in Vercel dashboard
- [ ] Variables set for Production environment
- [ ] Variables set for Preview environment (optional)
- [ ] Sensitive variables not logged

### Build Configuration

- [ ] Build command: `npm run build`
- [ ] Output directory: `.next`
- [ ] Install command: `npm install`
- [ ] Node.js version: 18.x or 20.x
- [ ] Framework preset: Next.js

### Database Connection

- [ ] Vercel allowed in RDS security group
- [ ] Connection pooling configured (Prisma)
- [ ] Connection limit appropriate for Vercel

### Deployment

- [ ] First deployment successful
- [ ] Site accessible at production URL
- [ ] All features working
- [ ] No console errors
- [ ] Performance acceptable (Lighthouse check)

---

## Alternative: AWS Amplify Deployment

### Initial Setup

- [ ] AWS Amplify app created
- [ ] Repository connected (GitHub, GitLab, etc.)
- [ ] Build settings configured
- [ ] Domain configured
- [ ] SSL certificate provisioned

### Build Specification

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install
    build:
      commands:
        - npx prisma generate
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Environment Variables

- [ ] All variables added in Amplify console
- [ ] Build-time variables configured
- [ ] Runtime variables configured

---

## Security Hardening

### Application Security

- [ ] Rate limiting implemented (middleware recommended)
- [ ] CORS configured properly (not *)
- [ ] Content Security Policy configured
- [ ] HTTP headers secured (Helmet.js or custom)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention verified (Prisma parameterized)
- [ ] XSS prevention verified (React escaping)
- [ ] CSRF protection enabled (NextAuth)

### AWS Security

- [ ] S3 bucket not public (unless intentional)
- [ ] RDS not publicly accessible (use VPN/bastion)
- [ ] Security groups follow least privilege
- [ ] Encryption at rest enabled (RDS, S3)
- [ ] Encryption in transit enabled (HTTPS, SSL)
- [ ] CloudWatch alarms configured
- [ ] AWS WAF configured (recommended)

### Authentication Security

- [ ] MFA enabled in Cognito
- [ ] Strong password requirements
- [ ] Account lockout after failed attempts
- [ ] Session timeout configured
- [ ] Secure cookie settings (httpOnly, secure, sameSite)

---

## Monitoring & Logging

### Application Monitoring

- [ ] Error tracking configured (Sentry, Rollbar, etc.)
- [ ] Performance monitoring enabled
- [ ] User analytics configured (PostHog, Mixpanel, etc.)
- [ ] Custom events tracked:
  - [ ] User signups
  - [ ] Post creation
  - [ ] Engagement (likes, comments)
  - [ ] Messages sent
  - [ ] Friend requests

### AWS Monitoring

- [ ] CloudWatch dashboards created
- [ ] CloudWatch alarms configured:
  - [ ] RDS CPU usage >80%
  - [ ] RDS storage >80%
  - [ ] RDS connection count
  - [ ] Lambda errors (if using)
  - [ ] S3 bucket size
- [ ] Log retention configured
- [ ] Billing alerts enabled

### Database Monitoring

- [ ] Slow query log enabled
- [ ] Connection count monitored
- [ ] Deadlock detection enabled
- [ ] Backup success monitored

---

## Performance Optimization

### Caching

- [ ] Redis caching enabled
- [ ] Feed caching working
- [ ] User profile caching working
- [ ] Cache invalidation working correctly
- [ ] CDN caching configured (CloudFront)

### Database

- [ ] Indexes verified with EXPLAIN
- [ ] Connection pooling configured
- [ ] Query optimization done
- [ ] N+1 queries eliminated

### Frontend

- [ ] Images optimized (Next.js Image)
- [ ] Code splitting working
- [ ] Lazy loading implemented
- [ ] Bundle size optimized (<500KB initial)

---

## Backup & Disaster Recovery

### Database Backups

- [ ] Automated RDS backups enabled (daily minimum)
- [ ] Backup retention period set (7 days minimum)
- [ ] Backup restoration tested
- [ ] Point-in-time recovery enabled
- [ ] Manual snapshots taken before major changes

### Application Backups

- [ ] Code in version control (Git)
- [ ] Environment variables documented
- [ ] Infrastructure as code (optional but recommended)

### Disaster Recovery Plan

- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined
- [ ] Runbook documented for common issues
- [ ] Emergency contacts documented
- [ ] Rollback procedure documented

---

## Post-Deployment

### Smoke Testing

- [ ] Homepage loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] Create post works
- [ ] Image upload works
- [ ] Feed loads
- [ ] Messaging works
- [ ] Notifications work
- [ ] All API endpoints responding

### Performance Testing

- [ ] Lighthouse score >90 (desktop)
- [ ] Lighthouse score >70 (mobile)
- [ ] Time to First Byte <200ms
- [ ] First Contentful Paint <1.5s
- [ ] Largest Contentful Paint <2.5s

### User Acceptance Testing

- [ ] Test users invited
- [ ] Feedback collected
- [ ] Critical bugs fixed
- [ ] User flows validated

### DNS & Domain

- [ ] Domain purchased
- [ ] DNS configured
- [ ] SSL certificate validated
- [ ] HTTPS enforced
- [ ] www redirect configured (if applicable)

---

## Ongoing Maintenance

### Weekly

- [ ] Review error logs
- [ ] Check CloudWatch alarms
- [ ] Monitor user feedback
- [ ] Review performance metrics

### Monthly

- [ ] Review AWS costs
- [ ] Check security alerts
- [ ] Update dependencies (patch versions)
- [ ] Review and optimize queries
- [ ] Check disk space usage
- [ ] Rotate access keys (if not using roles)

### Quarterly

- [ ] Update major dependencies
- [ ] Review and update documentation
- [ ] Disaster recovery drill
- [ ] Security audit
- [ ] Performance optimization review

---

## Launch Checklist

### Pre-Launch (1 week before)

- [ ] All above items completed
- [ ] Beta testing completed
- [ ] Known issues documented
- [ ] Support plan in place
- [ ] Marketing materials ready

### Launch Day

- [ ] Final deployment to production
- [ ] DNS updated (if changing)
- [ ] Monitoring dashboard open
- [ ] Support team on standby
- [ ] Announcement sent

### Post-Launch (First 24 hours)

- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Monitor user signups
- [ ] Respond to support requests
- [ ] Fix critical bugs immediately

### Post-Launch (First week)

- [ ] Collect user feedback
- [ ] Analyze usage patterns
- [ ] Optimize based on real data
- [ ] Plan next iteration

---

## Rollback Plan

If critical issues occur:

1. **Immediate Actions:**
   - [ ] Stop new deployments
   - [ ] Assess severity of issue
   - [ ] Notify team

2. **Rollback Steps:**
   - [ ] Revert to previous deployment (Vercel: instant rollback)
   - [ ] Verify rollback successful
   - [ ] Communicate with users

3. **Post-Incident:**
   - [ ] Document issue
   - [ ] Root cause analysis
   - [ ] Implement fix
   - [ ] Add tests to prevent recurrence

---

## Success Criteria

### Technical

- ✅ Uptime >99.9%
- ✅ Average response time <500ms
- ✅ Error rate <0.1%
- ✅ Zero critical security vulnerabilities

### Business

- ✅ User signups working
- ✅ User engagement metrics tracking
- ✅ Infrastructure costs within budget
- ✅ Positive user feedback

---

## Resources

- [Vercel Deployment Docs](https://vercel.com/docs)
- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

**Remember:** Always test in a staging environment before deploying to production!
