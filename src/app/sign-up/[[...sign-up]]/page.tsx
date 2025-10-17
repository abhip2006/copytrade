/**
 * Sign Up Page
 * Uses Clerk's pre-built sign-up component
 *
 * CLERK DASHBOARD CONFIGURATION:
 * 1. Go to Clerk Dashboard (https://dashboard.clerk.com)
 * 2. Select your application
 * 3. Navigate to "User & Authentication" → "Personal information"
 *    - Set First name and Last name to "Required"
 *    - Enable Username field
 * 4. Navigate to "User & Authentication" → "Email, Phone, Username"
 *    - Enable "Username" as a sign-up field
 *    - Enable "Email address or username" for sign-in
 *    - Enable "Password" as authentication method
 *
 * This configuration allows users to:
 * - Sign up with email + password (and optional username)
 * - Sign in with either email or username + password
 */

'use client';

import { SignUp, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function Page() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  if (isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-2xl text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Signed In</h2>
          <p className="text-gray-600 mb-6">
            You're currently logged in as <span className="font-semibold">{user?.emailAddresses[0]?.emailAddress}</span>
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/')}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg"
          }
        }}
      />
    </div>
  );
}
