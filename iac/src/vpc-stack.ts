import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Fn } from 'cdktf';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup as AwsSecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { InfrastructureConfig } from './config';

export interface VpcStackOutput {
  vpcId: string;
  privateSubnet1Id: string;
  privateSubnet2Id: string;
  publicSubnet1Id: string;
  publicSubnet2Id: string;
  ecsSecurityGroupId: string;
  albSecurityGroupId: string;
}

export class VpcStack extends Construct {
  public readonly output: VpcStackOutput;

  constructor(scope: Construct, id: string, config: InfrastructureConfig) {
    super(scope, id);

    // Get availability zones
    const azData = new DataAwsAvailabilityZones(this, 'available_azs', {
      state: 'available',
    });

    // Create VPC
    const vpc = new Vpc(this, 'main_vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.appName}-vpc`,
        Environment: config.environment,
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'main_igw', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.appName}-igw`,
        Environment: config.environment,
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, 'public_subnet_1', {
      vpcId: vpc.id,
      cidrBlock: config.publicSubnet1Cidr,
      availabilityZone: Fn.element(azData.names, 0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.appName}-public-subnet-1`,
        Environment: config.environment,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public_subnet_2', {
      vpcId: vpc.id,
      cidrBlock: config.publicSubnet2Cidr,
      availabilityZone: Fn.element(azData.names, 1),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.appName}-public-subnet-2`,
        Environment: config.environment,
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, 'private_subnet_1', {
      vpcId: vpc.id,
      cidrBlock: config.privateSubnet1Cidr,
      availabilityZone: Fn.element(azData.names, 0),
      tags: {
        Name: `${config.appName}-private-subnet-1`,
        Environment: config.environment,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private_subnet_2', {
      vpcId: vpc.id,
      cidrBlock: config.privateSubnet2Cidr,
      availabilityZone: Fn.element(azData.names, 1),
      tags: {
        Name: `${config.appName}-private-subnet-2`,
        Environment: config.environment,
      },
    });

    // Elastic IPs for NAT Gateways
    const eip1 = new Eip(this, 'nat_eip_1', {
      domain: "vpc",
      dependsOn: [igw],
      tags: {
        Name: `${config.appName}-eip-1`,
        Environment: config.environment,
      },
    });

    const eip2 = new Eip(this, 'nat_eip_2', {
      domain: "vpc",
      dependsOn: [igw],
      tags: {
        Name: `${config.appName}-eip-2`,
        Environment: config.environment,
      },
    });

    // NAT Gateways
    const natGw1 = new NatGateway(this, 'nat_gateway_1', {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `${config.appName}-nat-gw-1`,
        Environment: config.environment,
      },
      dependsOn: [igw],
    });

    const natGw2 = new NatGateway(this, 'nat_gateway_2', {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: `${config.appName}-nat-gw-2`,
        Environment: config.environment,
      },
      dependsOn: [igw],
    });

    // Public Route Table
    const publicRt = new RouteTable(this, 'public_rt', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.appName}-public-rt`,
        Environment: config.environment,
      },
    });

    new Route(this, 'public_route_igw', {
      routeTableId: publicRt.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    new RouteTableAssociation(this, 'public_subnet_1_assoc', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRt.id,
    });

    new RouteTableAssociation(this, 'public_subnet_2_assoc', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRt.id,
    });

    // Private Route Tables
    const privateRt1 = new RouteTable(this, 'private_rt_1', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.appName}-private-rt-1`,
        Environment: config.environment,
      },
    });

    new Route(this, 'private_route_nat_1', {
      routeTableId: privateRt1.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw1.id,
    });

    new RouteTableAssociation(this, 'private_subnet_1_assoc', {
      subnetId: privateSubnet1.id,
      routeTableId: privateRt1.id,
    });

    const privateRt2 = new RouteTable(this, 'private_rt_2', {
      vpcId: vpc.id,
      tags: {
        Name: `${config.appName}-private-rt-2`,
        Environment: config.environment,
      },
    });

    new Route(this, 'private_route_nat_2', {
      routeTableId: privateRt2.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGw2.id,
    });

    new RouteTableAssociation(this, 'private_subnet_2_assoc', {
      subnetId: privateSubnet2.id,
      routeTableId: privateRt2.id,
    });

    // ALB Security Group (allows HTTP/HTTPS from internet)
    const albSg = new AwsSecurityGroup(this, 'alb_sg', {
      name: `${config.appName}-alb-sg`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `${config.appName}-alb-sg`,
        Environment: config.environment,
      },
    });

    // ECS Security Group (allows traffic from ALB)
    const ecsSg = new AwsSecurityGroup(this, 'ecs_sg', {
      name: `${config.appName}-ecs-sg`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: config.ecsContainerPort,
          toPort: config.ecsContainerPort,
          protocol: 'tcp',
          securityGroups: [albSg.id],
          description: 'Allow traffic from ALB',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        Name: `${config.appName}-ecs-sg`,
        Environment: config.environment,
      },
    });

    this.output = {
      vpcId: vpc.id,
      privateSubnet1Id: privateSubnet1.id,
      privateSubnet2Id: privateSubnet2.id,
      publicSubnet1Id: publicSubnet1.id,
      publicSubnet2Id: publicSubnet2.id,
      ecsSecurityGroupId: ecsSg.id,
      albSecurityGroupId: albSg.id,
    };
  }
}
