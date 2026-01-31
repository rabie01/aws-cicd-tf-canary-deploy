# Deployment Checklist

Complete this checklist before deploying to production.

## Pre-Deployment

- [ ] **AWS Account Setup**
  - [ ] AWS account created and verified
  - [ ] AWS CLI installed and configured: `aws configure`
  - [ ] AWS credentials have AdministratorAccess or appropriate permissions
  - [ ] Verify account ID: `aws sts get-caller-identity`

- [ ] **Local Development**
  - [ ] Docker and Docker Compose installed
  - [ ] Node.js 20+ installed
  - [ ] CDKTF CLI installed: `npm install -g cdktf-cli`
  - [ ] App runs locally: `docker-compose up`
  - [ ] Health endpoint works: `curl http://localhost:3000/health`

## Infrastructure Deployment

- [ ] **Configuration**
  - [ ] Navigate to `infrastructure/` directory
  - [ ] Copy `.env.example` to `.env`
  - [ ] Fill in `AWS_ACCOUNT_ID` (required)
  - [ ] Review other settings (defaults are sensible)
  - [ ] Verify `.env` is not committed to git

- [ ] **Build & Plan**
  - [ ] Run `npm install`
  - [ ] Run `npm run build`
  - [ ] Run `npm run plan` and review resources
  - [ ] Save plan output for reference

- [ ] **Deploy**
  - [ ] Run `npm run deploy`
  - [ ] Note the output values:
    - [ ] `ecr_repository_url`
    - [ ] `alb_dns_name`
    - [ ] `ecs_cluster_name`
    - [ ] `vpc_id`

## Docker Image

- [ ] **Build and Push**
  - [ ] Build image: `docker build -f Dockerfile -t turbovets:latest .`
  - [ ] Login to ECR (use output from above)
  - [ ] Tag image: `docker tag turbovets:latest <ECR_URL>:latest`
  - [ ] Push image: `docker push <ECR_URL>:latest`
  - [ ] Verify in AWS Console → ECR → turbovets-app

## Testing & Verification

- [ ] **ECS Service**
  - [ ] Service is `ACTIVE` in AWS Console
  - [ ] All tasks are `RUNNING`
  - [ ] Target group shows healthy targets
  - [ ] CloudWatch Logs show application output

- [ ] **Application Access**
  - [ ] Get ALB DNS name: `aws elbv2 describe-load-balancers --query 'LoadBalancers[0].DNSName'`
  - [ ] Test root endpoint: `curl http://<ALB_DNS>/` → "Hello from Express..."
  - [ ] Test health endpoint: `curl http://<ALB_DNS>/health` → `{"status":"healthy"}`
  - [ ] Test from browser: `http://<ALB_DNS>`

- [ ] **Logs & Monitoring**
  - [ ] CloudWatch Logs group exists: `/ecs/turbovets`
  - [ ] Application logs appear in CloudWatch
  - [ ] No error messages in logs

## GitHub Actions Setup (Optional but Recommended)

- [ ] **Repository Secrets**
  - [ ] Add `AWS_ACCESS_KEY_ID` secret
  - [ ] Add `AWS_SECRET_ACCESS_KEY` secret
  - [ ] Verify secrets are accessible to workflows

- [ ] **Test CI/CD Pipeline**
  - [ ] Create PR with changes
  - [ ] Verify workflow runs (test job)
  - [ ] Merge PR to main
  - [ ] Verify build, push, and deploy jobs
  - [ ] Verify service updates successfully

## Post-Deployment

- [ ] **Clean Up**
  - [ ] Remove temporary files
  - [ ] Verify `.env` files are in `.gitignore`
  - [ ] Commit infrastructure code to git

- [ ] **Documentation**
  - [ ] Update team wiki with:
    - [ ] ALB DNS name
    - [ ] How to view logs
    - [ ] How to scale up/down
    - [ ] How to rollback
    - [ ] Emergency contacts

- [ ] **Monitoring Setup** (Optional)
  - [ ] Set up CloudWatch alarms for:
    - [ ] CPU utilization > 80%
    - [ ] Memory utilization > 80%
    - [ ] Task count < desired count
    - [ ] Health check failures
  - [ ] Set up SNS notifications

- [ ] **Security Review**
  - [ ] Verify security groups restrict access appropriately
  - [ ] Confirm no root credentials exposed
  - [ ] Review IAM policies (least privilege)
  - [ ] Enable VPC Flow Logs if required

## Rollback Procedures

### Rollback to Previous Image

```bash
# Get previous image digest
aws ecr describe-images --repository-name turbovets-app --query 'imageDetails[].imageTags[]'

# Tag previous version as latest
aws ecr batch-get-image --repository-name turbovets-app --image-ids imageTag=<PREVIOUS_TAG> | jq ...

# Update ECS service with --force-new-deployment
aws ecs update-service --cluster turbovets-cluster --service turbovets-service --force-new-deployment
```

### Rollback Infrastructure

```bash
cd infrastructure
npm run destroy  # ⚠️ Deletes all resources

# OR revert to previous infrastructure state (if Terraform state backed up)
# Restore backup and run: npm run deploy
```

## Maintenance

### Regular Tasks

- [ ] Weekly: Check CloudWatch Logs for errors
- [ ] Monthly: Review and update dependencies
- [ ] Monthly: Review AWS costs
- [ ] Quarterly: Security audit of IAM roles
- [ ] As needed: Update Dockerfile for security patches

### Scaling

To increase/decrease task count:

```bash
cd infrastructure
# Edit .env: ECS_DESIRED_COUNT=<new_count>
npm run deploy
```

Auto-scaling is configured:
- Scales up when CPU > 70% or Memory > 80%
- Scales down when CPU < 30% and Memory < 40%
- Max: 4 tasks, Min: `ECS_DESIRED_COUNT`

## Estimated AWS Costs

### Monthly Estimate (2 Fargate tasks, t3.small equivalent)

| Service | Unit Cost | Monthly |
|---------|-----------|---------|
| ECS Fargate (2 × 512MB, 0.25 vCPU) | $0.04644/hour | ~$67 |
| ALB | $16.20/month | $16 |
| NAT Gateway | $32/month + $0.045/GB | ~$35 |
| ECR | $0.10/GB/month | ~$10 |
| CloudWatch Logs | $0.50/GB ingested | ~$5 |
| **Total** | | **~$133** |

*Note: Prices vary by region. Check AWS pricing for your region.*

## Success Criteria

✅ All items checked  
✅ Application accessible via ALB  
✅ Health checks passing  
✅ Logs visible in CloudWatch  
✅ Auto-scaling works  
✅ Team trained on operations  

**You're ready for production!** 🎉
