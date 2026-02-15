# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.app_name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public_1" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_1_cidr
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-public-subnet-1"
    Environment = var.environment
  }
}

resource "aws_subnet" "public_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_2_cidr
  availability_zone = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.app_name}-public-subnet-2"
    Environment = var.environment
  }
}

# Private Subnets
resource "aws_subnet" "private_1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_1_cidr
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "${var.app_name}-private-subnet-1"
    Environment = var.environment
  }
}

resource "aws_subnet" "private_2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_2_cidr
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name        = "${var.app_name}-private-subnet-2"
    Environment = var.environment
  }
}

# Elastic IPs for NAT
resource "aws_eip" "nat_1" {
  domain   = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.app_name}-eip-1"
    Environment = var.environment
  }
}

resource "aws_eip" "nat_2" {
  domain   = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name        = "${var.app_name}-eip-2"
    Environment = var.environment
  }
}

# NAT Gateways
resource "aws_nat_gateway" "nat_1" {
  allocation_id = aws_eip.nat_1.id
  subnet_id     = aws_subnet.public_1.id

  tags = {
    Name        = "${var.app_name}-nat-gw-1"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "nat_2" {
  allocation_id = aws_eip.nat_2.id
  subnet_id     = aws_subnet.public_2.id

  tags = {
    Name        = "${var.app_name}-nat-gw-2"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.main]
}

# Public Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public_1" {
  subnet_id      = aws_subnet.public_1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_2" {
  subnet_id      = aws_subnet.public_2.id
  route_table_id = aws_route_table.public.id
}

# Private Route Tables
resource "aws_route_table" "private_1" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-private-rt-1"
    Environment = var.environment
  }
}

resource "aws_route" "private_1_nat" {
  route_table_id         = aws_route_table.private_1.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_1.id
}

resource "aws_route_table_association" "private_1" {
  subnet_id      = aws_subnet.private_1.id
  route_table_id = aws_route_table.private_1.id
}

resource "aws_route_table" "private_2" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.app_name}-private-rt-2"
    Environment = var.environment
  }
}

resource "aws_route" "private_2_nat" {
  route_table_id         = aws_route_table.private_2.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_2.id
}

resource "aws_route_table_association" "private_2" {
  subnet_id      = aws_subnet.private_2.id
  route_table_id = aws_route_table.private_2.id
}

# ALB Security Group
resource "aws_security_group" "alb" {
  name  = "${var.app_name}-alb-sg"
  vpc_id = aws_vpc.main.id

  ingress = [
    { from_port = 80,  to_port = 80,  protocol = "tcp", cidr_blocks = ["0.0.0.0/0"], description = "HTTP", ipv6_cidr_blocks = [], prefix_list_ids  = [], security_groups  = [], self = false },
    { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"], description = "HTTPS", ipv6_cidr_blocks = [], prefix_list_ids  = [], security_groups  = [] , self = false },
  ]

  egress = [
    { from_port = 0, to_port = 0, protocol = "-1", cidr_blocks = ["0.0.0.0/0"], description = "All outbound", ipv6_cidr_blocks = [], prefix_list_ids  = [], security_groups  = [], self = false },
  ]

  tags = {
    Name        = "${var.app_name}-alb-sg"
    Environment = var.environment
  }
}

# ECS Security Group
resource "aws_security_group" "ecs" {
  name  = "${var.app_name}-ecs-sg"
  vpc_id = aws_vpc.main.id

  ingress = [
    { from_port = var.ecs_container_port, to_port = var.ecs_container_port, protocol = "tcp", security_groups = [aws_security_group.alb.id], description = "From ALB", cidr_blocks = [], ipv6_cidr_blocks = [], prefix_list_ids  = [], self = false },
  ]

  egress = [
    { from_port = 0, to_port = 0, protocol = "-1", cidr_blocks = ["0.0.0.0/0"], description = "All outbound", ipv6_cidr_blocks = [], prefix_list_ids  = [], security_groups  = [], self = false },
  ]

  tags = {
    Name        = "${var.app_name}-ecs-sg"
    Environment = var.environment
  }
}

