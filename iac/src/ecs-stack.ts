import { Construct } from 'constructs';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsClusterCapacityProviders } from '@cdktf/provider-aws/lib/ecs-cluster-capacity-providers';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { InfrastructureConfig } from './config';
import { VpcStackOutput } from './vpc-stack';

export interface EcsStackOutput {
  clusterName: string;
  clusterArn: string;
  serviceName: string;
  albDnsName: string;
}

export class EcsStack extends Construct {
  public readonly output: EcsStackOutput;

  constructor(
    scope: Construct,
    id: string,
    config: InfrastructureConfig,
    vpcOutput: VpcStackOutput,
    ecrRepoUrl: string,
    ecsTaskExecutionRoleArn: string,
    ecsTaskRoleArn: string,
  ) {
    super(scope, id);

    // Create CloudWatch Log Group
    const logGroup = new CloudwatchLogGroup(this, 'ecs_log_group', {
      name: `/ecs/${config.appName}`,
      retentionInDays: config.logRetentionDays,
      tags: {
        Name: `${config.appName}-ecs-logs`,
        Environment: config.environment,
      },
    });

    // Create ECS Cluster
    const cluster = new EcsCluster(this, 'main_cluster', {
      name: config.ecsClusterName,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `${config.appName}-cluster`,
        Environment: config.environment,
      },
    });

    // Add Fargate capacity provider
    new EcsClusterCapacityProviders(this, 'cluster_capacity_providers', {
      clusterName: cluster.name,
      capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
      defaultCapacityProviderStrategy: [
        {
          capacityProvider: 'FARGATE',
          weight: 100,
          base: config.ecsDesiredCount,
        },
      ],
    });

    // Create Application Load Balancer
    const alb = new Lb(this, 'app_alb', {
      name: `${config.appName}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [vpcOutput.albSecurityGroupId],
      subnets: [vpcOutput.publicSubnet1Id, vpcOutput.publicSubnet2Id],
      enableDeletionProtection: false,
      tags: {
        Name: `${config.appName}-alb`,
        Environment: config.environment,
      },
    });

    // Create Target Group
    const targetGroup = new LbTargetGroup(this, 'app_tg', {
      name: `${config.appName}-tg`,
      port: config.ecsContainerPort,
      protocol: 'HTTP',
      vpcId: vpcOutput.vpcId,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      tags: {
        Name: `${config.appName}-tg`,
        Environment: config.environment,
      },
    });

    // Create ALB Listener
    new LbListener(this, 'app_listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Create ECS Task Definition
    const taskDef = new EcsTaskDefinition(this, 'app_task_def', {
      family: config.ecsTaskFamily,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: config.containerCpu,
      memory: config.containerMemory,
      executionRoleArn: ecsTaskExecutionRoleArn,
      taskRoleArn: ecsTaskRoleArn,
      containerDefinitions: JSON.stringify([
        {
          name: config.appName,
          image: `${ecrRepoUrl}:${config.ecrImageTag}`,
          portMappings: [
            {
              containerPort: config.ecsContainerPort,
              hostPort: config.ecsContainerPort,
              protocol: 'tcp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': logGroup.name,
              'awslogs-region': config.awsRegion,
              'awslogs-stream-prefix': 'ecs',
            },
          },
          environment: [
            {
              name: 'NODE_ENV',
              value: config.environment,
            },
            {
              name: 'PORT',
              value: config.ecsContainerPort.toString(),
            },
          ],
          essential: true,
        },
      ]),
      tags: {
        Name: `${config.appName}-task-def`,
        Environment: config.environment,
      },
    });

    // Create ECS Service
    const service = new EcsService(this, 'app_service', {
      name: config.ecsServiceName,
      cluster: cluster.arn,
      taskDefinition: taskDef.arn,
      desiredCount: config.ecsDesiredCount,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      networkConfiguration: {
        subnets: [vpcOutput.privateSubnet1Id, vpcOutput.privateSubnet2Id],
        securityGroups: [vpcOutput.ecsSecurityGroupId],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: config.appName,
          containerPort: config.ecsContainerPort,
        },
      ],
      tags: {
        Name: `${config.appName}-service`,
        Environment: config.environment,
      },
    });

    // Auto Scaling Target
    const scalingTarget = new AppautoscalingTarget(this, 'service_scaling_target', {
      maxCapacity: 4,
      minCapacity: config.ecsDesiredCount,
      resourceId: `service/${cluster.name}/${service.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    });

    // CPU-based scaling policy
    new AppautoscalingPolicy(this, 'cpu_scaling_policy', {
      name: `${config.appName}-cpu-scaling`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageCPUUtilization',
        },
        scaleOutCooldown: 60,
        scaleInCooldown: 300,
      },
    });

    // Memory-based scaling policy
    new AppautoscalingPolicy(this, 'memory_scaling_policy', {
      name: `${config.appName}-memory-scaling`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 80.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ECSServiceAverageMemoryUtilization',
        },
        scaleOutCooldown: 60,
        scaleInCooldown: 300,
      },
    });

    this.output = {
      clusterName: cluster.name,
      clusterArn: cluster.arn,
      serviceName: service.name,
      albDnsName: alb.dnsName,
    };
  }
}
