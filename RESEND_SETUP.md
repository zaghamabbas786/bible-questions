# Resend Welcome Email Setup Guide

## Overview
Welcome emails are automatically sent to new users when they sign up via Clerk webhooks.

## Setup Steps

### 1. Create Resend Account
1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email

### 2. Get Resend API Key
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Give it a name (e.g., "Bible Questions Production")
4. Copy the API key (starts with `re_`)

### 3. Verify Your Domain (Required for Production)
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Add your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides to your domain
5. Wait for verification (usually a few minutes)

**Note:** For testing, you can use Resend's test domain, but you'll need to verify your own domain for production.

### 4. Set Up Clerk Webhook
1. Go to https://dashboard.clerk.com
2. Select your application
3. Go to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter your webhook URL:
   - Production: `https://yourdomain.com/api/webhooks/clerk`
   - Development: Use a tool like ngrok to expose localhost
6. Select the event: **`user.created`**
7. Click **Create**
8. Copy the **Signing Secret** (starts with `whsec_`)

### 5. Add Environment Variables

Add these to your `.env.local` (for development) and Vercel (for production):

```env
# Resend Email Service
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=welcome@yourdomain.com  # Must be verified domain

# Clerk Webhook Secret
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 6. Test the Integration

1. **Test locally with ngrok:**
   ```bash
   # Install ngrok: https://ngrok.com
   ngrok http 3000
   # Use the ngrok URL in Clerk webhook settings
   ```

2. **Create a test user:**
   - Sign up a new user in your app
   - Check your email inbox
   - You should receive the welcome email

3. **Check logs:**
   - Check Vercel function logs for any errors
   - Check Resend dashboard for email delivery status

## Email Template

The welcome email matches your app's theme:
- **Colors**: Gold (#C5A059), Clay (#8D7B68), Ink (#2C2C2C)
- **Fonts**: Cinzel (heading), Merriweather (body), Inter (buttons)
- **Style**: Minimalist, scholarly, reverent

## Troubleshooting

### Email not sending?
1. Check `RESEND_API_KEY` is set correctly
2. Check `RESEND_FROM_EMAIL` is a verified domain
3. Check Clerk webhook is configured correctly
4. Check `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
5. Check Vercel function logs for errors

### Webhook not receiving events?
1. Verify webhook URL is correct in Clerk dashboard
2. Check webhook is enabled
3. Verify `user.created` event is selected
4. Check middleware allows `/api/webhooks/clerk`

### Email in spam?
1. Verify your domain with Resend
2. Set up SPF/DKIM records
3. Use a professional from email address

## Production Checklist

- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] API key added to environment variables
- [ ] From email set (must be verified domain)
- [ ] Clerk webhook created
- [ ] Webhook secret added to environment variables
- [ ] Test user created and email received
- [ ] Check email renders correctly in different clients


