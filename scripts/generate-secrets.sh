#!/bin/bash

# Script to generate secure secrets for Pashmiya

echo "=== Pashmiya Secrets Generator ==="
echo ""
echo "Copy these values to your .env files:"
echo ""

# Generate JWT Secret (32 bytes, base64)
JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate VAPID Keys (for push notifications)
# Note: In production, use web-push generate-vapid-keys
echo "VAPID Keys (generate using: npx web-push generate-vapid-keys)"
echo "VAPID_PUBLIC_KEY=YOUR_VAPID_PUBLIC_KEY"
echo "VAPID_PRIVATE_KEY=YOUR_VAPID_PRIVATE_KEY"
echo ""

# Generate Razorpay Webhook Secret
WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "RAZORPAY_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo ""

# Generate Session Secret
SESSION_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "SESSION_SECRET=$SESSION_SECRET"
echo ""

echo "=== Important Security Notes ==="
echo "1. NEVER commit .env files to git"
echo "2. Use different secrets for each environment (dev/staging/prod)"
echo "3. Rotate secrets periodically"
echo "4. Use a secrets manager in production (AWS Secrets Manager, HashiCorp Vault)"
