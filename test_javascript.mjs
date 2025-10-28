import { Sandbox } from './dist/index.js';

// Create sandbox with JavaScript template
const sandbox = await Sandbox.create({
    template: "javascript-base-v1",  // Use JavaScript template
    provider: "gravix",
    region: "eu-west-1",
    timeout: 600,
    metadata: { project: "js-test", language: "javascript" }
});

console.log(`Created: ${sandbox.sandbox_id}`);
console.log(`Template: ${sandbox.template}`);
console.log(`Timeout: ${sandbox.timeout}s`);

try {
    // Run simple JavaScript code
    console.log("\n--- Running simple JavaScript ---");
    const result1 = await sandbox.runCode("console.log('Hello from JavaScript!');", "javascript");
    for (const line of result1.logs.stdout) {
        console.log(line);
    }
    
    // Run more complex JavaScript code
    console.log("\n--- Running complex JavaScript ---");
    const jsCode = `
const numbers = [1, 2, 3, 4, 5];
const squares = numbers.map(n => n * n);
console.log('Numbers:', numbers);
console.log('Squares:', squares);

// Object manipulation
const person = {
    name: 'Alice',
    age: 30,
    city: 'New York'
};

console.log('Person:', JSON.stringify(person, null, 2));

// Async example with setTimeout simulation
function greet(name) {
    return \`Hello, \${name}! Welcome to GravixLayer Sandbox.\`;
}

console.log(greet('Developer'));

// Math operations
const result = Math.sqrt(16) + Math.pow(2, 3);
console.log('Math result:', result);
`;
    
    const result2 = await sandbox.runCode(jsCode, "javascript");
    for (const line of result2.logs.stdout) {
        console.log(line);
    }
    
    // Test Node.js specific features
    console.log("\n--- Testing Node.js features ---");
    const nodeCode = `
// Check Node.js version
console.log('Node.js version:', process.version);

// File system operations
const fs = require('fs');
const path = require('path');

// Write a test file
fs.writeFileSync('/tmp/test.txt', 'Hello from Node.js!');
console.log('File written to /tmp/test.txt');

// Read the file back
const content = fs.readFileSync('/tmp/test.txt', 'utf8');
console.log('File content:', content);

// List current directory
const files = fs.readdirSync('/home/user');
console.log('Files in /home/user:', files);
`;
    
    const result3 = await sandbox.runCode(nodeCode, "javascript");
    for (const line of result3.logs.stdout) {
        console.log(line);
    }
    
    // Test package installation and usage
    console.log("\n--- Installing and using npm packages ---");
    const installResult = await sandbox.runCommand("npm", ["install", "lodash"]);
    if (installResult.exit_code === 0) {
        console.log("Lodash installed successfully");
        
        // Use the installed package
        const lodashCode = `
const _ = require('lodash');

const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const chunks = _.chunk(array, 3);
console.log('Original array:', array);
console.log('Chunked array:', chunks);

const users = [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
    { name: 'Charlie', age: 35 }
];

const names = _.map(users, 'name');
console.log('User names:', names);

const oldest = _.maxBy(users, 'age');
console.log('Oldest user:', oldest);
`;
        
        const result4 = await sandbox.runCode(lodashCode, "javascript");
        for (const line of result4.logs.stdout) {
            console.log(line);
        }
    } else {
        console.log(`Package installation failed: ${installResult.stderr}`);
    }

} finally {
    // Clean up
    await sandbox.kill();
    console.log(`\nSandbox ${sandbox.sandbox_id} terminated`);
}