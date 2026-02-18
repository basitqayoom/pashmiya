# Payment & Delivery Integration Setup Guide

## Overview
This guide covers the setup of **Razorpay** (Payment Gateway) and **Shiprocket** (Shipping) integration for the Pashmiya e-commerce platform.

---

## ✅ What Has Been Implemented

### Backend (Go/Gin)
1. **Database Models Updated**:
   - `Order` model extended with payment and shipping fields
   - New `PaymentTransaction` model for tracking payments
   - New `ShippingRate` model for caching shipping quotes
   - New `ShippingZone` model for shipping rules

2. **Razorpay Integration** (`/backend/services/payment.go`):
   - Create payment orders
   - Verify payment signatures
   - Process refunds
   - Handle webhooks
   - Multi-currency support

3. **Shiprocket Integration** (`/backend/services/shipping.go`):
   - Calculate shipping rates
   - Generate shipping labels
   - Track shipments
   - Cancel orders
   - Manage pickup locations

4. **API Endpoints** (`/backend/handlers/payment.go`):
   - `POST /api/payments/create-intent` - Create Razorpay order
   - `POST /api/payments/verify` - Verify payment
   - `GET /api/payments/:paymentId/status` - Check payment status
   - `POST /api/payments/refund` - Process refunds
   - `POST /api/webhooks/razorpay` - Handle webhooks
   - `GET /api/shipping/calculate-rates` - Get shipping quotes
   - `GET /api/shipping/track/:awb` - Track shipments
   - `POST /api/orders/:id/ship` - Generate shipping label
   - `GET /api/orders/:id/tracking` - Get order tracking
   - `POST /api/orders/:id/cancel` - Cancel order
   - `GET /api/orders/user/:userId` - Get user orders
   - `GET /api/orders` - Get all orders (admin)

### Frontend (Next.js)
1. **Updated Checkout Page** (`/frontend/src/app/checkout/page.tsx`):
   - Razorpay checkout integration
   - Dynamic shipping rate calculation
   - Address validation
   - Payment verification

2. **Updated Success Page** (`/frontend/src/app/checkout/success/page.tsx`):
   - Shows payment confirmation
   - Order details
   - Tracking information

3. **API Library** (`/frontend/src/lib/api.ts`):
   - Added payment functions
   - Added shipping functions
   - Added order management functions

4. **Styling** (`/frontend/src/app/checkout/checkout.module.css`):
   - Shipping method selection UI
   - Payment section styling

---

## 🔧 Required Environment Variables

### Backend (`/backend/.env`)
```bash
# Database (existing)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=pashmina

# Razorpay (required)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Shiprocket (optional - defaults will be used if not set)
SHIPROCKET_EMAIL=your@email.com
SHIPROCKET_PASSWORD=your_password
SHIPROCKET_PICKUP_LOCATION=default

# Pickup PIN code for shipping calculations
PICKUP_PIN=110001
```

### Frontend (`/frontend/.env.local`)
```bash
# API URL (existing)
NEXT_PUBLIC_API_URL=http://localhost:8080/api

# Razorpay (required)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# Pickup PIN for shipping
NEXT_PUBLIC_PICKUP_PIN=110001
```

---

## 📋 Setup Steps

### 1. Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account (or login)
3. Get Test Keys:
   - Go to Settings → API Keys
   - Generate/View Key ID and Key Secret
   - Note these down for environment variables

### 2. Create Shiprocket Account (Optional)
1. Go to [Shiprocket](https://www.shiprocket.in/)
2. Sign up for an account
3. Complete KYC verification
4. Get API credentials from Settings → API

### 3. Configure Environment Variables
1. Copy the environment variables above
2. Update `/backend/.env` with your keys
3. Update `/frontend/.env.local` with your keys

### 4. Install Dependencies
```bash
# Backend (already done - razorpay-go installed)
cd backend
go mod tidy

# Frontend
cd frontend
npm install
```

### 5. Run Database Migrations
The models will auto-migrate when the backend starts, but you can manually verify:
```bash
cd backend
go run main.go
```

### 6. Start the Application
```bash
# Start all services
./start.sh

# Or individually:
# Backend
cd backend && go run main.go

# Frontend
cd frontend && npm run dev
```

---

## 🧪 Testing the Integration

### Test Payment Flow
1. Add items to cart
2. Go to checkout
3. Fill in shipping address
4. Select shipping method
5. Click "Pay" button
6. Use Razorpay test card:
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: Any 3 digits
   - OTP: `123456`

### Test Webhook
1. Use ngrok to expose local server:
   ```bash
   ngrok http 8080
   ```
2. Add webhook URL in Razorpay Dashboard:
   - URL: `https://your-ngrok-url/api/webhooks/razorpay`
   - Secret: Same as RAZORPAY_WEBHOOK_SECRET
   - Events: `payment.captured`, `payment.failed`

---

## 📊 Order Status Workflow

```
Order Placed
    ↓
Pending Payment
    ↓ (Razorpay Success)
Paid
    ↓ (Generate Label)
Processing
    ↓ (Shipped)
Shipped
    ↓ (Delivered)
Delivered
```

**Cancel/Refund Flow**:
```
Any Status (except Shipped/Delivered)
    ↓
Cancel Order
    ↓ (If Paid)
Refund Initiated
    ↓
Refunded
```

---

## 🛡️ Security Considerations

1. **Never commit API keys** - Use environment variables
2. **Verify webhooks** - Always validate signatures
3. **Use HTTPS in production** - Razorpay requires it
4. **Store minimal data** - Only store necessary payment info
5. **PCI Compliance** - Razorpay handles PCI compliance

---

## 🐛 Troubleshooting

### Common Issues

**1. "Razorpay client not initialized"**
- Check environment variables are set
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

**2. "Payment service not available"**
- Check frontend `.env.local` has `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- Verify Razorpay script loaded (check browser console)

**3. Shipping rates not loading**
- If Shiprocket not configured, default rates are shown
- Check `NEXT_PUBLIC_PICKUP_PIN` is set

**4. Webhook not working**
- Use ngrok for local testing
- Verify webhook secret matches
- Check endpoint URL is correct

### Debug Mode
Enable debug logging in backend:
```go
// In services/payment.go
fmt.Printf("Razorpay Order Created: %+v\n", order)
```

---

## 📈 Next Steps

1. **Order Tracking Page** - Create `/orders/[id]` page for customers to track
2. **Admin Dashboard** - Add order management in CMS
3. **Email Notifications** - Send confirmation emails on order/payment
4. **Invoice Generation** - Generate PDF invoices
5. **Analytics** - Track conversion rates, failed payments

---

## 📞 Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Shiprocket Docs**: https://apidocs.shiprocket.in/
- **Razorpay Test Cards**: https://razorpay.com/docs/payments/payments/test-card-upi-details/

---

## ✅ Implementation Status

- ✅ Database Models
- ✅ Razorpay Backend Service
- ✅ Shiprocket Backend Service
- ✅ Payment Handlers
- ✅ Shipping Handlers
- ✅ Order Management
- ✅ Frontend Checkout
- ✅ Frontend Success Page
- ✅ API Integration
- ⏳ Order Tracking Page
- ⏳ Admin Dashboard
- ⏳ Email Notifications