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

variable "public_subnet_1_cidr" {
  type        = string
  description = "Public subnet 1 CIDR"
}

variable "public_subnet_2_cidr" {
  type        = string
  description = "Public subnet 2 CIDR"
}

variable "private_subnet_1_cidr" {
  type        = string
  description = "Private subnet 1 CIDR"
}

variable "private_subnet_2_cidr" {
  type        = string
  description = "Private subnet 2 CIDR"
}

# ECS
variable "ecs_container_port" {
  type        = number
  description = "ECS container port for security group"
}
