# Pashmiya - Full Stack

A full-stack e-commerce solution for Kashmiri Pashmina shawls.

## Prerequisites

- **Node.js** 18+
- **Go** 1.21+
- **PostgreSQL** 14+

## Quick Start

### 1. Setup Database

```bash
# Create PostgreSQL database
createdb pashmina
```

### 2. Start All Services

```bash
# Make script executable (first time only)
chmod +x start.sh

# Run all services
./start.sh
```

This starts:
- **Frontend**: http://localhost:3000
- **CMS**: http://localhost:3001
- **Backend API**: http://localhost:8080

## Manual Start (if needed)

### Backend
```bash
cd backend
go run main.go
```

### CMS
```bash
cd cms
npm run dev
```

### Frontend
```bash
cd frontend
npm run dev
```

## Environment Variables

### Backend (.env)
```
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=pashmina
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

## Features

- **Frontend**: Next.js 14 e-commerce with product catalog, cart, checkout
- **Backend**: Go/Gin REST API with PostgreSQL
- **CMS**: Custom admin panel for managing products, orders, content
