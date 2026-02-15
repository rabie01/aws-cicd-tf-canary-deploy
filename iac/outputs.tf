output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnets" {
  value = [
    module.vpc.public_subnet_1_id,
    module.vpc.public_subnet_2_id
  ]
}

output "private_subnets" {
  value = [
    module.vpc.private_subnet_1_id,
    module.vpc.private_subnet_2_id
  ]
}

output "ecs_security_group_id" {
  value = module.vpc.ecs_security_group_id
}

output "alb_security_group_id" {
  value = module.vpc.alb_security_group_id
}
