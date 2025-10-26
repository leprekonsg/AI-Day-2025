// In: build.js

const fs = require('fs');
// This line loads variables from the .env file into process.env
require('dotenv').config();

console.log('Starting Firebase config build...');

// Path to the template and the final output file
const templatePath = 'shared/firebase-init.template.js';
const outputPath = 'shared/firebase-init.js';

// Read the template file
let templateContent;
try {
    templateContent = fs.readFileSync(templatePath, 'utf8');
} catch (err) {
    console.error(`Error: Could not read template file at ${templatePath}. Make sure the file exists.`);
    process.exit(1);
}


// Check if all required environment variables are set
const requiredVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
];

const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.error(`Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please ensure they are set in your .env file or your CI/CD environment.');
    process.exit(1);
}

// Replace each placeholder with the corresponding environment variable
templateContent = templateContent.replace(/__FIREBASE_API_KEY__/g, process.env.FIREBASE_API_KEY);
templateContent = templateContent.replace(/__FIREBASE_AUTH_DOMAIN__/g, process.env.FIREBASE_AUTH_DOMAIN);
templateContent = templateContent.replace(/__FIREBASE_PROJECT_ID__/g, process.env.FIREBASE_PROJECT_ID);
templateContent = templateContent.replace(/__FIREBASE_STORAGE_BUCKET__/g, process.env.FIREBASE_STORAGE_BUCKET);
templateContent = templateContent.replace(/__FIREBASE_MESSAGING_SENDER_ID__/g, process.env.FIREBASE_MESSAGING_SENDER_ID);
templateContent = templateContent.replace(/__FIREBASE_APP_ID__/g, process.env.FIREBASE_APP_ID);

// Write the final, populated content to the output file
fs.writeFileSync(outputPath, templateContent);

console.log(`✅ Successfully created configuration at ${outputPath}`);