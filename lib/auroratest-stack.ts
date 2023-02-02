import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";

import { Construct } from "constructs";

export class AuroratestStack extends cdk.Stack {
  public readonly test: cdk.CfnOutput;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Aurora-VPC");

    const engine = rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_14_5,
    });

    const dataBase = new rds.DatabaseInstance(this, "Database", {
      engine,
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      databaseName: "posts",
      deletionProtection: true,
    });

    const bastionSG = new ec2.SecurityGroup(this, "BastionSG", { vpc });

    bastionSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "allow HTTP traffic from anywhere"
    );

    const bastion = new ec2.Instance(this, "BastionHost", {
      instanceType: new ec2.InstanceType("t3.micro"),
      machineImage: ec2.MachineImage.genericLinux({
        "eu-north-1": "ami-00c70b245f5354c0a",
      }),
      vpc: vpc,
      instanceName: "BastionHost",
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: bastionSG,
      keyName: "hey",
    });

    this.test = new cdk.CfnOutput(this, "Ec2BastionId", {
      value: bastion.instanceId,
    });

    dataBase.connections.allowFromAnyIpv4(ec2.Port.tcp(5432));

    const postsLambda = new lambda.Function(this, "postsLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "dbLambda.handler",
      environment: { DB_SECRET: dataBase.secret?.secretName! },
    });

    postsLambda.role?.attachInlinePolicy(
      new iam.Policy(this, "userpool-policy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [dataBase.secret?.secretArn!],
          }),
        ],
      })
    );

    dataBase.grantConnect(postsLambda);

    const postsApi = new apiGateway.LambdaRestApi(this, "postsApi", {
      handler: postsLambda,
      proxy: false,
    });

    const posts = postsApi.root.addResource("posts", {
      defaultMethodOptions: { apiKeyRequired: true },
    });
    posts.addMethod("GET");
    posts.addMethod("POST");

    const post = posts.addResource("{postId}", {
      defaultMethodOptions: { apiKeyRequired: true },
    });
    post.addMethod("GET");
    post.addMethod("DELETE");
    post.addMethod("PATCH");

    const plan = postsApi.addUsagePlan("UsagePlan", {
      name: "postApiPlan",
      throttle: {
        rateLimit: 500,
        burstLimit: 500,
      },
    });
    const key = postsApi.addApiKey("ApiKey");
    plan.addApiKey(key);
    plan.addApiStage({
      stage: postsApi.deploymentStage,
    });
  }
}
