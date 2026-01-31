# TurboVets - Dockerized Node.js Express App with AWS ECS Deployment

Complete infrastructure as code setup for deploying a TypeScript Express application using Docker, CDKTF, and AWS ECS Fargate.

## 📋 Project Structure

```
.
├── app/    # Application code and app-level config
│   ├── src/
│   │   ├── app.ts            # Express app configuration
│   │   ├── server.ts         # Server entry point
│   │   └── routes/
│   │       └── index.ts      # API routes (includes /health)
│   ├── package.json          # App dependencies and scripts
│   ├── README-DEPLOYMENT.md  # App-specific deployment notes (this file)
│   └── .github/
│       └── workflows/
│           └── deploy.yml    # GitHub Actions workflow for app CI/CD
│
├── iac/    # CDKTF Infrastructure as Code
│   ├── src/
│   │   ├── main.ts           # CDKTF entry point
│   │   ├── config.ts         # Loads .env and config
│   │   ├── vpc-stack.ts      # VPC, subnets, NAT, route tables
│   │   ├── ecr-stack.ts      # ECR repo and lifecycle policy
│   │   ├── iam-stack.ts      # IAM roles (task/execution)
│   │   └── ecs-stack.ts      # ECS cluster, service, ALB
│   ├── cdktf.json            # CDKTF config (app entry, providers)
│   ├── package.json          # IaC dependencies and scripts (build, deploy)
│   ├── tsconfig.json         # TypeScript config for IaC
│   ├── .env.example          # IaC environment template
│   ├── README.md             # Infrastructure docs and usage
│   
│
└── devbox/ & root devbox files
  ├── .devbox/              # devbox local environment (optional)
  ├── devbox.json           # devbox configuration
  └── devbox.lock           # devbox lockfile
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

### 2. Deploy to AWS ECS

#### Prerequisites
- AWS account with credentials configured
- CDKTF and Node.js installed

#### Step 1: Prepare Infrastructure Configuration

```bash
cd iac

# Create environment file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required `.env` values:**
```env
AWS_ACCOUNT_ID=123456789012        # Your AWS account ID
AWS_REGION=us-east-1               # AWS region
ENVIRONMENT=production              # Environment name
```


#### Step 2: Deploy Infrastructure

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Review changes
npm run plan

# Deploy infrastructure (VPC, ECR, ECS, IAM)
npm run deploy
```

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

## 🔐 Security Features

### Least Privilege IAM
- **ECS Task Execution Role**: Only pulls from ECR and pushes to CloudWatch
- **ECS Task Role**: Only logs to CloudWatch (extensible for app-specific needs)
- No root or overly permissive policies

### Network Security
- **ALB Security Group**: Only allows HTTP (80) and HTTPS (443)
- **ECS Security Group**: Only allows traffic from ALB on container port
- Private subnets for ECS tasks with NAT Gateway access
- No direct internet access to ECS instances

### Container Security
- Multi-stage Docker build (reduces image size and attack surface)
- Base images: `node:20-slim` for production
- Health checks on `/health` endpoint
- Non-root user recommended (add to Dockerfile if needed)

## 📊 Monitoring & Logs

```bash
# View CloudWatch Logs
aws logs tail /ecs/turbovets --follow

# Monitor ECS service
aws ecs describe-services \
  --cluster turbovets-cluster \
  --services turbovets-service \
  --query 'services[0].[status,runningCount,desiredCount]'

# Check auto-scaling metrics
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs
```

## 🔄 CI/CD with GitHub Actions

The `.github/workflows/deploy.yml` pipeline:

1. **On Pull Request**: Tests Docker build
2. **On Push to main**: 
   - Builds Docker image
   - Pushes to ECR
   - Updates ECS service
   - Waits for service to stabilize

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
NODE_ENV=production
PORT=3000
```

### Infrastructure (iac/.env)
```env
AWS_ACCOUNT_ID=123456789012
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
# Rerun plan and deploy
cd iac
npm run plan
npm run deploy
```

### Destroying Infrastructure

```bash
cd iac
npm run destroy
```

⚠️ **WARNING**: This deletes all resources. Ensure no production data is lost.

## 🧪 Testing Locally

### Docker Compose
```bash
docker-compose up --build
curl http://localhost:3000
curl http://localhost:3000/health  # Health check endpoint
```

### Dockerfile (production)
```bash
docker build -f Dockerfile -t turbovets:prod .
docker run -p 3000:3000 turbovets:prod
```

### Devbox (if using)
```bash
devbox shell
npm run dev   # Local dev with ts-node-dev
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
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│ GitHub Actions CI/CD Pipeline │
├──────────────────────────────┤
│ 1. Build Docker image        │
│ 2. Push to ECR               │
│ 3. Update ECS service        │
│ 4. Wait for stabilization    │
└──────────────────────────────┘
```

## 🐛 Troubleshooting

### Service won't start
```bash
# Check ECS task logs
aws logs tail /ecs/turbovets --follow

# Check task status
aws ecs list-tasks --cluster turbovets-cluster
aws ecs describe-tasks --cluster turbovets-cluster --tasks <TASK_ARN>
```

### Cannot push to ECR
```bash
# Re-authenticate
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### Health check failing
- Ensure `/health` endpoint returns HTTP 200
- Check security group allows port 3000 from ALB
- View ECS task logs for application errors

## 📞 Support

For issues:
1. Check infrastructure logs: `aws logs tail /ecs/turbovets`
2. Review ECS service status: `aws ecs describe-services ...`
3. Verify IAM permissions are sufficient
4. Ensure Docker image built correctly

## 📄 License

ISC
