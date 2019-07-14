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

        // Find function definitions and their CloudFormation logical ids
        const functions = this.serverless.service.functions;
        for (let name in functions) {
            if (functions.hasOwnProperty(name)) {
                const logicalId = this.provider.naming.getLambdaLogicalId(name);
                fnList.push({ name: name, logicalId: logicalId });
            }
        }

        const chains = this.getChains();

        // Generate dependsOn chain(s)
        for (let i = chains; i < fnList.length; i++) {
            const parent = i - chains;

            fnList[i].dependsOn = fnList[parent].logicalId;
            this.serverless.cli.log(fnList[i].name + ' dependsOn ' + fnList[parent].name);
        }

        // Update CloudFormation template
        const resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources;

        for (const fn of fnList) {
            if (resources.hasOwnProperty(fn.logicalId)) {
                const resource = resources[fn.logicalId];
                if (resource.Type === 'AWS::Lambda::Function') {
                    if (fn.dependsOn) {
                        resource.DependsOn = (resource.DependsOn === undefined)
                            ? fn.dependsOn
                            : [fn.dependsOn].concat(resource.DependsOn);
                    }
                }
            }
        }
    }
}

module.exports = DependsOn;