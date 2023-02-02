# Notes from Koji

the name of the stack has to do with Aurora, as I was originally testing out Aurora-PostgresQL database with bastion host. However, it seemed expensive so I switched to a minimal Databasse instance and hopefully it parsed with free tier. Name is misleading, since there is no Aurora provisioned database - however there is no way to rename the stack at this point unless I tear it down and init a CDK project from a different folder.§

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
