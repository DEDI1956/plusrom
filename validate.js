#!/usr/bin/env node

/**
 * Validation script for ROOM PLUS setup
 * Checks if all required files and configurations are present
 */

const fs = require('fs');
const path = require('path');
const packageJson = require('./package.json');

console.log('🔍 Validating ROOM PLUS setup...\n');

const requiredFiles = [
  'package.json',
  'server/server.js',
  'server/app.js',
  'server/config/database.js',
  'server/config/cloudinary.js',
  'server/models/Room.js',
  'server/models/Message.js',
  'server/routes/rooms.js',
  'server/routes/upload.js',
  'server/socket/handlers.js',
  'public/index.html',
  'public/chat.html',
  'public/assets/css/all.css',
  'public/assets/css/style.css',
  'public/assets/css/animations.css',
  'public/assets/js/config.js',
  'public/assets/js/utils.js',
  'public/assets/js/socket-client.js',
  'public/assets/js/ui.js',
  'public/assets/js/app.js',
  'public/assets/js/chat.js',
  '.env.example',
  'schema.sql',
  'README.md',
  'DEPLOYMENT_CHECKLIST.md',
  'QUICKSTART.md'
];

const requiredEnvVars = [
  'DATABASE_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NODE_ENV',
  'PORT',
  'CLIENT_URL'
];

let errors = [];
let warnings = [];

// Check required files
console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ ${file}`);
  } else {
    errors.push(`Missing file: ${file}`);
    console.log(`   ❌ ${file}`);
  }
});

console.log('');

// Check dependencies
console.log('📦 Checking dependencies...');
const requiredDeps = [
  'express',
  'socket.io',
  'pg',
  'dotenv',
  'multer',
  'cloudinary',
  'cors',
  'uuid'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies && packageJson.dependencies[dep]) {
    console.log(`   ✅ ${dep}: ${packageJson.dependencies[dep]}`);
  } else {
    warnings.push(`Missing dependency: ${dep}`);
    console.log(`   ⚠️  ${dep}: NOT FOUND`);
  }
});

console.log('');

// Check Node.js version requirement
console.log('⚙️  Checking Node.js version...');
if (packageJson.engines && packageJson.engines.node) {
  console.log(`   ✅ Required: ${packageJson.engines.node}`);
} else {
  warnings.push('No Node.js version specified in package.json');
  console.log('   ⚠️  No Node.js version requirement found');
}

console.log('');

// Check scripts
console.log('📝 Checking npm scripts...');
const requiredScripts = ['start'];
requiredScripts.forEach(script => {
  if (packageJson.scripts && packageJson.scripts[script]) {
    console.log(`   ✅ ${script}: ${packageJson.scripts[script]}`);
  } else {
    errors.push(`Missing script: ${script}`);
    console.log(`   ❌ ${script}: NOT FOUND`);
  }
});

console.log('');

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📊 VALIDATION SUMMARY\n');
console.log(`✅ Files found: ${requiredFiles.length - errors.filter(e => e.includes('Missing file')).length}/${requiredFiles.length}`);
console.log(`✅ Dependencies: ${requiredDeps.length - warnings.filter(w => w.includes('dependency')).length}/${requiredDeps.length}`);
console.log(`✅ Scripts: ${requiredScripts.length}/${requiredScripts.length}`);

if (warnings.length > 0) {
  console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
  warnings.forEach(warn => console.log(`   - ${warn}`));
}

if (errors.length > 0) {
  console.log(`\n❌ ERRORS (${errors.length}):`);
  errors.forEach(err => console.log(`   - ${err}`));
  console.log('\n❌ Setup validation FAILED! Please fix the errors above.');
  process.exit(1);
} else {
  console.log('\n✅ Setup validation PASSED! All required components are present.');
  console.log('\n🚀 Next steps:');
  console.log('   1. Copy .env.example to .env');
  console.log('   2. Fill in your environment variables');
  console.log('   3. Run: npm start');
  console.log('   4. Visit: http://localhost:3000');
  process.exit(0);
}
