output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnets" {
  value = module.vpc.public_subnet_ids
}

output "private_subnets" {
  value = module.vpc.private_subnet_ids
}

output "ecs_security_group_id" {
  value = module.vpc.ecs_security_group_id
}

output "alb_security_group_id" {
  value = module.vpc.alb_security_group_id
}

output "alb_dns_name" {
  value = module.ecs.alb_dns_name
}