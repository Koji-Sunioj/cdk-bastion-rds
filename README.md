# Notes from Koji

the name of the stack has to do with Aurora, as I was originally testing out Aurora-PostgresQL database with bastion host. However, it seemed expensive so I switched to a minimal Databasse instance and hopefully it parsed with free tier. Name is misleading, since there is no Aurora provisioned database - however there is no way to rename the stack at this point unless I tear it down and init a CDK project from a different folder.§

# Purpose

to bootstrap a backend with Api Gateway, Lambda Function, a PostgresQL database which the lambda can access with Secrets manager, and using an EC2 instance deployed in the public subnet of the VPC which the RDS resides in order to access / create tables.

useful commands for starting / stopping / describing the bastion host (displayed in the terminal during 'cdk-deploy':

```
aws ec2 stop-instances --instance-ids <instance id>
aws ec2 start-instances --instance-ids <instance id>
aws ec2 describe-instance-status --instance-id <instance id>
aws ec2 describe-instances --instance-ids i-003ef474d8f3ac370 --query 'Reservations[*].Instances[*].PublicIpAddress' --output text
```
Note that the public IP address of the EC2 bastion host can change when starting / stopping. can query the address this way:

```
aws ec2 describe-instances --instance-ids <instance id> --query 'Reservations[*].Instances[*].PublicIpAddress' --output text
```


# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
