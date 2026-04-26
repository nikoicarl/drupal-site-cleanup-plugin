# AfroLink — Community Marketplace Platform

A community-based online marketplace for African products, food, and cultural resources. Supports **Customers**, **Vendors**, and **Delivery Vendors** with a built-in community hub.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Bootstrap 5 |
| Backend | Node.js + Express (MVC) |
| Database | PostgreSQL 15+ |
| Auth | JWT + bcrypt |
| Payments | Stripe |
| Storage | AWS S3 |
| Hosting | AWS (EC2 + RDS + CloudFront) |

---

## Project Structure

```
afrolink/
├── backend/          # Node.js + Express API
│   └── src/
│       ├── config/       # DB, env, stripe config
│       ├── controllers/  # Route handlers
│       ├── middleware/   # Auth, validation, error handling
│       ├── models/       # Database queries (pg)
│       ├── routes/       # Express routers
│       ├── services/     # Business logic
│       └── utils/        # Helpers
├── frontend/         # React SPA
│   └── src/
│       ├── components/   # Reusable UI components
│       ├── pages/        # Route-level page components
│       ├── hooks/        # Custom React hooks
│       ├── context/      # Auth, Cart, Notification contexts
│       ├── services/     # Axios API service layer
│       └── utils/        # Formatters, constants
└── database/
    └── migrations/   # PostgreSQL schema files
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Stripe account
- AWS account (for S3 storage)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_ORG/afrolink.git
cd afrolink
```

### 2. Database setup
```bash
psql -U postgres -c "CREATE DATABASE afrolink;"
psql -U postgres -d afrolink -f database/migrations/001_schema.sql
```

### 3. Backend setup
```bash
cd backend
cp .env.example .env
# Fill in your credentials in .env
npm install
npm run dev
```

### 4. Frontend setup
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

---

## User Roles

| Role | Description |
|---|---|
| `customer` | Browse, order, track, review |
| `vendor` | List products, fulfill orders, receive payments |
| `driver` | Accept and complete deliveries |
| `moderator` | Community moderation |
| `admin` | Oversee operations and listings |
| `super_admin` | Full platform access |

---

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout

GET    /api/products
POST   /api/products          (vendor)
PATCH  /api/products/:id      (vendor)

POST   /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status

GET    /api/deliveries/jobs   (driver)
PATCH  /api/deliveries/:id/accept

POST   /api/payments/intent
POST   /api/payments/webhook

GET    /api/community/posts
POST   /api/community/posts
GET    /api/community/recipes
```

Full API documentation lives in `backend/API.md`.

---

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for required values.

---

## Deployment

See `DEPLOYMENT.md` for full AWS deployment guide (EC2, RDS, S3, CloudFront).

---

## License

Proprietary — AfroLink / Humu Fadil Gariba. All rights reserved.
