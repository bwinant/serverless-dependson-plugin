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

    isEnabled() {
        const cliOption = this.options['dependson-plugin'];
        if (cliOption === 'disabled' || cliOption === 'off' || cliOption === 'false') {
            return false;
        }

        const custom = this.serverless.service.custom;
        if (custom && custom.dependsOn && (custom.dependsOn.enabled === false || custom.dependsOn.enabled === 'false')) {
            return false;
        }

        return true;
    }

    getChains() {
        const custom = this.serverless.service.custom;
        if (custom && custom.dependsOn && custom.dependsOn.chains) {
            const chains = custom.dependsOn.chains;
            if ((typeof chains === 'number') && (chains > 1)) {
                return Math.trunc(chains);
            }
        }

        return 1;
    }

    addDependsOn() {
        if (!this.isEnabled()) {
            this.serverless.cli.log('dependson-plugin disabled');
            return;
        }

        const fnList = [];
        const fnMap = new Map();
        const logicalToName = new Map();

        // Find function definitions and their CloudFormation logical ids
        const functions = this.serverless.service.functions;
        for (let name in functions) {
            if (functions.hasOwnProperty(name)) {
                const logicalId = this.provider.naming.getLambdaLogicalId(name);

                const f = { name: name, logicalId: logicalId };
                fnList.push(f);
                fnMap.set(name, f);
                logicalToName.set(logicalId, name);
            }
        }

        const chains = this.getChains();

        // Generate dependsOn chain(s)
        for (let i = chains; i < fnList.length; i++) {
            const parent = i - chains;

            fnList[i].dependsOn = fnList[parent].logicalId;
            fnMap.set(fnList[i].name, fnList[i]);
            this.serverless.cli.log(fnList[i].name + ' dependsOn ' + fnList[parent].name);
        }

        // Update CloudFormation template
        const resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;
        for (let key in resources) {
            if (resources.hasOwnProperty(key)) {
                const resource = resources[key];
                if (resource.Type === 'AWS::Lambda::Function') {
                    const fnName = logicalToName.get(key);
                    const f = fnMap.get(fnName);
                    if (f.dependsOn) {
                       resource.DependsOn = (resource.DependsOn === undefined)
                           ? f.dependsOn
                           : [f.dependsOn].concat(resource.DependsOn);
                    }
                }
            }
        }
    }
}

module.exports = DependsOn;