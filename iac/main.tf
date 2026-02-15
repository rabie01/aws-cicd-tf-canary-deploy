# VPC module
module "vpc" {
  source = "./modules/vpc"

  app_name              = var.app_name
  environment           = var.environment
  vpc_cidr              = var.vpc_cidr
  az_count              = var.az_count
  ecs_container_port    = var.ecs_container_port
}

# IAM module
module "iam" {
  source = "./modules/iam"

  app_name     = var.app_name
  environment  = var.environment
  aws_region   = var.aws_region
  ecr_repo_arn = module.ecr.repository_arn
}

# ECR module
module "ecr" {
  source = "./modules/ecr"

  app_name    = var.app_name
  environment = var.environment
}

# ECS module
module "ecs" {
  source = "./modules/ecs"

  app_name                    = var.app_name
  environment                 = var.environment
  aws_region                  = var.aws_region
  ecs_cluster_name            = var.ecs_cluster_name
  ecs_service_name            = var.ecs_service_name
  ecs_task_family             = var.ecs_task_family
  container_port              = var.ecs_container_port
  desired_count               = var.ecs_desired_count
  container_cpu               = var.container_cpu
  container_memory            = var.container_memory
  image_tag                   = var.ecr_image_tag
  repository_url              = module.ecr.repository_url
  ecs_task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  ecs_task_role_arn           = module.iam.ecs_task_role_arn
  private_subnet_ids          = module.vpc.private_subnet_ids
  ecs_security_group_id       = module.vpc.ecs_security_group_id
  alb_security_group_id       = module.vpc.alb_security_group_id
  vpc_id                      = module.vpc.vpc_id
  public_subnet_ids           = module.vpc.public_subnet_ids
}
