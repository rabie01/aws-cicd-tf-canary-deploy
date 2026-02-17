# AWS
variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "az_count" {
  type        = number
  description = "Number of Availability Zones to use"
  default     = 2
}

# App
variable "app_name" {
  type        = string
  description = "Application name"
  default     = "turbovets"
}

variable "environment" {
  type        = string
  description = "Environment name"
  default     = "production"
}

# ECS & VPC related variables
variable "ecs_container_port" {
  type        = number
  description = "Port on which the container listens"
  default     = 3000
}
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "ecs_cluster_name" {
  type        = string
  description = "ECS cluster name"
  default     = "turbovets-cluster"
}
variable "ecs_service_name" {
  type        = string
  description = "ECS service name"
  default     = "turbovets-service"
}
variable "ecs_task_family" {
  type        = string
  description = "ECS task family"
  default     = "turbovets-task"
}
variable "ecs_desired_count" {
  type        = number
  description = "Desired number of ECS tasks"
  default     = 2
}
variable "container_cpu" {
  type        = string
  description = "CPU units for the container"
  default     = "256"
}
variable "container_memory" {
  type        = string
  description = "Memory for the container"
  default     = "512"
}
variable "ecr_image_tag" {
  type        = string
  description = "ECR image tag"
  default     = "latest"
}

variable "codedeploy_deployment_config_name" {
  type        = string
  description = "CodeDeploy deployment configuration name"
  default     = "CodeDeployDefault.ECSAllAtOnce"
}