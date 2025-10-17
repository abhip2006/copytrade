/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to Supabase on user.created event
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Clerk webhook event types
type ClerkWebhookEvent = {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{
      id: string;
      email_address: string;
      verification?: { status: string };
    }>;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    created_at?: number;
  };
};

export async function POST(request: NextRequest) {
  // Get webhook secret from environment
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json(
      { success: false, error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  // Get Svix headers for verification
  const headerPayload = await headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('Missing Svix headers');
    return NextResponse.json(
      { success: false, error: 'Missing webhook headers' },
      { status: 400 }
    );
  }

  // Get request body
  const body = await request.text();

  // Verify webhook signature
  const webhook = new Webhook(webhookSecret);
  let event: ClerkWebhookEvent;

  try {
    event = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEvent;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid webhook signature' },
      { status: 400 }
    );
  }

  // Handle different event types
  const { type, data } = event;

  console.log(`[WEBHOOK] Received ${type} event for user ${data.id}`);

  switch (type) {
    case 'user.created':
      return await handleUserCreated(data);

    case 'user.updated':
      return await handleUserUpdated(data);

    case 'user.deleted':
      return await handleUserDeleted(data);

    default:
      console.log(`[WEBHOOK] Unhandled event type: ${type}`);
      return NextResponse.json({ success: true, message: 'Event ignored' });
  }
}

/**
 * Handle user.created event
 * Creates user record in Supabase
 */
async function handleUserCreated(data: ClerkWebhookEvent['data']) {
  try {
    const supabase = await createClient();

    // Extract email (use primary or first verified email)
    const primaryEmail = data.email_addresses?.find(
      (email) => email.verification?.status === 'verified'
    );
    const email = primaryEmail?.email_address || data.email_addresses?.[0]?.email_address;

    if (!email) {
      console.error('No email found for user');
      return NextResponse.json(
        { success: false, error: 'No email found' },
        { status: 400 }
      );
    }

    // Create user in Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        clerk_user_id: data.id,
        email,
        username: data.username || null,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,

        role: 'follower', // Default role

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Check if user already exists (conflict)
      if (error.code === '23505') {
        console.log(`[WEBHOOK] User ${data.id} already exists`);
        return NextResponse.json({
          success: true,
          message: 'User already exists',
        });
      }

      console.error('Error creating user:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`[WEBHOOK] User created successfully:`, newUser);

    return NextResponse.json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    console.error('Error in handleUserCreated:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle user.updated event
 * Updates user record in Supabase
 */
async function handleUserUpdated(data: ClerkWebhookEvent['data']) {
  try {
    const supabase = await createClient();

    // Extract email
    const primaryEmail = data.email_addresses?.find(
      (email) => email.verification?.status === 'verified'
    );
    const email = primaryEmail?.email_address || data.email_addresses?.[0]?.email_address;

    // Update user in Supabase
    const { error } = await supabase
      .from('users')
      .update({
        email: email || undefined,
        username: data.username || undefined,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,

        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', data.id);

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`[WEBHOOK] User ${data.id} updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'User updated',
    });
  } catch (error) {
    console.error('Error in handleUserUpdated:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle user.deleted event
 * Soft deletes user in Supabase
 */
async function handleUserDeleted(data: ClerkWebhookEvent['data']) {
  try {
    const supabase = await createClient();

    // Soft delete - mark as deleted instead of removing
    const { error } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', data.id);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    console.log(`[WEBHOOK] User ${data.id} deleted successfully`);

    return NextResponse.json({
      success: true,
      message: 'User deleted',
    });
  } catch (error) {
    console.error('Error in handleUserDeleted:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
