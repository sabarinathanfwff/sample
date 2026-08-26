# Architecture Overview — AI-Powered Food Delivery Platform

This document describes the system architecture, component relationships, data
flow, and the rationale behind key technology choices.

---

## 1. System Architecture Overview

The platform is a full-stack web application composed of three deployable tiers:

1. **Frontend** — A React single-page application (SPA) served statically by
   Nginx. It communicates with the backend exclusively over HTTP(S) REST APIs.
2. **Backend** — A Node.js / Express API server that implements business logic,
   authentication, payments, AI recommendations, and chatbot features.
3. **Data & Infrastructure** — PostgreSQL (primary store), Redis (cache/sessions
   /queue broker), S3 (image storage), and the AWS networking/compute layer.

The application is containerized with Docker and deployable both locally
(`docker-compose`) and on AWS (CloudFormation + EC2 + RDS + S3).

---

## 2. Component Diagram (Text-Based)

```
                            ┌──────────────────────────────────────┐
                            │              Clients                 │
                            │  Web Browser / Mobile Web (React)    │
                            └───────────────┬──────────────────────┘
                                            │ HTTPS (port 443/80)
                                            ▼
                            ┌──────────────────────────────────────┐
                            │   Nginx (Frontend Container :80)      │
                            │   - Serves SPA assets                │
                            │   - Proxies /api/* -> backend        │
                            └───────────────┬──────────────────────┘
                                            │ HTTP (port 5000)
                                            ▼
                            ┌──────────────────────────────────────┐
                            │     Node.js / Express (Backend)      │
                            │   Auth · Orders · Payments · AI ·     │
                            │        Chatbot · Notifications        │
                            └───┬───────────┬───────────┬─────────┘
                                │           │           │
                   ┌────────────▼──┐  ┌─────▼──────┐  ┌─▼──────────┐
                   │  PostgreSQL   │  │   Redis    │  │    AWS     │
                   │  (RDS / 14)   │  │ (cache/    │  │  S3 (img)  │
                   │ users,orders, │  │  sessions, │  │  CloudWatch│
                   │ restaurants,  │  │  queues)   │  │  Secrets   │
                   │ menu, reviews)│  └────────────┘  └────────────┘
                   └───────────────┘
```

### AWS Deployment Topology

```
                 Internet
                     │
                     ▼
            ┌────────────────────┐
            │  Internet Gateway  │
            └─────────┬──────────┘
                      ▼
            ┌────────────────────┐
            │  Public Route Table│
            └─────────┬──────────┘
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌───────────────┐           ┌───────────────┐
│ Public Subnet │           │ Public Subnet │
│      AZ 1     │           │      AZ 2     │
│  EC2 t3.micro │           │  RDS Subnet   │
│ (Docker: FE+BE)│          │  (RDS PG 14)  │
└───────┬───────┘           └───────┬───────┘
        │                           │
        │  IAM Role (S3+CloudWatch) │
        ▼                           ▼
   ┌─────────┐              ┌─────────────────┐
   │  S3     │              │ CloudWatch Logs │
   │ (images)│              │ + Alarms        │
   └─────────┘              └─────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 User Registration & Login
```
Browser ──POST /api/auth/register──▶ Backend
                                        │ validate
                                        ▼ hash password (bcrypt)
                                        ▼ INSERT users (uuid-ossp)
                                        ▼ issue JWT
Backend ──200 + JWT────────────────────▶ Browser (store token)
```
Subsequent requests carry `Authorization: Bearer <JWT>`, validated by the
backend middleware on protected routes.

### 3.2 Placing an Order
```
Browser ──POST /api/orders──▶ Backend
                               │ verify JWT
                               │ validate cart_items + menu_items
                               │ compute subtotal/fee/tax/total
                               │ INSERT orders (trigger sets order_number)
                               │ INSERT order_items
                               │ create payment (status=pending)
                               ▼ Stripe charge
                          payment_status=completed
                               ▼ publish event -> Redis queue
                          notify restaurant + customer
