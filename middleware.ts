/**
 * Clerk Middleware Configuration
 *
 * This middleware protects routes that require authentication.
 *
 * Setup Instructions:
 * 1. Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to your .env.local
 * 2. Configure publicRoutes array to specify which routes are publicly accessible
 * 3. Configure ignoredRoutes for static assets and API routes that should skip auth
 *
 * Learn more: https://clerk.com/docs/references/nextjs/clerk-middleware
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/leaders',
  '/features',
  '/testimonials',
  '/faq',
  '/api/webhooks(.*)',
]);

// Define routes that should be completely ignored by Clerk
const isIgnoredRoute = createRouteMatcher([
  '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Skip auth check for ignored routes
  if (isIgnoredRoute(request)) {
    return;
  }

  // Protect all routes that are not public
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};