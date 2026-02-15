variable "app_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "ecs_cluster_name" {
  type = string
}

variable "ecs_service_name" {
  type = string
}

variable "ecs_task_family" {
  type = string
}

variable "container_port" {
  type = number
}

variable "desired_count" {
  type = number
}

variable "container_cpu" {
  type = string
}

variable "container_memory" {
  type = string
}

variable "image_tag" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "ecs_task_execution_role_arn" {
  type = string
}

variable "ecs_task_role_arn" {
  type = string  
}

variable "repository_url" {
  type = string  
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "ecs_security_group_id" {
  type = string
}

variable "alb_security_group_id" {
  type = string
}

variable "vpc_id" {
  type = string
}
