const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
require('fs').readFileSync('.env.local', 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^#\s][^=]+)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim();
});

async function run() {
  console.log('Connecting to Supabase...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env vars');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Connecting to local MySQL...');
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tanimakmur'
  });

  const [categories] = await c.query('SELECT * FROM categories');
  console.log(`Found ${categories.length} categories. Uploading...`);
  if (categories.length) {
    const { error: catErr } = await supabase.from('categories').upsert(categories);
    if (catErr) console.error('Error categories:', catErr.message);
  }

  const [products] = await c.query('SELECT * FROM products');
  console.log(`Found ${products.length} products. Uploading...`);
  if (products.length) {
    // Parse JSON fields to match postgres JSONB
    const parsedProducts = products.map(p => ({
      ...p,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
      active_ingredients: typeof p.active_ingredients === 'string' ? JSON.parse(p.active_ingredients) : p.active_ingredients,
      suitable_crops: typeof p.suitable_crops === 'string' ? JSON.parse(p.suitable_crops) : p.suitable_crops,
      is_available: !!p.is_available,
      featured: !!p.featured
    }));
    const { error: prodErr } = await supabase.from('products').upsert(parsedProducts);
    if (prodErr) console.error('Error products:', prodErr.message);
  }

  console.log('Done.');
  process.exit();
}
run().catch(console.error);
