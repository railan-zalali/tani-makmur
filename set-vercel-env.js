const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERCEL = `node "C:\\Users\\USER\\AppData\\Roaming\\npm\\node_modules\\vercel\\dist\\index.js"`;
const PROJECT = 'tani-makmur';

const envVars = [
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthenN6dGFtY25wY2RldHZucHVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk2MTY1MCwiZXhwIjoyMTAzNTM3NjUwfQ.8sAGDDgB2P3AK6-61nI7S5MDSUX5i323cZt3hXBmDH0',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthenN6dGFtY25wY2RldHZucHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjE2NTAsImV4cCI6MjEwMzUzNzY1MH0.v_AkGU9887w2tI0WOELkr2zUlB3930THr68RCB-ZAco',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    value: 'sb_publishable_ikwjIKh2A7s2n_VDHG_4qA_BSPnUZBI',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    value: 'https://kazsztamcnpcdetvnpuj.supabase.co',
  }
];

const ENVS = ['production', 'preview', 'development'];

for (const { name, value } of envVars) {
  for (const env of ENVS) {
    try {
      execSync(`${VERCEL} env rm ${name} ${env} --yes --project ${PROJECT}`, { stdio: 'ignore' });
    } catch {}
  }
  
  const tmp = path.join(__dirname, `tmp_env_${name}.txt`);
  fs.writeFileSync(tmp, value);
  for (const env of ENVS) {
    try {
      execSync(`${VERCEL} env add ${name} ${env} --project ${PROJECT} < "${tmp}"`, { stdio: 'inherit', shell: 'cmd.exe' });
      console.log(`Set ${name} for ${env}`);
    } catch(e) {
      console.error(`Failed ${name} for ${env}: ${e.message}`);
    }
  }
  fs.unlinkSync(tmp);
}

console.log('Done!');
