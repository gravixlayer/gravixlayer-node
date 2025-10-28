import { Sandbox } from './dist/index.js';

// Create JavaScript sandbox
const sandbox = await Sandbox.create({ template: "javascript-base-v1" });

console.log(`Created: ${sandbox.sandbox_id}`);

// Run JavaScript code
const result = await sandbox.runCode(`
console.log('Hello from JavaScript sandbox!');
console.log('Node.js version:', process.version);

const data = { message: 'Success', timestamp: new Date().toISOString() };
console.log('Data:', JSON.stringify(data, null, 2));
`, "javascript");

for (const line of result.logs.stdout) {
    console.log(line);
}