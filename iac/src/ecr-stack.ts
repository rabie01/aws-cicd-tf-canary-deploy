import { Construct } from 'constructs';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { EcrRepositoryPolicy } from '@cdktf/provider-aws/lib/ecr-repository-policy';
import { EcrLifecyclePolicy } from '@cdktf/provider-aws/lib/ecr-lifecycle-policy';
import { InfrastructureConfig } from './config';

export interface EcrStackOutput {
  repositoryUrl: string;
  repositoryArn: string;
  repositoryName: string;
}

export class EcrStack extends Construct {
  public readonly output: EcrStackOutput;

  constructor(scope: Construct, id: string, config: InfrastructureConfig) {
    super(scope, id);

    // Create ECR Repository
    const ecrRepo = new EcrRepository(this, 'app_repo', {
      name: config.ecrRepoName,
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      imageTagMutability: 'MUTABLE',
      tags: {
        Name: `${config.appName}-ecr-repo`,
        Environment: config.environment,
      },
    });

    // Lifecycle policy - keep only last 10 images
    new EcrLifecyclePolicy(this, 'lifecycle_policy', {
      repository: ecrRepo.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: 'Keep last 10 images',
            selection: {
              tagStatus: 'tagged',
              tagPrefixList: ['v'],
              countType: 'imageCountMoreThan',
              countNumber: 10,
            },
            action: {
              type: 'expire',
            },
          },
          {
            rulePriority: 2,
            description: 'Remove untagged images after 7 days',
            selection: {
              tagStatus: 'untagged',
              countType: 'sinceImagePushed',
              countUnit: 'days',
              countNumber: 7,
            },
            action: {
              type: 'expire',
            },
          },
        ],
      }),
    });

    // Repository policy - allow ECS task execution role to pull images
    new EcrRepositoryPolicy(this, 'ecr_policy', {
      repository: ecrRepo.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: [
              'ecr:GetAuthorizationToken',
              'ecr:BatchGetImage',
              'ecr:GetDownloadUrlForLayer',
            ],
          },
        ],
      }),
    });

    this.output = {
      repositoryUrl: ecrRepo.repositoryUrl,
      repositoryArn: ecrRepo.arn,
      repositoryName: ecrRepo.name,
    };
  }
}
