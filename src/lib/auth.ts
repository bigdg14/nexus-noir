import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";
import { verifyPassword } from "./auth/password";
import { checkRateLimit, recordLoginAttempt, clearLoginAttempts } from "./auth/rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // Production Credentials Provider
    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // Get client IP for rate limiting
        const clientIp = (req as any)?.headers?.["x-forwarded-for"] ||
                        (req as any)?.headers?.["x-real-ip"] ||
                        credentials.email;

        // Check rate limit
        const rateLimitCheck = await checkRateLimit(clientIp);
        if (!rateLimitCheck.allowed) {
          throw new Error(`Too many login attempts. Please try again in ${Math.ceil(rateLimitCheck.retryAfter! / 60)} minutes.`);
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() }
        });

        if (!user || !user.password) {
          // Record failed attempt
          await recordLoginAttempt(clientIp, false);
          throw new Error("Invalid email or password");
        }

        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error("Please verify your email before signing in");
        }

        // Verify password
        const isValidPassword = await verifyPassword(credentials.password, user.password);

        if (!isValidPassword) {
          // Record failed attempt
          await recordLoginAttempt(clientIp, false);
          throw new Error("Invalid email or password");
        }

        // Clear login attempts on successful login
        await clearLoginAttempts(clientIp);
        await recordLoginAttempt(clientIp, true);

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
        };
      }
    }),

    // Development Login Provider (no password required)
    ...(process.env.NODE_ENV === "development" ? [{
      id: "dev-login",
      name: "Dev Login (No Password)",
      type: "credentials" as const,
      credentials: {
        email: { label: "Email", type: "email", placeholder: "your@email.com" },
      },
      async authorize(credentials: any) {
        if (!credentials?.email) {
          return null;
        }

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
        };
      },
    } as any] : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in
      if (account?.provider === "google") {
        if (!user.email) {
          return false;
        }

        // Check if user exists
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() }
        });

        if (!dbUser) {
          // Create new user from OAuth
          const username = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_');

          // Ensure username is unique
          let finalUsername = username;
          let counter = 1;
          while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
            finalUsername = `${username}${counter}`;
            counter++;
          }

          dbUser = await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              username: finalUsername,
              displayName: user.name || user.email.split('@')[0],
              avatar: user.image || null,
              emailVerified: true, // OAuth emails are pre-verified
              password: null, // No password for OAuth users
            }
          });
        } else if (!dbUser.emailVerified) {
          // Update email verified status for OAuth login
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { emailVerified: true }
          });
        }

        // Store or update OAuth account
        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          }
        });

        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | null
            }
          });
        } else {
          // Update existing account tokens
          await prisma.account.update({
            where: { id: existingAccount.id },
            data: {
              refresh_token: account.refresh_token,
              access_token: account.access_token,
              expires_at: account.expires_at,
              id_token: account.id_token,
              session_state: account.session_state as string | null
            }
          });
        }

        // Update user ID for session
        user.id = dbUser.id;
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            email: true,
            emailVerified: true,
          },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.username = dbUser.username;
          session.user.displayName = dbUser.displayName;
          session.user.avatar = dbUser.avatar;
          (session.user as any).emailVerified = dbUser.emailVerified;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true, // Required for Vercel deployment
};
