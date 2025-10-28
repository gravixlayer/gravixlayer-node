import { Sandbox } from './dist/index.js';

const sandbox = await Sandbox.create({
    template: "python-base-v1",
    provider: "gravix",
    region: "eu-west-1",
    timeout: 1800,
    metadata: { project: "my-app", env: "production", user_id: "user123" }
});

console.log(`Created: ${sandbox.sandbox_id}`);
console.log(`Template: ${sandbox.template}`);
console.log(`Timeout: ${sandbox.timeout}s`);
console.log(`Status: ${sandbox.status}`);

// Clean up
await sandbox.kill();