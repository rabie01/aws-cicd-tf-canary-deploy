# TurboVets – Terraform HCL Infrastructure as Code

[![Deploy IaC](https://github.com/rabie01/aws-cicd-tf-canary-deploy/actions/workflows/iac-deploy.yml/badge.svg)](https://github.com/rabie01/aws-cicd-tf-canary-deploy/actions/workflows/iac-deploy.yml)

Complete Infrastructure-as-Code setup for deploying a **TypeScript Express application** using **Docker**, **Terraform HCL**, and **AWS ECS Fargate** with an **Application Load Balancer**.

## 📋 Project Structure

```
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
```

### Module Breakdown

**vpc/** - Networking Foundation
- Creates VPC with configurable CIDR blocks
- Public & private subnets across multiple availability zones
- Internet Gateway and NAT Gateways for traffic routing
- ALB and ECS security groups with proper ingress/egress rules

**ecr/** - Container Registry
- ECR repository for storing Docker images
- Lifecycle policy to retain last 10 images
- Image scanning on push enabled

**iam/** - Access Control
- ECS task execution role for pulling images and logging
- ECS task role for application-level permissions
- CloudWatch log group for centralized logging

**ecs/** - Container Orchestration
- ECS cluster for Fargate launch type
- Task definition with container configuration
- ECS service with desired task count
- Application Load Balancer (ALB) with target groups
- Health checks and listener configuration

---

## 🚀 Quick Start

### Prerequisites

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

## 🔄 GitHub Actions Workflow

The `iac-deploy.yml` workflow automates infrastructure deployment:

### Workflow Actions

- **plan** - Runs Terraform plan to preview changes
- **deploy** - Applies infrastructure changes
- **destroy** - Tears down all resources

### Workflow Dispatch Inputs

- **environment**: `development` or `production`
- **aws_region**: AWS region (default: `us-east-1`)
- **action**: `plan`, `deploy`, or `destroy`
- **bucket_name**: S3 bucket for Terraform state

### Workflow Stages

1. **Format Check** - Validates HCL formatting
2. **Validation** - Checks Terraform configuration
3. **Init** - Initializes backend with dynamic config
4. **Plan** - Previews infrastructure changes
5. **Apply/Destroy** - Executes changes (on demand)

---

## 📊 Outputs

After `terraform apply`, the following outputs are available:

```bash
terraform output -json
```

- `vpc_id` - VPC identifier
- `public_subnets` - List of public subnet IDs
- `private_subnets` - List of private subnet IDs
- `ecs_security_group_id` - ECS security group
- `alb_security_group_id` - ALB security group
- `alb_dns_name`          - ALB DNS Name

---

## 🔐 Security Best Practices

- ✅ Private subnets for ECS tasks
- ✅ NAT Gateways for outbound traffic
- ✅ Security groups with least-privilege rules
- ✅ State file encryption and versioning
- ✅ use lock_file state locking to prevent concurrent modifications
- ✅ IAM roles follow principle of least privilege

---

## 🗑️ Cleanup

To destroy all infrastructure:

```bash
terraform destroy -var-file=production.tfvars
```

Or use GitHub Actions workflow with `action=destroy` input.

---
