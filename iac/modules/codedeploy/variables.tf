variable "app_name" {
  type = string

}

variable "environment" {
  type = string
}

variable "blue_target_group_name" {
  type = string
}

variable "green_target_group_name" {
  type = string
}

variable "alb_listener_arn" {
  type = string
}

variable "aws_ecs_cluster_name" {
  type = string
}

variable "aws_ecs_service_name" {
  type = string
}

variable "codedeploy_deployment_config_name" {
  type = string
}

variable "codedeploy_role_arn" {
  type = string
}