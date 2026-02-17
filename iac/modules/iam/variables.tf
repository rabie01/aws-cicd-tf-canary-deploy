variable "app_name" {
  type        = string
  description = "Application name"
}

variable "environment" {
  type        = string
  description = "Environment name"
}

variable "ecr_repo_arn" {
  type        = string
  description = "ECR repository ARN"
}
