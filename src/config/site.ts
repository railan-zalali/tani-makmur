export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  whatsappNumber: string; // E.164 without '+' e.g. 6281234567890
  whatsappDisplay: string;
  phoneDisplay: string;
  email: string;
  address: {
    street: string;
    village: string;
    district: string;
    city: string;
    province: string;
    postalCode: string;
    full: string;
    googleMapsUrl: string;
    embedMapUrl: string;
  };
  operatingHours: {
    weekdays: string;
    weekend: string;
    note: string;
  };
  socialLinks: {
    facebook?: string;
    instagram?: string;
    whatsapp: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "Toko Tani Makmur",
  shortName: "Tani Makmur",
  tagline: "Sahabat Petani Menuju Panen Melimpah & Berkah",
  description: "Pusat penyedia pupuk pertanian berkualitas, pupuk organik, hayati, kimia, pestisida, dan nutrisi tanaman terlengkap dengan harga terjangkau dan konsultasi tani ramah.",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "62882000505049",
  whatsappDisplay: "+62 882-0005-05049",
  phoneDisplay: "(022) 604-3233",
  email: "tanimasunggul@gmail.com",
  address: {
    street: "Jl. Raya Kopo No. 316",
    village: "Kopo",
    district: "Kec. Bojongloa Kaler",
    city: "Kota Bandung",
    province: "Jawa Barat",
    postalCode: "40233",
    full: "Jl. Raya Kopo No. 316, Kopo, Kec. Bojongloa Kaler, Kota Bandung, Jawa Barat 40233",
    googleMapsUrl: "https://maps.google.com/?q=Toko+Tani+Makmur+Jl.+Raya+Kopo+No.316+Bandung",
    embedMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.672901309859!2d107.58725781477332!3d-6.929668294993181!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e622ef7a151b%3A0xc3f58a3648a4c114!2sToko%20Tani%20Makmur!5e0!3m2!1sid!2sid!4v1700000000000!5m2!1sid!2sid"
  },
  operatingHours: {
    weekdays: "Senin – Sabtu: 08.00 – 15.00 WIB",
    weekend: "Minggu: Libur",
    note: "Pemesanan via WhatsApp dilayani setiap hari"
  },
  socialLinks: {
    facebook: "https://facebook.com/tanimakmur",
    instagram: "https://instagram.com/tanimakmur_pupuk",
    whatsapp: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "62882000505049"}`
  }
};
