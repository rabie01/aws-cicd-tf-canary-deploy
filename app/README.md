# TurboVets – Dockerized Node.js Express App on AWS ECS

[![Deploy the App](https://github.com/rabie01/aws-cicd-tf-canary-deploy/actions/workflows/app-deploy.yml/badge.svg)](https://github.com/rabie01/aws-cicd-tf-canary-deploy/actions/workflows/app-deploy.yml)

Complete Infrastructure-as-Code setup for deploying a **TypeScript Express application** using **Docker**, **CDKTF**, and **AWS ECS Fargate** with an **Application Load Balancer**.

## 📋 Project Structure

```
.
├── app/    # Application code and app-level config
│   ├── src/
│   │   ├── app.ts            # Express app configuration
│   │   ├── server.ts         # Server entry point
│   │   └── routes/
│   │       └── index.ts      # API routes (includes /health)
│   ├── package.json          # App dependencies and 
│   ├── tsconfig.json 
│   ├── package-lock.json
│   ├── docker-compose.yaml  # docker compose file
|   ├── Dockerfile  # docker compose file 
|   └── README.md  # deployment notes (this file)
|
│
iac/                          # Terraform Infrastructure as Code
├── modules/                 # Reusable Terraform modules
│   ├── vpc/
│   │   ├── main.tf          # VPC, subnets, NAT, route tables, security groups
│   │   ├── outputs.tf       # VPC module outputs
│   │   └── variables.tf     # VPC module variables
│   ├── ecr/
│   │   ├── main.tf          # ECR repository and lifecycle policy
│   │   ├── outputs.tf       # ECR module outputs
│   │   └── variables.tf     # ECR module variables
│   ├── iam/
│   │   ├── main.tf          # IAM roles (task execution & task roles)
│   │   ├── outputs.tf       # IAM module outputs
│   │   └── variables.tf     # IAM module variables
│   └── ecs/
│       ├── main.tf          # ECS cluster, service, task definition, ALB
│       ├── outputs.tf       # ECS module outputs
│       └── variables.tf     # ECS module variables
├── main.tf                  # Root module - module instantiation
├── terraform.tf             # Terraform config (version, providers, backend)
├── variables.tf             # Root module variables (defaults)
├── outputs.tf               # Root module outputs
├── development.tfvars       # Development environment variables
├── production.tfvars        # Production environment variables
├── backend-dev.hcl          # S3 backend config for development
├── backend-prod.hcl         # S3 backend config for production
├── .terraform.lock.hcl      # Terraform dependency lock file
├── terraform.tfstate        # Current state
├── terraform.tfstate.backup # State backup
├── .gitignore               # Git ignore for IaC
└── README.md                # Infrastructure documentation
│
│── .github/
│    └── workflows/
│        └── iac-deploy.yml    # GitHub Actions workflow for app CI/CD
|        └── app-deploy.yml    # GitHub Actions workflow for app CI/CD  
│
└── devbox.json
```

## 🚀 Quick Start

### 1. Local Development with Docker

```bash
# Build and run locally
docker-compose up --build

# Access the app
curl http://localhost:3000
curl http://localhost:3000/health
```

### 2. Deploy to AWS ECS (from local machine)

#### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Terraform >= 1.5.0
- Git

### 1. Environment Variables

Copy and configure your environment:

```bash
# For development
cp <your development>.tfvars development.tfvars
# For production
cp <your production>.tfvars production.tfvars
```

### 2. S3 Backend Setup (One-time)

Create S3 bucket:

```bash
# Create S3 bucket
aws s3api create-bucket \
  --bucket turbovets-tfstate-prod \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket turbovets-tfstate-prod \
  --versioning-configuration Status=Enabled
```

### 3. Initialize Terraform

```bash
cd iac

# Development
terraform init -backend-config=backend-dev.hcl

# Production
terraform init -backend-config=backend-prod.hcl
```

### 4. Plan Infrastructure

```bash
# Development
terraform plan -var-file=development.tfvars

# Production
terraform plan -var-file=production.tfvars
```

### 5. Apply Infrastructure

```bash
# Development
terraform apply -var-file=development.tfvars

# Production
terraform apply -var-file=production.tfvars
```

---

This creates:
- ✅ VPC with public/private subnets across 2 AZs
- ✅ Security groups with least privilege
- ✅ ECR repository for Docker images
- ✅ ECS Fargate cluster with auto-scaling
- ✅ Application Load Balancer with health checks
- ✅ CloudWatch Logs integration
- ✅ IAM roles with minimal permissions

#### Step 3: Build and Push Docker Image

```bash
# Get AWS account ID and region
aws sts get-caller-identity
export AWS_ACCOUNT_ID=<your-account-id>
export AWS_REGION=us-east-1

# Get ECR login token
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build using Dockerfile (production-ready)
docker build -f Dockerfile -t turbovets:latest .

# Tag for ECR
docker tag turbovets:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/turbovets-app:latest

# Push to ECR
docker push \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/turbovets-app:latest
```

#### Step 4: Verify Deployment

```bash
# Check cluster status
aws ecs describe-clusters --clusters turbovets-cluster

# Check service status
aws ecs describe-services \
  --cluster turbovets-cluster \
  --services turbovets-service

# Get ALB DNS name
aws elbv2 describe-load-balancers \
  --query 'LoadBalancers[0].DNSName' --output text

# Test the application
curl http://<ALB_DNS_NAME>
curl http://<ALB_DNS_NAME>/health
```


## 🔄 CI/CD with GitHub Actions
#### Prerequisites
- AWS account credentials configured on GitHub secret
- create production environment and add approvers(for deploy and destroy)

The `.github/workflows/app-deploy.yml` pipeline:

1. **On Pull Request**: Tests Docker build
2. **On Push to main**: 
   - Builds Docker image
   - Pushes to ECR
   - Updates ECS service
   - Waits for service to stabilize
  
The `.github/workflows/iac-deploy.yml` pipeline:
   Triggered manually to deploy all the infrastructure on aws


### Setup GitHub Actions Secrets

Add to your GitHub repository:

```
Settings → Secrets and variables → Actions
```

Add:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

```bash
# Or use GitHub CLI
gh secret set AWS_ACCESS_KEY_ID --body $YOUR_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY --body $YOUR_SECRET_KEY
```

## 📝 Environment Variables

### Application (.env for app runtime)
```env
PORT=3000
```

### Infrastructure (iac/.env)
```env
AWS_REGION=us-east-1
APP_NAME=turbovets
ENVIRONMENT=production
ECS_DESIRED_COUNT=2
CONTAINER_CPU=256
CONTAINER_MEMORY=512
```


## 🛠 Advanced Usage

### Scaling Policies

Auto-scaling is configured for:
- **CPU**: Scale out at 70%, scale in at 30%
- **Memory**: Scale out at 80%, scale in at 40%
- **Min/Max**: 2-4 tasks

### Updating Configuration

To change settings post-deployment:

```bash
# Edit .env in iac/
# Rerun workflow
```

### Destroying Infrastructure

```bash
cd iac
npm run destroy
```

## 📚 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     AWS Region                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  VPC (10.0.0.0/16)                                   │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────┐   │  │
│  │  │ Public Subnets (ALB)                        │   │  │
│  │  │ ┌──────────────────────────────────────┐   │   │  │
│  │  │ │ Application Load Balancer (port 80) │   │   │  │
│  │  │ │ Health Check: /health               │   │   │  │
│  │  │ └──────────────┬───────────────────────┘   │   │  │
│  │  │                │                            │   │  │
│  │  │  IGW ←─────────┘                            │   │  │
│  │  └────────────────┼────────────────────────────┘   │  │
│  │                   │                                 │  │
│  │  ┌────────────────▼────────────────────────────┐   │  │
│  │  │ Private Subnets (ECS Tasks)                │   │  │
│  │  │ ┌──────────────────────────────────────┐   │   │  │
│  │  │ │ ECS Fargate Task 1 (port 3000)       │   │   │  │
│  │  │ │ ├─ Express App                       │   │   │  │
│  │  │ │ └─ CloudWatch Logs                   │   │   │  │
│  │  │ └──────────────────────────────────────┘   │   │  │
│  │  │ ┌──────────────────────────────────────┐   │   │  │
│  │  │ │ ECS Fargate Task 2 (port 3000)       │   │   │  │
│  │  │ │ ├─ Express App                       │   │   │  │
│  │  │ │ └─ CloudWatch Logs                   │   │   │  │
│  │  │ └──────────────────────────────────────┘   │   │  │
│  │  │                                             │   │  │
│  │  │  NAT Gateway → Internet                    │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ECR Repository (turbovets-app)                       │  │
│  │ └─ Image: Node.js 20-slim with compiled JS          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ CloudWatch Logs (/ecs/turbovets)                    │  │
│  │ └─ Retention: 7 days                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│ GitHub Actions CI/CD Pipeline│
├──────────────────────────────┤
│ 1. Build the infrastructure  |
|  2. Build Docker image       │
│ 3. Push to ECR               │
│ 4. Update ECS service        │
│ 5. Wait for stabilization    |
└──────────────────────────────┘
```
