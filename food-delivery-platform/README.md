# AI-Powered Food Delivery Platform on AWS

A full-stack food delivery platform (Zomato/Swiggy-style) with AI recommendations, AWS cloud deployment, and comprehensive monitoring. Built for software engineering, cloud, and AI roles.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, HTML5, CSS3, JavaScript ES6+ |
| Backend | Node.js, Express.js, JWT |
| Database | PostgreSQL 14 |
| Cloud | AWS EC2, RDS, S3, IAM, VPC, CloudWatch |
| DevOps | Docker, Docker Compose, GitHub Actions |
| AI | OpenAI API (recommendations + chatbot) |

## Features

- User authentication & role-based access (Customer, Restaurant Owner, Admin)
- Restaurant listing with search, filters, and pagination
- Menu management for restaurants
- Cart and order management with real-time status tracking
- Payment simulation
- AI-powered food recommendations
- AI chatbot for restaurant and order queries
- Admin dashboard with analytics
- AWS cloud deployment with auto-scaling
- Database backup and monitoring via CloudWatch
- Containerized with Docker

## Project Structure

```
food-delivery-platform/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── models/            # Data models
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── utils/             # Helper functions, AI service
│   │   └── config/            # Database, environment config
│   ├── tests/                 # Backend tests
│   └── Dockerfile
├── frontend/                   # React application
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── services/          # API service layer
│   │   ├── context/           # React context (auth, cart)
│   │   ├── hooks/             # Custom React hooks
│   │   └── styles/            # Global styles
│   └── Dockerfile
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── aws/
│   ├── cloudformation/
│   │   └── template.yaml      # Infrastructure as Code
│   ├── scripts/
│   │   ├── deploy.sh          # Deployment script
│   │   ├── setup-rds.sh       # RDS initialization
│   │   └── backup-db.sh       # Database backup
│   └── monitoring/
│       └── cloudwatch-config.json
├── database/
│   └── schema.sql             # PostgreSQL schema + seed data
├── docs/
│   ├── ARCHITECTURE.md
│   ├── AWS_DEPLOYMENT.md
│   └── API_DOCUMENTATION.md
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose
- AWS CLI (for deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/food-delivery-platform.git
cd food-delivery-platform

# Start with Docker Compose
docker-compose up --build

# Or run manually:
# 1. Start PostgreSQL
# 2. Backend: cd backend && npm install && npm run dev
# 3. Frontend: cd frontend && npm install && npm start
```

### AWS Deployment

```bash
# Deploy infrastructure
cd aws/scripts
chmod +x deploy.sh
./deploy.sh

# Or use CloudFormation
aws cloudformation deploy \
  --template-file aws/cloudformation/template.yaml \
  --stack-name food-delivery-platform \
  --capabilities CAPABILITY_NAMED_IAM
```

## Resume Bullets

> AI-Powered Food Delivery Platform | AWS, Node.js, Express, PostgreSQL, Docker, React
> • Developed a full-stack food delivery platform serving customers, restaurants, and admins with complete order lifecycle management.
> • Built 25+ REST APIs for authentication, restaurants, menus, carts, orders, and payments with JWT-based role-based access control.
> • Deployed the application on AWS EC2 with Amazon RDS for managed PostgreSQL, S3 for image storage, and CloudWatch for monitoring.
> • Implemented secure cloud infrastructure using AWS IAM, VPC, and Security Groups, reducing unauthorized access risks.
> • Containerized backend and frontend services using Docker for consistent deployments across environments.
> • Integrated AI-powered food recommendations and a customer support chatbot using OpenAI API to enhance user engagement.

## License

MIT
