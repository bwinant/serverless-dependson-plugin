# Serverless DependsOn Plugin

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/serverless-dependson-plugin.svg)](https://badge.fury.io/js/serverless-dependson-plugin)
[![downloads](https://img.shields.io/npm/dt/serverless-dependson-plugin.svg)](https://www.npmjs.com/package/serverless-dependson-plugin)

If you have a [Serverless](https://serverless.com/framework/docs/) application that executes AWS Lambdas inside a VPC, then chances are you have encountered this error:

```
Your request has been throttled by EC2, please make sure you have enough API rate limit. 
EC2 Error Code: RequestLimitExceeded. EC2 Error Message: Request limit exceeded.
```

One solution to this error is to make all your lambdas dependent on each other in a chain. This will make CloudFormation deploy your lambdas sequentially and prevent the RequestLimitExceeded error.
For more information on this error see: https://github.com/serverless/serverless/issues/3339

The drawback to this solution is that you have to manually customize the `Resources` section of your `serverless.yml` and override the lambda definitions to set the CloudFormation [DependsOn](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-attribute-dependson.html) attribute. This plugin will do that automatically.

## Requirements

- Node.js 8+
- NPM 5+
- Serverless Framework 1.32+ 


## Installation

**Install Serverless:**

```
npm install -g serverless
```

**Install plugin via npm:**
```
npm install serverless-dependson-plugin --save-dev
```

## Configuration

**Update the `plugins` section of your `serverless.yml`:**
```yaml
plugins:
    - serverless-dependson-plugin
```

Deploy without errors!


**Disable the plugin**

Sometimes you may be able to deploy your serverless application without receiving the RequestLimitExceeded error. To test deploying your application without throttling, you can temporarily disable the plugin by:

Passing the following command line option to serverless:
```
--dependson-plugin=[disabled|off|false]
```

Adding a `dependsOn` section to the `custom` section of your `serverless.yml`:
```yaml
custom:
  dependsOn:
    enabled: false     
```

**Deployment performance**

Because your lambdas will now be deployed sequentially, your stack deployment time will **drastically** increase. You can try to improve your deployment time by letting the plugin build multiple lambda DependsOn "chains".
This will let CloudFormation do some parallelization of the lambda deployments.

You can configure this by adding a `dependsOn` section to the `custom` section of your `serverless.yml`:

```yaml
custom:
  dependsOn:
    chains: <an integer greater than 1>
```

If the value of the `chains` parameter is not an integer or is less than 1, it will default to 1 without failing the deployment. 

Enabling this option may still trigger the RequestLimitExceeded error. Amazon does not disclose what will trip their rate limiter, so you may need to experiment with this option to get the best deployment performance without hitting the request limit.

## Examples
 
```yaml
plugins:
    - serverless-dependson-plugin
    
custom:
  dependsOn:
    # Optional. Defaults to true, set to false to disable the plugin
    enabled: true
    # Optional. Sets amount of lambda deployment parallelization plugin will attempt to create. Defaults to 1  
    chains: 3    
      
```  