Browser ◀──201 Order Created────────── Backend
```

### 3.3 AI Recommendation Flow
```
Browser ──GET /api/recommendations──▶ Backend
                                       │ lookup ai_recommendations
                                       │ (type: collaborative/content_based/trending)
                                       ▼ if stale / empty -> call AI model
                                       ▼ score menu_items -> persist
Browser ◀──200 recommendations───────── Backend

Chatbot:
Browser ──POST /api/chatbot──▶ Backend ──▶ LLM (OpenAI)
                                       ▼ log intent/confidence
                                         INSERT chatbot_conversations
```

### 3.4 Image Upload Flow
```
Restaurant Owner ──POST /api/images (multipart)──▶ Backend
                                                     │ validate + resize
                                                     ▼ upload to S3 (presigned)
                                                     ▼ update image_url column
Browser ◀──200 image URL────────────────────────── Backend
```
S3 bucket is private; access is via presigned URLs or CloudFront.

---

## 4. Technology Choices & Rationale

| Area | Choice | Rationale |
|------|--------|-----------|
| **Frontend** | React + Vite/Nginx | Component model, fast HMR builds, static serving via Nginx is cheap and scalable; SPA reduces server render load. |
| **Backend** | Node.js + Express | Non-blocking I/O suits many concurrent HTTP/WebSocket connections (chatbot, live order tracking). Large ecosystem (Stripe, OpenAI, PG clients). |
| **Database** | PostgreSQL 14 | ACID transactions for orders/payments, rich types (UUID, enums, arrays, JSONB), powerful indexing, and extensions (uuid-ossp, pgcrypto). |
| **Cache / Queue** | Redis 7 | Sub-millisecond caching of recommendations/menus, session store, and lightweight job queue for notifications. |
| **Containerization** | Docker + Compose | Consistent dev/prod parity; multi-stage builds keep images small (Alpine). |
| **Orchestration (AWS)** | EC2 + Docker Compose | Simple, cost-effective single-host deployment for a t3.micro; easy to migrate to ECS/EKS later. |
| **Managed DB** | RDS PostgreSQL | Automated backups, patching, Multi-AZ, performance insights — reduces operational burden. |
| **Object Storage** | S3 | Durable, infinite-scale image storage with lifecycle/retention policies; decouples media from compute. |
| **IaC** | CloudFormation | Fully declarative infra; version-controlled, repeatable environments. |
| **Observability** | CloudWatch + Agent | Native AWS integration for logs/metrics/alarms; no extra agents to manage. |
| **Auth** | JWT + bcrypt | Stateless auth scales horizontally; bcrypt with cost factor 12 resists brute force. |

---

## 5. Database Schema Highlights

The schema (`database/schema.sql`) models the core domain:

- **users** — customers, restaurant owners, admins (role enum).
- **restaurants** — profile, location (lat/long), hours, ratings, delivery metadata.
- **menu_items** — dishes with dietary flags, spice level, pricing.
- **orders / order_items / cart_items** — order lifecycle with triggers generating `order_number`.
- **payments** — gateway responses stored as JSONB.
- **reviews** — trigger maintains aggregated restaurant rating.
- **ai_recommendations / chatbot_conversations** — AI feature persistence.
- **notifications / audit_logs** — engagement and security trails.

Triggers keep `updated_at` fresh and roll up ratings; views
(`restaurant_analytics`, `popular_items`) power dashboards.

---

## 6. Security Posture

- Secrets are injected via environment variables / AWS Secrets Manager — never
  committed (see `.gitignore`, `.env.example`).
- RDS is **not** publicly accessible; reachable only from the EC2 security
  group.
- S3 blocks all public access; served via presigned URLs.
- EC2 IAM role follows least privilege (S3 prefix + CloudWatch only).
- Nginx adds security headers; backend enforces CORS and JWT on protected routes.
