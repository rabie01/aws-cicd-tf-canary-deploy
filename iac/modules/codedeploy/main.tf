resource "aws_codedeploy_app" "this" {
  name             = "${var.app_name}-${var.environment}"
  compute_platform = "ECS"
}

resource "aws_codedeploy_deployment_group" "this" {
  app_name              = aws_codedeploy_app.this.name
  deployment_group_name = "${var.app_name}-${var.environment}-dg"
  service_role_arn      = var.codedeploy_role_arn

  deployment_config_name = var.codedeploy_deployment_config_name
  #   deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  ecs_service {
    cluster_name = var.aws_ecs_cluster_name
    service_name = var.aws_ecs_service_name
  }

  load_balancer_info {
    target_group_pair_info {
      target_group {
        name = var.blue_target_group_name
      }

      target_group {
        name = var.green_target_group_name
      }

      prod_traffic_route {
        listener_arns = [var.alb_listener_arn]
      }
    }
  }

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
}




