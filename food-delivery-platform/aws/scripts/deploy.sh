#!/usr/bin/env bash
# =============================================================
# deploy.sh - Deploy the Food Delivery Platform to AWS EC2
# -------------------------------------------------------------
# Strategy: build images locally (or on EC2), push to ECR,
# copy application source + docker-compose to the EC2 host,
# run the containers, run DB migrations, and verify health.
#
# Prerequisites:
#   - AWS CLI configured (aws configure)
#   - SSH key for the EC2 instance
#   - jq installed
#   - A running RDS instance + ECR repository
#
# Usage:
#   ./deploy.sh [environment]
#   ENV=production HOST=user@1.2.3.4 ./deploy.sh
# =============================================================

set -euo pipefail

# ---------------- Configuration (override via env) ----------------
ENVIRONMENT="${1:-${ENVIRONMENT:-production}}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="${ECR_REPO:-food-delivery-platform}"
STACK_NAME="${STACK_NAME:-food-delivery-platform}"
REMOTE_HOST="${REMOTE_HOST:-}"      # user@host; auto-resolved if empty
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"
APP_DIR="/opt/food-delivery-platform"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

LOG_FILE="/tmp/deploy-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO  $*"; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR $*" >&2; }
die()  { err "$*"; exit 1; }

# ---------------- Resolve target host ----------------
resolve_host() {
  if [[ -n "$REMOTE_HOST" ]]; then
    echo "$REMOTE_HOST"
    return
  fi
  local ip
  ip=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='InstancePublicIP'].OutputValue" \
    --output text 2>/dev/null || true)
  [[ -n "$ip" ]] || die "Could not resolve EC2 instance IP from stack $STACK_NAME. Set REMOTE_HOST."
  echo "ec2-user@$ip"
}

# ---------------- Authenticate ECR ----------------
ecr_login() {
  log "Authenticating with ECR in $AWS_REGION..."
  local token
  token=$(aws ecr get-login-password --region "$AWS_REGION")
  echo "$token" | docker login --username AWS --password-stdin \
    "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.${AWS_REGION}.amazonaws.com" \
    || die "ECR login failed"
}

# ---------------- Build & push images ----------------
build_and_push() {
  local account uri
  account=$(aws sts get-caller-identity --query Account --output text)
  uri="${account}.dkr.ecr.${AWS_REGION}.amazonaws.com"

  for svc in backend frontend; do
    local image="${uri}/${ECR_REPO}-${svc}:${ENVIRONMENT}-$(date +%Y%m%d%H%M%S)"
    log "Building $svc image: $image"
    if [[ "$svc" == "backend" ]]; then
      docker build -f docker/Dockerfile.backend -t "$image" "$PROJECT_ROOT" \
        || die "Backend build failed"
    else
      docker build -f docker/Dockerfile.frontend \
        --build-arg VITE_API_URL="http://${REMOTE_HOST##*@}/api" \
        -t "$image" "$PROJECT_ROOT" || die "Frontend build failed"
    fi
    log "Pushing $image"
    docker push "$image" || die "Push failed for $image"
    echo "$image" > "/tmp/.${svc}_image"
  done
}

# ---------------- Render compose override ----------------
render_compose() {
  local backend_img frontend_img
  backend_img=$(cat /tmp/.backend_image)
  frontend_img=$(cat /tmp/.frontend_image)
  cat > "$PROJECT_ROOT/docker/docker-compose.override.yml" <<EOF
services:
  backend:
    image: ${backend_img}
    build: null
  frontend:
    image: ${frontend_img}
    build: null
EOF
}

# ---------------- Sync to EC2 ----------------
sync_to_ec2() {
  local host="$1"
  log "Syncing project to $host:$APP_DIR ..."
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$host" \
    "sudo mkdir -p $APP_DIR && sudo chown -R \$(whoami) $APP_DIR" || die "SSH setup failed"
  rsync -az --delete \
    --exclude 'node_modules' --exclude 'dist' --exclude 'build' --exclude '.git' \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$PROJECT_ROOT/" "$host:$APP_DIR/" || die "rsync failed"
}

# ---------------- Deploy on EC2 ----------------
deploy_on_ec2() {
  local host="$1"
  log "Deploying containers on $host..."
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$host" bash -s <<'REMOTE'
    set -euo pipefail
    cd /opt/food-delivery-platform
    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml pull
    docker-compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml up -d --remove-orphans
    docker image prune -f
REMOTE
}

# ---------------- Run DB migrations ----------------
run_migrations() {
  local host="$1"
  log "Running database migrations..."
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$host" \
    "docker exec fdp-backend npx sequelize-cli db:migrate || true" || \
    log "WARN: migration step skipped/failed (verify manually)."
}

# ---------------- Health check ----------------
verify_health() {
  local host="$1" ip="${host##*@}"
  log "Verifying application health..."
  for attempt in $(seq 1 10); do
    if curl -fsS "http://${ip}:3000/healthz" >/dev/null 2>&1 \
       && curl -fsS "http://${ip}:5000/health" >/dev/null 2>&1; then
      log "Health check passed."
      return 0
    fi
    log "  attempt $attempt: not ready yet, waiting 10s..."
    sleep 10
  done
  die "Health check failed after 10 attempts."
}

# ---------------- Main ----------------
main() {
  log "=== Deploying $ENVIRONMENT environment ==="
  command -v docker >/dev/null || die "docker is required locally"
  command -v aws >/dev/null || die "aws CLI is required"
  command -v jq >/dev/null || die "jq is required"

  local host
  host=$(resolve_host)

  ecr_login
  build_and_push
  render_compose
  sync_to_ec2 "$host"
  deploy_on_ec2 "$host"
  run_migrations "$host"
  verify_health "$host"

  log "=== Deployment complete ==="
  log "Application: http://${host##*@}"
  log "Logs: $LOG_FILE"
}

main "$@"
