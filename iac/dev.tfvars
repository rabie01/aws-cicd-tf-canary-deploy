environment           = "development"
vpc_cidr              = "10.0.0.0/16"
public_subnet_1_cidr  = "10.0.101.0/24"
public_subnet_2_cidr  = "10.0.102.0/24"
private_subnet_1_cidr = "10.0.1.0/24"
private_subnet_2_cidr = "10.0.2.0/24"
ecs_container_port    = 3000
container_cpu = "256"
container_memory = "512"
ecs_desired_count = 2
ecr_image_tag = "latest"
ecs_cluster_name = "turbovets-cluster"
ecs_service_name = "turbovets-service"
ecs_task_family = "turbovets-task"
app_name = "turbovets"
aws_region = "us-east-1"

