#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');

console.log('🚀 HALO Universe Environment Setup');
console.log('=====================================\n');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists!');
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('GROQ_API_KEY=')) {
    console.log('✅ GROQ_API_KEY is already configured');
  } else {
    console.log('⚠️  GROQ_API_KEY is missing from .env file');
  }
} else {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Groq API Configuration
# Get your free API key from: https://console.groq.com/
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration
PORT=3000
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Get your free Groq API key from: https://console.groq.com/');
  console.log('2. Replace "your_groq_api_key_here" in the .env file with your actual API key');
  console.log('3. Run: npm run dev');
}

console.log('\n🔗 Get your free Groq API key: https://console.groq.com/');
