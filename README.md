# Serverless DependsOn Plugin

If you have a Serverless application that executes AWS Lambdas inside a VPC, then chances are you have encountered this error:

```
Your request has been throttled by EC2, please make sure you have enough API rate limit. EC2 Error Code: RequestLimitExceeded. EC2 Error Message: Request limit exceeded.
```

One solution to this error is to make all your lambdas dependent on each other in a chain. This will make Cloudformation deploy your lambdas sequentially and prevent the RequestLimitExceeded error.
For more information on this error see: https://github.com/serverless/serverless/issues/3339

The drawback to this solution is that you have to manually customize the `Resources` section of your `serverless.yml` and override the lambda definitions to set the CloudFormation [DependsOn](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html) attribute. This plugin will do that automatically.

## Setup

* Install via npm:
```
npm install serverless-dependson-plugin --save-dev
```

* Update the `plugins` section of your `serverless.yml`:
```
plugins:
    - serverless-dependson-plugin
```

* Deploy without errors!

## Gotchas

Because your lambdas will now be deployed sequentially, your stack deployment time may _drastically_ increase. But it is still better than not being able to deploy at all!     