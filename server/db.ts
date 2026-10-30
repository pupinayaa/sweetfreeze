import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'dessert_shop.db');
export const db = new DatabaseSync(DB_PATH);

// Utility for hashing passwords
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(key, 'hex'));
  } catch {
    return false;
  }
}

// Initialize tables with proper foreign key relationships
export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      address TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. admins
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );
  `);

  // 3. categories
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 4. products
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price INTEGER NOT NULL,
      discount_price INTEGER,
      stock INTEGER DEFAULT 50,
      image_url TEXT NOT NULL,
      images_json TEXT,
      is_best_seller INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      rating REAL DEFAULT 4.9,
      reviews_count INTEGER DEFAULT 12,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // 5. customers
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      address TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent INTEGER DEFAULT 0,
      last_order_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. orders
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      delivery_method TEXT NOT NULL DEFAULT 'delivery',
      delivery_address TEXT,
      notes TEXT,
      subtotal INTEGER NOT NULL,
      discount_amount INTEGER DEFAULT 0,
      coupon_code TEXT,
      total INTEGER NOT NULL,
      status TEXT DEFAULT 'Pending',
      payment_method TEXT DEFAULT 'WhatsApp / Transfer',
      whatsapp_sent INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 7. order_items
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      total INTEGER NOT NULL,
      image_url TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // 8. promotions
  db.exec(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_value INTEGER NOT NULL,
      min_purchase INTEGER DEFAULT 0,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_active INTEGER DEFAULT 1,
      usage_count INTEGER DEFAULT 0,
      banner_url TEXT
    );
  `);

  // 9. testimonials
  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      avatar_url TEXT,
      rating INTEGER DEFAULT 5,
      comment TEXT NOT NULL,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 10. website_settings
  db.exec(`
    CREATE TABLE IF NOT EXISTS website_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_name TEXT NOT NULL,
      store_tagline TEXT,
      logo_url TEXT,
      banner_title TEXT,
      banner_subtitle TEXT,
      banner_image_url TEXT,
      business_description TEXT,
      address TEXT,
      whatsapp_number TEXT,
      instagram TEXT,
      tiktok TEXT,
      operational_hours TEXT,
      theme_color TEXT DEFAULT '#ec4899',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Check if admin exists
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count === 0) {
    const adminPassHash = hashPassword('admin123');
    db.prepare(`
      INSERT INTO admins (username, password_hash, name, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', adminPassHash, 'Head Chef & Store Manager', 'superadmin');
  }

  // Check settings
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM website_settings').get() as { count: number };
  if (settingsCount.count === 0) {
    db.prepare(`
      INSERT INTO website_settings (
        store_name, store_tagline, logo_url, banner_title, banner_subtitle,
        banner_image_url, business_description, address, whatsapp_number,
        instagram, tiktok, operational_hours, theme_color
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Delicia Dessert & Patisserie',
      'Artisanal Sweets, Handcrafted Daily with Love',
      '/icon.svg',
      'Manisnya Momen Istimewa Dimulai Dari Sini',
      'Dibuat segar setiap hari dengan bahan-bahan premium import & cokelat Belgia berkualitas tinggi.',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
      'Delicia Dessert adalah butik patisserie modern yang menghadirkan pengalaman menikmati hidangan penutup premium, mulai dari moist layered cake, chewy fudgy brownies, artisanal dessert boxes, hingga custom cake untuk perayaan spesial Anda.',
      'Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan 12190',
      '6281234567890',
      '@deliciadessert',
      '@delicia_patisserie',
      'Senin - Minggu: 08.00 - 21.30 WIB',
      '#ec4899'
    );
  }

  // Categories seed
  const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const categoriesData = [
      {
        name: 'Cake',
        slug: 'cake',
        description: 'Kue lapis lembut dengan ganache dan cream premium yang meleleh di mulut.',
        image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
        sort_order: 1
      },
      {
        name: 'Brownies',
        slug: 'brownies',
        description: 'Fudgy, chewy, dan kaya rasa cokelat Belgia murni dengan shiny crust sempurna.',
        image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
        sort_order: 2
      },
      {
        name: 'Cookies',
        slug: 'cookies',
        description: 'Soft-baked cookies dengan lelehan cokelat melimpah dan taburan sea salt.',
        image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
        sort_order: 3
      },
      {
        name: 'Dessert Box',
        slug: 'dessert-box',
        description: 'Layered cake box kekinian dengan krim lembut, crumble renyah, dan lezat.',
        image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
        sort_order: 4
      },
      {
        name: 'Pudding',
        slug: 'pudding',
        description: 'Puding sutra lembut dengan vla vanila Madagascar otentik dan buah segar.',
        image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
        sort_order: 5
      },
      {
        name: 'Donuts',
        slug: 'donuts',
        description: 'Artisanal brioche donut empuk dengan aneka filling dan glaze spesial.',
        image_url: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=600&q=80',
        sort_order: 6
      },
      {
        name: 'Ice Cream',
        slug: 'ice-cream',
        description: 'Artisanal gelato & ice cream pint dengan tekstur ultra-creamy.',
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80',
        sort_order: 7
      },
      {
        name: 'Custom Birthday Cake',
        slug: 'custom-birthday-cake',
        description: 'Kue ulang tahun kustom elegan dengan desain estetik dan pesan khusus.',
        image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
        sort_order: 8
      },
      {
        name: 'Hampers Dessert',
        slug: 'hampers-dessert',
        description: 'Paket bingkisan mewah dengan pita cantik dan kartu ucapan kustom.',
        image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80',
        sort_order: 9
      }
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (name, slug, description, image_url, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const c of categoriesData) {
      insertCat.run(c.name, c.slug, c.description, c.image_url, c.sort_order);
    }
  }

  // Products seed
  const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (prodCount.count === 0) {
    const productsData = [
      // Cake
      {
        catSlug: 'cake',
        name: 'Belgian Dark Chocolate Truffle Cake',
        slug: 'belgian-dark-chocolate-truffle-cake',
        description: 'Kue cokelat Belgia 70% dengan layer ganache pekat, sponge lembut super lembab, dan taburan cocoa nibs garing.',
        price: 245000,
        discount_price: 220000,
        stock: 18,
        image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.95,
        reviews_count: 68
      },
      {
        catSlug: 'cake',
        name: 'Japanese Strawberry Shortcake',
        slug: 'japanese-strawberry-shortcake',
        description: 'Sponge cake ala Tokyo yang ringan sehalus awan dipadukan fresh Hokkaido whipped cream dan stroberi segar manis.',
        price: 210000,
        discount_price: null,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.9,
        reviews_count: 54
      },
      {
        catSlug: 'cake',
        name: 'Red Velvet Cream Cheese Cake',
        slug: 'red-velvet-cream-cheese-cake',
        description: 'Red velvet moist aromatik berpadu frosting Philadelphia cream cheese yang gurih manis pas.',
        price: 195000,
        discount_price: 175000,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.88,
        reviews_count: 42
      },

      // Brownies
      {
        catSlug: 'brownies',
        name: 'Classic Signature Fudgy Brownies (Size 20x20)',
        slug: 'classic-signature-fudgy-brownies',
        description: 'Brownies panggang dengan shiny crust renyah di atas dan tekstur super fudgy, padat lumer di dalam.',
        price: 75000,
        discount_price: 68000,
        stock: 35,
        image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.96,
        reviews_count: 120
      },
      {
        catSlug: 'brownies',
        name: 'Nutella Sea Salt Fudgy Brownies',
        slug: 'nutella-sea-salt-fudgy-brownies',
        description: 'Brownies fudgy berlimpah swirl hazelnut Nutella asli dan taburan garam laut Maldon.',
        price: 90000,
        discount_price: null,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1515037893149-de7f840978e2?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.92,
        reviews_count: 85
      },
      {
        catSlug: 'brownies',
        name: 'Lotus Biscoff Crunch Brownies',
        slug: 'lotus-biscoff-crunch-brownies',
        description: 'Kombinasi brownies cokelat pekat dilapisi selai Lotus Biscoff karamel dan biskuit renyah di atasnya.',
        price: 88000,
        discount_price: 79000,
        stock: 22,
        image_url: 'https://images.unsplash.com/photo-1589218436045-ee320057f443?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.89,
        reviews_count: 39
      },

      // Cookies
      {
        catSlug: 'cookies',
        name: 'NYC Style Chunky Chocochip Cookies (Box of 4)',
        slug: 'nyc-style-chunky-chocochip-cookies',
        description: 'Cookies tebal ala New York dengan bagian luar garing keemasan, tengah lembut gooey, dan cokelat melimpah.',
        price: 65000,
        discount_price: null,
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.94,
        reviews_count: 94
      },
      {
        catSlug: 'cookies',
        name: 'Matcha White Chocolate Almond Cookie',
        slug: 'matcha-white-chocolate-almond-cookie',
        description: 'Uji matcha Jepang murni dengan potongan Belgian white chocolate dan kacang almond panggang gurih.',
        price: 72000,
        discount_price: 65000,
        stock: 28,
        image_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.87,
        reviews_count: 31
      },

      // Dessert Box
      {
        catSlug: 'dessert-box',
        name: 'Lotus Biscoff Heavenly Dessert Box',
        slug: 'lotus-biscoff-heavenly-dessert-box',
        description: 'Layer vanilla sponge, custard mousse lembut, remahan biskuit karamel, dan melted Biscoff spread mewah.',
        price: 48000,
        discount_price: 43000,
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.97,
        reviews_count: 145
      },
      {
        catSlug: 'dessert-box',
        name: 'Tiramisu Kahlua (Non-Alcohol) Dessert Box',
        slug: 'tiramisu-kahlua-dessert-box',
        description: 'Ladyfinger dicelup espresso arabica segar, dilapisi krim mascarpone lembut dan taburan cocoa murni.',
        price: 52000,
        discount_price: null,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.93,
        reviews_count: 88
      },
      {
        catSlug: 'dessert-box',
        name: 'Choco Turkish Delight Dessert Box',
        slug: 'choco-turkish-delight-dessert-box',
        description: 'Krim cokelat lumer berlayer dengan cake cokelat moist dan lelehan cokelat ganache yang melimpah ruah.',
        price: 46000,
        discount_price: null,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.85,
        reviews_count: 35
      },

      // Pudding
      {
        catSlug: 'pudding',
        name: 'Silky Gyukaku Pudding with Madagascar Vanilla Fla',
        slug: 'silky-gyukaku-pudding',
        description: 'Puding sutera super lembut yang bergoyang saat disentuh, disajikan dengan vla vanila asli wangi dan creamy.',
        price: 35000,
        discount_price: 30000,
        stock: 35,
        image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.91,
        reviews_count: 73
      },
      {
        catSlug: 'pudding',
        name: 'Mango Sago Coconut Silk Pudding',
        slug: 'mango-sago-coconut-silk-pudding',
        description: 'Puding mangga harum manis dengan mutiara sagu kenyal, santan kelapa gurih segar, dan potongan mangga asli.',
        price: 38000,
        discount_price: null,
        stock: 22,
        image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.86,
        reviews_count: 29
      },

      // Donuts
      {
        catSlug: 'donuts',
        name: 'Artisan Brioche Bomboloni Box (Isi 6)',
        slug: 'artisan-brioche-bomboloni-box',
        description: 'Donat khas Italia tanpa lubang super empuk dengan isian melimpah: Vanilla Diplomat, Nutella, dan Salted Caramel.',
        price: 68000,
        discount_price: 60000,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.95,
        reviews_count: 110
      },
      {
        catSlug: 'donuts',
        name: 'Cinnamon Sugar Old Fashioned Donuts (Box 4)',
        slug: 'cinnamon-sugar-donuts',
        description: 'Donat ragi lembut hangat berbalur gula kayu manis aromatik yang membuat rindu masa kecil.',
        price: 45000,
        discount_price: null,
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.84,
        reviews_count: 24
      },

      // Ice Cream
      {
        catSlug: 'ice-cream',
        name: 'Pistachio Gelato Cream Pint (473ml)',
        slug: 'pistachio-gelato-pint',
        description: 'Gelato artisan dari kacang pistachio murni Sisilia, gurih legit pekat tanpa perisa buatan.',
        price: 95000,
        discount_price: 85000,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.96,
        reviews_count: 62
      },
      {
        catSlug: 'ice-cream',
        name: 'Wild Blueberry Cheesecake Ice Cream Pint',
        slug: 'wild-blueberry-cheesecake-ice-cream',
        description: 'Krim es keju gurih dengan ripple selai blueberry liar asam manis dan taburan graham cracker renyah.',
        price: 88000,
        discount_price: null,
        stock: 18,
        image_url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.89,
        reviews_count: 36
      },

      // Custom Birthday Cake
      {
        catSlug: 'custom-birthday-cake',
        name: 'Korean Aesthetic Pastel Birthday Cake (16cm)',
        slug: 'korean-aesthetic-pastel-birthday-cake',
        description: 'Kue ulang tahun gaya minimalis Korea dengan gradasi pastel cantik, lilin premium, dan free custom tulisan ucapan.',
        price: 280000,
        discount_price: 255000,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.98,
        reviews_count: 76
      },
      {
        catSlug: 'custom-birthday-cake',
        name: 'Elegant Floral Drip Birthday Cake (20cm)',
        slug: 'elegant-floral-drip-birthday-cake',
        description: 'Tiered style cake dengan edible gold leaf, chocolate drip, dan dekorasi bunga segar yang elegan.',
        price: 360000,
        discount_price: null,
        stock: 8,
        image_url: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.93,
        reviews_count: 41
      },

      // Hampers Dessert
      {
        catSlug: 'hampers-dessert',
        name: 'Deluxe Sweet Celebration Hampers Gift Box',
        slug: 'deluxe-sweet-celebration-hampers',
        description: 'Hardbox eksklusif berpita satin berisi: 1 Fudgy Brownies, 2 Dessert Box pilihan, 1 Jar NYC Cookies, dan Kartu Ucapan.',
        price: 265000,
        discount_price: 235000,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 1,
        rating: 4.97,
        reviews_count: 98
      },
      {
        catSlug: 'hampers-dessert',
        name: 'Artisan Cookie & Brownie Duo Hampers',
        slug: 'cookie-brownie-duo-hampers',
        description: 'Bingkisan manis praktis berisi Fudgy Brownies Signature dan jar Cookies aneka rasa dalam tas spunbond elegan.',
        price: 155000,
        discount_price: null,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        is_best_seller: 0,
        rating: 4.88,
        reviews_count: 53
      }
    ];

    const getCat = db.prepare('SELECT id FROM categories WHERE slug = ?');
    const insertProd = db.prepare(`
      INSERT INTO products (
        category_id, name, slug, description, price, discount_price, stock,
        image_url, is_best_seller, is_active, rating, reviews_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of productsData) {
      const cat = getCat.get(p.catSlug) as { id: number } | undefined;
      if (cat) {
        insertProd.run(
          cat.id,
          p.name,
          p.slug,
          p.description,
          p.price,
          p.discount_price,
          p.stock,
          p.image_url,
          p.is_best_seller,
          1,
          p.rating,
          p.reviews_count
        );
      }
    }
  }

  // Promotions seed
  const promoCount = db.prepare('SELECT COUNT(*) as count FROM promotions').get() as { count: number };
  if (promoCount.count === 0) {
    const promoData = [
      {
        code: 'MANIS10',
        title: 'Diskon Manis 10%',
        description: 'Dapatkan potongan 10% untuk pesanan minimal Rp 100.000.',
        discount_type: 'percentage',
        discount_value: 10,
        min_purchase: 100000,
        start_date: '2025-01-01',
        end_date: '2028-12-31',
        is_active: 1,
        usage_count: 84
      },
      {
        code: 'SWEETDEAL',
        title: 'Potongan Langsung Rp 20.000',
        description: 'Potongan Rp 20.000 untuk pembelian minimal Rp 150.000 di semua kategori.',
        discount_type: 'fixed',
        discount_value: 20000,
        min_purchase: 150000,
        start_date: '2025-01-01',
        end_date: '2028-12-31',
        is_active: 1,
        usage_count: 142
      },
      {
        code: 'HAMPERS30',
        title: 'Spesial Hampers Hemat Rp 30.000',
        description: 'Khusus pesanan hampers dan paket kado dengan minimal order Rp 200.000.',
        discount_type: 'fixed',
        discount_value: 30000,
        min_purchase: 200000,
        start_date: '2025-01-01',
        end_date: '2028-12-31',
        is_active: 1,
        usage_count: 57
      }
    ];

    const insertPromo = db.prepare(`
      INSERT INTO promotions (code, title, description, discount_type, discount_value, min_purchase, start_date, end_date, is_active, usage_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const pr of promoData) {
      insertPromo.run(pr.code, pr.title, pr.description, pr.discount_type, pr.discount_value, pr.min_purchase, pr.start_date, pr.end_date, pr.is_active, pr.usage_count);
    }
  }

  // Testimonials seed
  const testCount = db.prepare('SELECT COUNT(*) as count FROM testimonials').get() as { count: number };
  if (testCount.count === 0) {
    const reviews = [
      {
        customer_name: 'Clarissa Maharani',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        comment: 'Fudgy Brownies-nya beneran terbaik se-Jakarta! Tekstur atasnya renyah shiny, dalamnya lumer cokelat banget. Checkout via WhatsApp langsung dibalas ramah!',
        is_visible: 1,
        sort_order: 1
      },
      {
        customer_name: 'Dimas Wicaksono',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        comment: 'Pesan Custom Birthday Cake buat ulang tahun istri, hasilnya rapi banget melebihi ekspektasi. Rasanya ga kemanisan, krimnya lembut dan segar.',
        is_visible: 1,
        sort_order: 2
      },
      {
        customer_name: 'Amanda Putri Siregar',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        comment: 'Dessert box Lotus Biscoff-nya nagih parah! Perpaduan cream dan biskuitnya pas banget. Kemasannya mewah, cocok banget buat kado atau hampers.',
        is_visible: 1,
        sort_order: 3
      },
      {
        customer_name: 'Kevin Santoso',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
        rating: 5,
        comment: 'NYC Cookies-nya tebal dan cokelatnya tumpah-tumpah pas dihangatkan sebentar di microwave. Pelayanan toko cepat dan pesanan diantar dengan sangat aman.',
        is_visible: 1,
        sort_order: 4
      }
    ];

    const insertReview = db.prepare(`
      INSERT INTO testimonials (customer_name, avatar_url, rating, comment, is_visible, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const r of reviews) {
      insertReview.run(r.customer_name, r.avatar_url, r.rating, r.comment, r.is_visible, r.sort_order);
    }
  }

  // Seed sample customers & orders for immediate rich dashboard analytics
  const ordersCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (ordersCount.count === 0) {
    const custInsert = db.prepare(`
      INSERT INTO customers (name, phone, email, address, total_orders, total_spent, last_order_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const c1 = custInsert.run('Clarissa Maharani', '6281299887766', 'clarissa@example.com', 'Apartemen Sudirman Park Tower A No. 12B, Jakarta Pusat', 3, 485000, '2026-10-28 14:20:00');
    const c2 = custInsert.run('Dimas Wicaksono', '6281311223344', 'dimas.w@example.com', 'Jl. Bintaro Utama Sektor 5 No. 8, Tangerang Selatan', 2, 595000, '2026-10-29 10:15:00');
    const c3 = custInsert.run('Amanda Putri', '6281744556677', 'amanda.putri@example.com', 'Jl. Kemang Raya No. 22A, Jakarta Selatan', 1, 235000, '2026-10-29 18:30:00');

    // Create realistic initial orders
    const orderInsert = db.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, customer_email, delivery_method,
        delivery_address, notes, subtotal, discount_amount, coupon_code, total,
        status, payment_method, whatsapp_sent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const itemInsert = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // Order 1
    const o1 = orderInsert.run(
      'DS-20261028-01',
      'Clarissa Maharani',
      '6281299887766',
      'clarissa@example.com',
      'delivery',
      'Apartemen Sudirman Park Tower A No. 12B, Jakarta Pusat',
      'Tolong kirimkan sore jam 15.00 ya',
      245000,
      24500,
      'MANIS10',
      220500,
      'Selesai',
      'Transfer BCA',
      1,
      '2026-10-28 14:20:00'
    );
    itemInsert.run(Number(o1.lastInsertRowid), 1, 'Belgian Dark Chocolate Truffle Cake', 245000, 1, 245000, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80');

    // Order 2
    const o2 = orderInsert.run(
      'DS-20261029-02',
      'Dimas Wicaksono',
      '6281311223344',
      'dimas.w@example.com',
      'delivery',
      'Jl. Bintaro Utama Sektor 5 No. 8, Tangerang Selatan',
      'Tambahkan kartu ucapan: Happy 5th Anniversary Sayang!',
      360000,
      20000,
      'SWEETDEAL',
      340000,
      'Sedang Dikirim',
      'WhatsApp / QRIS',
      1,
      '2026-10-29 10:15:00'
    );
    itemInsert.run(Number(o2.lastInsertRowid), 19, 'Elegant Floral Drip Birthday Cake (20cm)', 360000, 1, 360000, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=800&q=80');

    // Order 3
    const o3 = orderInsert.run(
      'DS-20261029-03',
      'Amanda Putri',
      '6281744556677',
      'amanda.putri@example.com',
      'pickup',
      'Ambil Sendiri di Toko',
      'Akan diambil jam 19.30 WIB',
      265000,
      30000,
      'HAMPERS30',
      235000,
      'Diproses',
      'WhatsApp / QRIS',
      1,
      '2026-10-29 18:30:00'
    );
    itemInsert.run(Number(o3.lastInsertRowid), 20, 'Deluxe Sweet Celebration Hampers Gift Box', 265000, 1, 265000, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80');
  }
}
