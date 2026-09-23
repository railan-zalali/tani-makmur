const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERCEL = `node "C:\\Users\\USER\\AppData\\Roaming\\npm\\node_modules\\vercel\\dist\\index.js"`;
const PROJECT = 'tani-makmur';
const name = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
const value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthenN6dGFtY25wY2RldHZucHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NjE2NTAsImV4cCI6MjEwMzUzNzY1MH0.v_AkGU9887w2tI0WOELkr2zUlB3930THr68RCB-ZAco';
const ENVS = ['production', 'preview', 'development'];
const tmp = path.join(__dirname, 'tmp_env2.txt');

fs.writeFileSync(tmp, value);
for (const env of ENVS) {
  try { execSync(`${VERCEL} env rm ${name} ${env} --yes --project ${PROJECT}`, { stdio: 'ignore' }); } catch {}
  try {
    execSync(`${VERCEL} env add ${name} ${env} --type config --project ${PROJECT} < "${tmp}"`, { stdio: 'inherit', shell: 'cmd.exe' });
    console.log(`Set ${name} for ${env}`);
  } catch(e) { console.error(`Failed ${name} for ${env}:`, e.message); }
}
fs.unlinkSync(tmp);

console.log('\nRedeploying...');
try {
  execSync(`${VERCEL} redeploy --prod --project ${PROJECT} --yes`, { stdio: 'inherit' });
} catch(e) { console.log('Redeploy failed:', e.message); }
