import * as dotenv from 'dotenv';

dotenv.config();

export interface InfrastructureConfig {
  // AWS
  awsRegion: string;
  // awsAccountId: string;
  bucketName: string;
  stateKey: string;

  // App
  appName: string;
  environment: string;
  ecrRepoName: string;
  ecrImageTag: string;

  // ECS
  ecsClusterName: string;
  ecsServiceName: string;
  ecsTaskFamily: string;
  ecsContainerPort: number;
  ecsDesiredCount: number;

  // VPC
  vpcCidr: string;
  privateSubnet1Cidr: string;
  privateSubnet2Cidr: string;
  publicSubnet1Cidr: string;
  publicSubnet2Cidr: string;

  // Container
  containerCpu: string;
  containerMemory: string;
  logRetentionDays: number;
}

export function getConfig(): InfrastructureConfig {
  const config: InfrastructureConfig = {
    awsRegion: process.env.AWS_REGION || 'us-east-1',
    // awsAccountId: process.env.AWS_ACCOUNT_ID || '',
    bucketName: process.env.BUCKET_NAME || 'mybuckett21000',
    stateKey: process.env.STATE_KEY || 'turbovets/terraform.tfstate',
    appName: process.env.APP_NAME || 'turbovets',
    environment: process.env.ENVIRONMENT || 'production',
    ecrRepoName: process.env.ECR_REPO_NAME || 'turbovets-app',
    ecrImageTag: process.env.ECR_IMAGE_TAG || 'latest',
    ecsClusterName: process.env.ECS_CLUSTER_NAME || 'turbovets-cluster',
    ecsServiceName: process.env.ECS_SERVICE_NAME || 'turbovets-service',
    ecsTaskFamily: process.env.ECS_TASK_FAMILY || 'turbovets-task',
    ecsContainerPort: parseInt(process.env.ECS_CONTAINER_PORT || '3000', 10),
    ecsDesiredCount: parseInt(process.env.ECS_DESIRED_COUNT || '2', 10),
    vpcCidr: process.env.VPC_CIDR || '10.0.0.0/16',
    privateSubnet1Cidr: process.env.PRIVATE_SUBNET_1_CIDR || '10.0.1.0/24',
    privateSubnet2Cidr: process.env.PRIVATE_SUBNET_2_CIDR || '10.0.2.0/24',
    publicSubnet1Cidr: process.env.PUBLIC_SUBNET_1_CIDR || '10.0.101.0/24',
    publicSubnet2Cidr: process.env.PUBLIC_SUBNET_2_CIDR || '10.0.102.0/24',
    containerCpu: process.env.CONTAINER_CPU || '256',
    containerMemory: process.env.CONTAINER_MEMORY || '512',
    logRetentionDays: parseInt(process.env.LOG_RETENTION_DAYS || '7', 10),
  };

  // // Validate required config
  // if (!config.awsAccountId) {
  //   throw new Error('AWS_ACCOUNT_ID environment variable is required');
  // }

  return config;
}
