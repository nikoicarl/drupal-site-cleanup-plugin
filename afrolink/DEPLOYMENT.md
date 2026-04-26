# AfroLink — Deployment Guide (AWS)

## Architecture
```
Internet → CloudFront CDN → S3 (React build)
                         → EC2 (Node API) → RDS (PostgreSQL)
                                          → S3 (media uploads)
```

## 1. Database (RDS PostgreSQL)

1. Create an RDS PostgreSQL 15 instance in the AWS Console.
2. Set DB name to `afrolink`, note the endpoint URL.
3. Connect and run the migration:
```bash
psql -h <RDS_ENDPOINT> -U postgres -d afrolink -f database/migrations/001_schema.sql
```

## 2. S3 Buckets

Create two buckets:
- `afrolink-media` — user uploads (set public-read for media or use signed URLs)
- `afrolink-frontend` — React build output (static website hosting enabled)

## 3. Backend (EC2)

```bash
# On your EC2 instance (Ubuntu 24):
sudo apt update && sudo apt install -y nodejs npm git
git clone https://github.com/YOUR_ORG/afrolink.git
cd afrolink/backend
cp .env.example .env
# Fill in all .env values
npm install --production

# Run with PM2
npm install -g pm2
pm2 start src/server.js --name afrolink-api
pm2 save && pm2 startup
```

Configure your EC2 security group to allow inbound on port 5000 (or 443 via nginx).

**Nginx reverse proxy (recommended):**
```nginx
server {
    listen 80;
    server_name api.afrolink.ca;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 4. Frontend (S3 + CloudFront)

```bash
cd frontend
cp .env.example .env
# Set REACT_APP_API_URL=https://api.afrolink.ca/api
npm install
npm run build

# Upload to S3
aws s3 sync build/ s3://afrolink-frontend --delete
```

Create a CloudFront distribution pointing to the S3 bucket.
Set the default root object to `index.html`.
Add a custom error page: 404 → `/index.html` (for React Router).

## 5. Stripe Webhook

In Stripe Dashboard → Developers → Webhooks:
- Add endpoint: `https://api.afrolink.ca/api/payments/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Copy the signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`

## 6. Environment Checklist

- [ ] All `.env` values filled in on EC2
- [ ] `DB_SSL=true` for RDS connections
- [ ] `NODE_ENV=production`
- [ ] JWT secrets are long random strings (use `openssl rand -hex 64`)
- [ ] Stripe live keys (not test keys) for production
- [ ] S3 bucket CORS configured for your domain
- [ ] CloudFront HTTPS enabled with ACM certificate
