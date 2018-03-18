'use strict';

class DependsOn {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;

        this.provider = this.serverless.getProvider('aws');

        this.hooks = {
            'before:package:finalize': this.addDependsOn.bind(this)
        };
    }

    addDependsOn() {
        const fnList = [];
        const fnMap = new Map();
        const logicalToName = new Map();

        // Find function definitions and their CloudFormation logical ids
        const functions = this.serverless.service.functions;
        for (let key in functions) {
            if (functions.hasOwnProperty(key)) {
                const logicalId = this.provider.naming.getLambdaLogicalId(key);

                let path;
                const events = functions[key].events;
                if (events && events.length > 0) {
                    events.forEach(e => {
                        if (e.http) {
                            path = e.http.path;
                        }
                    })
                }

                const f = { name: key, path: path, logicalId: logicalId };
                fnList.push(f);
                fnMap.set(key, f);
                logicalToName.set(logicalId, key);
            }
        }

        // Generate simple dependsOn chain
        for (let i = 1; i < fnList.length; i++) {
            fnList[i].dependsOn = fnList[i - 1].logicalId;
            fnMap.set(fnList[i].name, fnList[i]);
            this.serverless.cli.log(fnList[i].name + ' dependsOn ' + fnList[i - 1].name)
        }

        // Update CloudFormation template
        const cfResources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        for (let key in cfResources) {
            if (cfResources.hasOwnProperty(key)) {
                const resource = cfResources[key];
                if (resource.Type === 'AWS::Lambda::Function') {
                    const fnName = logicalToName.get(key);
                    const f = fnMap.get(fnName);
                    if (f.dependsOn) {
                       resource.DependsOn = f.dependsOn;
                    }
                }
            }
        }
    }
}

module.exports = DependsOn;