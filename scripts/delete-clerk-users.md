# Delete All Users from Clerk

Since Clerk doesn't provide a bulk delete API in development, you need to delete users manually through the Clerk Dashboard.

## Option 1: Clerk Dashboard (Recommended)

1. Go to https://dashboard.clerk.com/
2. Select your application
3. Go to **Users** in the sidebar
4. For each user:
   - Click on the user
   - Click the three dots menu (⋮) in the top right
   - Select **Delete user**
   - Confirm the deletion

## Option 2: Use Clerk API (If you have the secret key)

If you want to automate this, you can use the Clerk Backend API with your `CLERK_SECRET_KEY`.

```bash
# Get all users
curl -X GET https://api.clerk.com/v1/users \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY"

# Delete a specific user
curl -X DELETE https://api.clerk.com/v1/users/USER_ID \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY"
```

## Option 3: Clear Your Browser Session (Quick Fix)

Instead of deleting the Clerk user, you can just clear your browser session:

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Application** tab
3. Click **Cookies** → **http://localhost:3000**
4. Delete all cookies (especially `__session` and `__clerk_db_jwt`)
5. Refresh the page

OR just use an **Incognito/Private window** to test sign-up flow.

## Recommended Approach

For development, I recommend:
1. **Keep the Clerk user** - Don't delete it
2. **Clear browser cookies** to test sign-in flow
3. **Use incognito windows** for testing fresh sign-ups
