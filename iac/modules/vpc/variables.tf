# General
variable "app_name" {
  type        = string
  description = "Application name"
}

variable "environment" {
  type        = string
  description = "Environment name"
}

# VPC
variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block"
}

# ECS
variable "ecs_container_port" {
  type        = number
  description = "ECS container port for security group"
}

variable "az_count" {
  type        = number
  description = "Number of Availability Zones to use"
}