import { App, TerraformStack, TerraformOutput, S3Backend  } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { getConfig } from './config';
import { VpcStack } from './vpc-stack';
import { EcrStack } from './ecr-stack';
import { IamStack } from './iam-stack';
import { EcsStack } from './ecs-stack';

const app = new App();

try {
  const config = getConfig();

  const stack = new TerraformStack(app, 'turbovets');

   // 2. Add S3 Backend Configuration right here
  new S3Backend(stack, {
  bucket: config.bucketName,
  key: config.stateKey,
  region: config.awsRegion,
  encrypt: true,
  // This enables the new native S3 locking (no DynamoDB needed)
  // use_lockfile: true, 
}).addOverride('use_lockfile', true);

  // Configure AWS Provider
  new AwsProvider(stack, 'aws', {
    region: config.awsRegion,
    defaultTags: [
      {
        tags: {
          Project: config.appName,
          Environment: config.environment,
          ManagedBy: 'CDKTF',
        },
      },
    ],
  });

  // Create VPC and networking
  const vpcStack = new VpcStack(stack, 'vpc', config);

  // Create ECR repository
  const ecrStack = new EcrStack(stack, 'ecr', config);

  // Create IAM roles
  const iamStack = new IamStack(stack, 'iam', config, ecrStack.output.repositoryArn);

  // Create ECS cluster and service
  const ecsStack = new EcsStack(
    stack,
    'ecs',
    config,
    vpcStack.output,
    ecrStack.output.repositoryUrl,
    iamStack.output.ecsTaskExecutionRoleArn,
    iamStack.output.ecsTaskRoleArn,
  );

  // Export outputs
  new TerraformOutput(stack, 'ecr_repository_url', {
    value: ecrStack.output.repositoryUrl,
    description: 'ECR Repository URL',
  });

  new TerraformOutput(stack, 'alb_dns_name', {
    value: ecsStack.output.albDnsName,
    description: 'ALB DNS Name - Application endpoint',
  });

  new TerraformOutput(stack, 'ecs_cluster_name', {
    value: ecsStack.output.clusterName,
    description: 'ECS Cluster Name',
  });

  new TerraformOutput(stack, 'ecs_service_name', {
    value: ecsStack.output.serviceName,
    description: 'ECS Service Name',
  });

  new TerraformOutput(stack, 'vpc_id', {
    value: vpcStack.output.vpcId,
    description: 'VPC ID',
  });

  app.synth();
} catch (error) {
  console.error('Error setting up infrastructure:', error);
  process.exit(1);
}
