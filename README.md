# Notes from Koji

the name of the stack has to do with Aurora, as I was originally testing out Aurora-PostgresQL database with bastion host. However, it seemed expensive so I switched to a minimal Databasse instance and hopefully it parsed with free tier. Name is misleading, since there is no Aurora provisioned database - however there is no way to rename the stack at this point unless I tear it down and init a CDK project from a different folder.§

# Purpose

to bootstrap a backend with Api Gateway, Lambda Function, a PostgresQL database which the lambda can access with Secrets manager, and using an EC2 instance deployed in the public subnet of the VPC which the RDS resides in order to access / create tables.

# Workflow

When the instance is booted up, you can access the database by 1) ssh'ing into the instance, 2) installing postgres client, and 3) connecting to the rds instance in the same (private subnet) vpc. I already have a key-pair called hey, so the name reference is what you have in your console as well:

```
ssh -i "hey.pem" ubuntu@<Public IPv4 DNS>
sudo apt-get update
sudo apt-get -y install postgresql
psql -h <RDS Endpoint> -p 5432 -U postgres posts -W
```

Then enter the password into psql which is available in secrets manager, change over the database named in the stack and create some tables. the ssm is filled once the stack is built. 

```
\c posts

create table posts(
    post_id serial primary key,
    user_name varchar,
    title varchar,
    content varchar,
    created timestamp default now());

create table comments(
    comment_id serial primary key,
    post_id int not null,
    user_name varchar,
    content varchar,
    created timestamp default now(),
    FOREIGN KEY (post_id)
    REFERENCES posts (post_id) 
    on delete cascade
);
```

Stop and start the bastion host instance as needed (to maintain that the database cannot be accessed). Useful commands for starting / stopping / describing the bastion host state:

```
aws ec2 stop-instances --instance-ids <instance id>
aws ec2 start-instances --instance-ids <instance id>
aws ec2 describe-instance-status --instance-id <instance id>
```
Note that the public IP address of the EC2 bastion host can change when starting / stopping. can parse the DNS into a linux variable and ssh into it (or just grab the new DNS from the console):

```
DNS=$(aws ec2 describe-instances --instance-ids i-003ef474d8f3ac370 --query 'Reservations[*].Instances[*].PublicDnsName' --output text)
ssh -i "hey.pem" ubuntu@${DNS}
```

# What I learned

SQL is a very well defined, flexible and common database language to use. However, some downsides are how verbose the syntax can be. Also Postgres does not handle stored procedures in the same way as MySQL, but has some good things like parsing grouped rows into JSON objects, and ad-hoc sorting a column which is not indexed, or defined in a special way (like in Dynamodb).

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
