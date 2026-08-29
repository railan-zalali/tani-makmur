const assert = require('assert');

// Formatter test
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// PRD Section 7.5 WhatsApp generator logic test
function generateCartWhatsAppUrl(items, customerName, customerNotes, waNumber = '6285156903148', storeName = 'Toko Pupuk Tani Makmur') {
  if (!items || items.length === 0) {
    return `https://wa.me/${waNumber}`;
  }

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const itemsText = items
    .map((item, index) => {
      const subtotal = item.product.price * item.quantity;
      return `${index + 1}. ${item.product.name} — ${item.quantity} ${item.product.unit} — ${formatRupiah(subtotal)}`;
    })
    .join('\n');

  let message = `Halo ${storeName} 👋\n\n`;
  message += `Saya ingin memesan produk berikut:\n\n`;
  message += `${itemsText}\n\n`;
  message += `📦 Total estimasi: ${formatRupiah(total)}\n\n`;

  if (customerName && customerName.trim() !== '') {
    message += `Nama: ${customerName.trim()}\n`;
  }
  if (customerNotes && customerNotes.trim() !== '') {
    message += `Catatan / Alamat: ${customerNotes.trim()}\n`;
  }

  if ((customerName && customerName.trim() !== '') || (customerNotes && customerNotes.trim() !== '')) {
    message += `\n`;
  }

  message += `Mohon konfirmasi ketersediaan dan harga final. Terima kasih! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${waNumber}?text=${encodedMessage}`;
}

// Tests
console.log('--- Running Ponytail Self-Check Tests ---');

// Test 1: Rupiah Formatter
const formatted = formatRupiah(140000);
console.log(`Format 140000: "${formatted}"`);
assert.ok(formatted.includes('140.000'), 'Formatter should format correctly in IDR');

// Test 2: WhatsApp URL generation
const mockItems = [
  { product: { id: 'urea', name: 'Pupuk Urea 50kg', price: 140000, unit: 'sak' }, quantity: 2 },
  { product: { id: 'npk', name: 'Pupuk NPK Mutiara 25kg', price: 175000, unit: 'sak' }, quantity: 1 },
];

const url = generateCartWhatsAppUrl(mockItems, 'Pak Sugeng', 'Kirim ke Sawah Barat');
console.log('Generated WA URL:', url);

assert.ok(url.startsWith('https://wa.me/6281234567890?text='), 'URL must start with wa.me');
const decodedText = decodeURIComponent(url.split('text=')[1]);
console.log('\nDecoded message:\n' + decodedText);

assert.ok(decodedText.includes('1. Pupuk Urea 50kg — 2 sak — Rp'), 'Must contain item 1');
assert.ok(decodedText.includes('2. Pupuk NPK Mutiara 25kg — 1 sak — Rp'), 'Must contain item 2');
assert.ok(decodedText.includes('📦 Total estimasi: Rp'), 'Must contain total estimasi');
assert.ok(decodedText.includes('Nama: Pak Sugeng'), 'Must contain customer name');
assert.ok(decodedText.includes('Catatan / Alamat: Kirim ke Sawah Barat'), 'Must contain notes');

console.log('\n✅ All self-check assertions passed!');
