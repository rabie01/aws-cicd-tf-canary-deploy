# CDKTF Infrastructure Setup

## Prerequisites

1. Install dependencies:
# IaC (CDKTF) — TurboVets

This folder contains the CDK for Terraform (CDKTF) TypeScript project that defines the AWS infrastructure for the TurboVets application.

## Prerequisites

1. Node.js and npm installed
2. AWS CLI configured with credentials or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)
3. `cdktf` CLI available (installed globally or via npm scripts)
4. Environment

Copy `.env.example` to `.env` and update values before planning/deploying:

```bash
cp .env.example .env
# Edit .env: set AWS_ACCOUNT_ID, AWS_REGION, APP_NAME, etc.
```

Mandatory variables (examples are in `.env.example`):
- `AWS_ACCOUNT_ID`

## Quickstart

```bash
# from repo root
cd iac
npm install

# fetch providers and generated bindings
npx cdktf get

# build compiled JS into dist/
npm run build

# review plan
npm run plan

# deploy (or use --auto-approve)
npm run deploy

# destroy when needed
npm run destroy
```

## What this project creates

- VPC with public and private subnets (multi-AZ)
- NAT Gateways and Internet Gateway
- Route tables and associations
- ECR repository for app images
- IAM roles for ECS task execution and task role
- ECS Fargate cluster, service, task definition
- Application Load Balancer with target group and health checks

## Notes about local artifacts

If you want to tear down remote AWS resources, run `npm run destroy` before deleting local state files.

## Docker image build & push (app)

Build and push the application image from the `app/` folder (repo root move):

```bash
# from repo root
cd app
npm run build   # if your app has a build step

# build docker image (adjust tags as needed)
docker build -t turbovets:latest .

# tag and push to ECR (replace ACCOUNT_ID and REGION)
aws ecr get-login-password --region <REGION> | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com
docker tag turbovets:latest <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/turbovets-app:latest
docker push <ACCOUNT_ID>.dkr.ecr.<REGION>.amazonaws.com/turbovets-app:latest
```

After pushing the image, update the image tag in your task definition (if necessary) and run `npm run deploy` from `iac` to apply updates.


## Outputs

On successful deploy, CDKTF outputs common values (e.g., `ecr_repository_url`, `alb_dns_name`, `ecs_cluster_name`, `vpc_id`).
