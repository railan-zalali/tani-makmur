import { CartItem, Product } from '@/types/product';
import { siteConfig } from '@/config/site';
import { formatRupiah } from './formatters';

/**
 * Generate formatted WhatsApp message for multi-item cart orders
 * Sesuai PRD Section 7.5
 */
export function generateCartWhatsAppUrl(
  items: CartItem[],
  customerName?: string,
  customerNotes?: string
): string {
  if (!items || items.length === 0) {
    return `https://wa.me/${siteConfig.whatsappNumber}`;
  }

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Buat daftar item bernomor
  const itemsText = items
    .map((item, index) => {
      const subtotal = item.product.price * item.quantity;
      return `${index + 1}. ${item.product.name} — ${item.quantity} ${item.product.unit} — ${formatRupiah(subtotal)}`;
    })
    .join('\n');

  let message = `Halo ${siteConfig.name} 👋\n\n`;
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
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodedMessage}`;
}

/**
 * Generate formatted WhatsApp message for direct 1-click single product order
 */
export function generateDirectProductWhatsAppUrl(
  product: Product,
  quantity: number = 1
): string {
  const subtotal = product.price * quantity;
  let message = `Halo ${siteConfig.name} 👋\n\n`;
  message += `Saya ingin memesan produk berikut:\n\n`;
  message += `• *${product.name}*\n`;
  message += `  Jumlah: ${quantity} ${product.unit}\n`;
  message += `  Total Estimasi: ${formatRupiah(subtotal)}\n\n`;
  message += `Mohon informasi ketersediaan stok dan cara konfirmasinya. Terima kasih! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp general consultation URL
 */
export function generateGeneralInquiryWhatsAppUrl(topic?: string): string {
  let message = `Halo ${siteConfig.name} 👋\n\n`;
  if (topic) {
    message += `Saya ingin bertanya / berkonsultasi mengenai: ${topic}.\n\n`;
  } else {
    message += `Saya ingin berkonsultasi mengenai produk pupuk dan kebutuhan pertanian saya.\n\n`;
  }
  message += `Terima kasih! 🙏`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodedMessage}`;
}
