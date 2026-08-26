# AWS Deployment Guide — AI-Powered Food Delivery Platform

This guide walks through provisioning infrastructure and deploying the
application on AWS using the provided CloudFormation template and helper
scripts.

---

## 1. Prerequisites

- **AWS Account** with permissions to create VPC, EC2, RDS, S3, IAM, and
  CloudWatch resources.
- **AWS CLI v2** installed and configured (`aws configure`).
- **An EC2 Key Pair** in your target region (for SSH).
- **Docker** and **git** on your local machine.
- **jq** and **openssl** (for scripts).
- A registered **domain** (optional, for SSL/custom hostname).

Verify tooling:

```bash
aws --version
docker --version
jq --version
```

---

## 2. Clone & Prepare

```bash
git clone <your-repo> food-delivery-platform
cd food-delivery-platform
chmod +x aws/scripts/*.sh
```

Create your local environment files:

```bash
cp .env.example .env                 # backend + frontend vars
cp docker/.env.example docker/.env    # compose vars
# Edit both and set strong secrets (JWT, DB password, etc.)
```

---

## 3. Provision Infrastructure (CloudFormation)

Deploy the stack. Replace the parameters with your values:

```bash
aws cloudformation create-stack \
  --stack-name food-delivery-platform \
  --template-body file://aws/cloudformation/template.yaml \
  --capabilities CAPABILITY_IAM \
  --parameters \
    ParameterKey=KeyName,ParameterValue=my-ec2-key \
    ParameterKey=DBPassword,ParameterValue='<STRONG_DB_PASSWORD>' \
    ParameterKey=SSHLocation,ParameterValue='<YOUR_IP>/32' \
    ParameterKey=MultiAZDatabase,ParameterValue='false'
```

Monitor progress:

```bash
aws cloudformation describe-stacks \
  --stack-name food-delivery-platform \
  --query "Stacks[0].StackStatus"
```

Once `CREATE_COMPLETE`, capture the outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name food-delivery-platform \
  --query "Stacks[0].Outputs"
```

Note the **InstancePublicIP**, **DatabaseEndpoint**, and **ImagesBucketName**.

> Tip: For production, set `MultiAZDatabase=true`, tighten `SSHLocation`,
> and enable AWS Backup.

---

## 4. EC2 Setup

The CloudFormation `UserData` already installs Docker, Docker Compose, the
CloudWatch agent, and configures the agent. SSH in to verify:

```bash
ssh -i my-ec2-key.pem ec2-user@<InstancePublicIP>
docker --version
docker-compose --version
```

Upload the CloudWatch agent config and start it (if not auto-started):

```bash
aws s3 cp s3://<ImagesBucketName>/cloudwatch-config.json \
  /opt/aws/amazon-cloudwatch-agent/etc/config.json
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
```

> The `setup-rds.sh` and `backup-db.sh` scripts need `postgresql-client`:
> ```bash
> sudo amazon-linux-extras enable postgresql14
> sudo yum install -y postgresql
> ```

---

## 5. RDS Setup

Initialize the database (schema + seed + app user). Run from the EC2 host or
any machine with network access to RDS:

```bash
DB_ENDPOINT=<DatabaseEndpoint> \
DB_MASTER_USERNAME=<MasterUsername> \
DB_MASTER_PASSWORD='<STRONG_DB_PASSWORD>' \
APP_DB_PASSWORD='<APP_DB_PASSWORD>' \
./aws/scripts/setup-rds.sh
```

This creates the `food_delivery` database, a least-privilege
`food_delivery_app` user, loads `database/schema.sql`, and seeds an admin user.

> The RDS instance is in a private subnet reachable only from the EC2 security
> group. Run `setup-rds.sh` **from the EC2 instance** to satisfy network rules.

---

## 6. S3 Setup (Images)

The bucket is created by CloudFormation with public access blocked. Create a
presigned-URL upload flow or use the EC2 IAM role to write objects. Example
policy is attached (SSL-only). Upload the CloudWatch config so EC2 can fetch it:

```bash
aws s3 cp aws/monitoring/cloudwatch-config.json \
  s3://<ImagesBucketName>/cloudwatch-config.json
