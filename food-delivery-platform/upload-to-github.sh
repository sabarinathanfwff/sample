#!/bin/bash
# ============================================
# GitHub Upload Script for Food Delivery Platform
# ============================================
# Usage:
#   1. Replace YOUR_USERNAME with your GitHub username
#   2. Run: bash upload-to-github.sh
# ============================================

set -e

PROJECT_DIR="food-delivery-platform"
GITHUB_USERNAME="YOUR_USERNAME"
REPO_NAME="food-delivery-platform"

echo "=========================================="
echo "GitHub Upload Script"
echo "=========================================="

# Navigate to project directory
cd "$PROJECT_DIR"

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    git branch -M main
else
    echo "Git repository already initialized."
fi

# Add all files
echo "Adding files..."
git add .

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
backend/node_modules/
frontend/node_modules/

# Build artifacts
dist/
build/
out/
backend/dist/
frontend/dist/
frontend/build/

# Environment files
.env
.env.*
!.env.example
backend/.env
frontend/.env

# Docker
docker/.env
docker-compose.override.yml

# Logs
logs/
*.log
backend/logs/

# OS / Editor
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp

# Runtime data
*.pid
*.seed
.cache/

# Local DB dumps
*.sql.gz
db-backups/
EOF
    git add .gitignore
fi

# Check git config
echo ""
echo "Git configuration:"
git config user.name || echo "No user.name set"
git config user.email || echo "No user.email set"
echo ""

# Commit
echo "Creating initial commit..."
git commit -m "Initial commit: AI-Powered Food Delivery Platform on AWS

- Full-stack food delivery platform (Zomato/Swiggy-style)
- Backend: Node.js/Express with 25+ REST APIs
- Frontend: React 18 with role-based views
- Database: PostgreSQL with comprehensive schema
- AI: Recommendation engine + chatbot integration
- AWS: CloudFormation IaC, EC2, RDS, S3, CloudWatch
- DevOps: Docker, Docker Compose, deployment scripts
- Features: Auth, restaurants, menus, cart, orders, payments, reviews, admin dashboard"

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Create a new repository on GitHub:"
echo "   https://github.com/new"
echo "   Repository name: $REPO_NAME"
echo "   Do NOT initialize with README, .gitignore, or license"
echo ""
echo "2. Add the remote and push:"
echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "   git push -u origin main"
echo ""
echo "3. Verify on GitHub:"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""
