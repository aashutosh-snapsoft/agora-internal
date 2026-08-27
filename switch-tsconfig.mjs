import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';

let tsconfigPath = 'tsconfig.json';
let nextConfigPath = 'next.config.mjs';
let envConfigPath = 'src/config.ts';

switch (env) {
  case 'development':
    tsconfigPath = path.join(__dirname, 'tsconfig.dev.json');
    nextConfigPath = path.join(__dirname, 'next.config.dev.mjs');
    envConfigPath = path.join(__dirname, 'src/config.dev.ts');
    break;
  case 'production':
    tsconfigPath = path.join(__dirname, 'tsconfig.prod.json');
    nextConfigPath = path.join(__dirname, 'next.config.prod.mjs');
    envConfigPath = path.join(__dirname, 'src/config.prod.ts');
    break;
  default:
    console.error(`No tsconfig file found for environment: ${env}`);
    process.exit(1);
}

const defaultTsconfigPath = path.join(__dirname, 'tsconfig.json');
const defaultNextConfigPath = path.join(__dirname, 'next.config.mjs');
const defaultEnvConfigPath = path.join(__dirname, 'src/config.ts');
if (fs.existsSync(tsconfigPath)) {
  fs.copyFileSync(tsconfigPath, defaultTsconfigPath);
  console.log(`Copied ${tsconfigPath} to ${defaultTsconfigPath}.`);
} else {
  console.error(`No tsconfig file found for environment: ${env}`);
  process.exit(1);
}

if (fs.existsSync(nextConfigPath)) {
  fs.copyFileSync(nextConfigPath, defaultNextConfigPath);
  console.log(`Copied ${nextConfigPath} to ${defaultNextConfigPath}.`);
} else {
  console.error(`No next.config file found for environment: ${env}`);
  process.exit(1);
}

if (fs.existsSync(envConfigPath)) {
  fs.copyFileSync(envConfigPath, defaultEnvConfigPath);
  console.log(`Copied ${envConfigPath} to ${defaultEnvConfigPath}.`);
} else {
  console.error(`No .env file found for environment: ${env}`);
  process.exit(1);
}