```

---

## 7. Build, Push & Deploy

The `deploy.sh` script builds the backend/frontend images, pushes them to ECR,
syncs the project to EC2, and runs containers.

First, create ECR repositories:

```bash
aws ecr create-repository --repository-name food-delivery-platform-backend
aws ecr create-repository --repository-name food-delivery-platform-frontend
```

Then deploy (set env vars as needed):

```bash
ENV=production \
AWS_REGION=us-east-1 \
REMOTE_HOST=ec2-user@<InstancePublicIP> \
SSH_KEY=~/.ssh/my-ec2-key.pem \
ECR_REPO=food-delivery-platform \
STACK_NAME=food-delivery-platform \
./aws/scripts/deploy.sh
```

The script will:
1. Authenticate with ECR.
2. Build & push `backend` and `frontend` images (timestamped tags).
3. Render `docker-compose.override.yml` pinning those images.
4. `rsync` the project to `/opt/food-delivery-platform` on EC2.
5. `docker-compose up -d`.
6. Run DB migrations (if configured).
7. Verify `/healthz` (frontend) and `/health` (backend).

---

## 8. Security Group Configuration

| Resource | Port | Source | Purpose |
|----------|------|--------|---------|
| EC2 | 22   | your IP `/32` | SSH (restrict tightly) |
| EC2 | 80   | 0.0.0.0/0 | HTTP (or put behind ALB/CloudFront) |
| EC2 | 443  | 0.0.0.0/0 | HTTPS (after SSL) |
| RDS | 5432 | EC2 SG only | PostgreSQL — never public |
| S3 | —    | IAM role | Private bucket, presigned URLs |

---

## 9. Domain & SSL (Optional)

1. Register a domain in **Route 53** (or use your registrar).
2. Request a **ACM** certificate (us-east-1 for CloudFront) or use
   **Let's Encrypt** on the EC2 host:
   ```bash
   sudo yum install -y certbot
   sudo certbot certonly --nginx -d api.yourdomain.com -d yourdomain.com
   ```
3. Update `docker/nginx.conf` to enable TLS (listen 443, ssl_certificate) and
   redirect 80 → 443.
4. Point the DNS A record to the EC2 Elastic IP (assign one for stability).

For production scale, place an **Application Load Balancer** + **CloudFront**
in front of EC2 and terminate TLS there.

---

## 10. Backups & Monitoring

**Database backups to S3** (run daily via cron on EC2):

```bash
DB_ENDPOINT=<host> DB_PASSWORD='<APP_DB_PASSWORD>' \
S3_BUCKET=<ImagesBucketName> RETENTION_DAYS=14 \
./aws/scripts/backup-db.sh
```

Add to crontab:

```cron
30 2 * * * /opt/food-delivery-platform/aws/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1
```

**Monitoring**: CloudWatch alarms (`EC2CPUAlarm`, `RDSCPUAlarm`,
`RDSFreeStorageAlarm`) alert on high CPU and low storage. Logs flow to
`/aws/ec2/<env>-fdp/*` log groups with 30-day retention.

---

## 11. Cost Estimation (us-east-1, on-demand, single AZ)

| Service | Type | ~Monthly Cost (USD) |
|---------|------|---------------------|
| EC2 | t3.micro (Linux) | ~$7.50 |
| RDS | db.t3.micro PostgreSQL (Single-AZ, gp2 20GB) | ~$15–18 |
| S3 | Storage + requests (light) | ~$1–3 |
| Data transfer | Egress (light) | ~$1–5 |
| CloudWatch | Logs/metrics/alarms (light) | ~$3–5 |
| **Total (estimate)** | | **~$28–40 / month** |

> Savings: use **Savings Plans / Reserved Instances** (~40% off), enable
> `MultiAZDatabase` only in production, and set S3 lifecycle rules to Glacier
> for old backups.

---

## 12. Teardown

```bash
aws cloudformation delete-stack --stack-name food-delivery-platform
```

> The RDS instance uses `DeletionPolicy: Snapshot` and the S3 bucket uses
> `Retain`, so data is preserved. Delete the snapshot and empty the bucket
> manually if no longer needed.
