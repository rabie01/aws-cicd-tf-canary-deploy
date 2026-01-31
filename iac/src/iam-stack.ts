import { Construct } from 'constructs';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InfrastructureConfig } from './config';
import { dataAwsCallerIdentity } from '@cdktf/provider-aws';

export interface IamStackOutput {
  ecsTaskExecutionRoleArn: string;
  ecsTaskRoleArn: string;
}

export class IamStack extends Construct {
  public readonly output: IamStackOutput;

  constructor(scope: Construct, id: string, config: InfrastructureConfig, ecrRepoArn: string) {
    super(scope, id);
    //get account_id
    const caller = new dataAwsCallerIdentity(this, 'current');
    
    // ECS Task Execution Role - for pulling images and pushing logs
    const ecsTaskExecutionRole = new IamRole(this, 'ecs_task_execution_role', {
      name: `${config.appName}-ecs-task-execution-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${config.appName}-ecs-task-execution-role`,
        Environment: config.environment,
      },
    });

    // Attach AWS managed policy for ECS task execution
    new IamRolePolicyAttachment(this, 'ecs_task_execution_policy', {
      role: ecsTaskExecutionRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    // Add inline policy for ECR access (least privilege)
    new IamRolePolicy(this, 'ecs_task_execution_ecr_policy', {
      name: `${config.appName}-ecr-access`,
      role: ecsTaskExecutionRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ecr:GetAuthorizationToken',
              'ecr:BatchGetImage',
              'ecr:GetDownloadUrlForLayer',
            ],
            Resource: ecrRepoArn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${config.awsRegion}:${caller.accountid}:log-group:/ecs/${config.appName}:*`,
          },
        ],
      }),
    });

    // ECS Task Role - for app-specific permissions (CloudWatch, S3, etc.)
    const ecsTaskRole = new IamRole(this, 'ecs_task_role', {
      name: `${config.appName}-ecs-task-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${config.appName}-ecs-task-role`,
        Environment: config.environment,
      },
    });

    // Add CloudWatch Logs permissions for app logging
    new IamRolePolicy(this, 'ecs_task_cloudwatch_policy', {
      name: `${config.appName}-cloudwatch-logs`,
      role: ecsTaskRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${config.awsRegion}:${caller.accountid}:log-group:/ecs/${config.appName}:*`,
          },
        ],
      }),
    });

    this.output = {
      ecsTaskExecutionRoleArn: ecsTaskExecutionRole.arn,
      ecsTaskRoleArn: ecsTaskRole.arn,
    };
  }
}
