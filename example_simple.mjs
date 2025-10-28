import { Sandbox } from './dist/index.js';

// Create sandbox - will automatically display creation info
const sandbox = await Sandbox.create({
    template: "python-base-v1",
    timeout: 600,
    metadata: { project: "my-app" }
});

// Run code
const result = await sandbox.runCode("import sys; print(sys.version)");
console.log(result.logs.stdout[0]);