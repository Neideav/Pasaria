import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import initSqlJs, { Database } from 'sql.js';

let db: Database;
let demoSqliMode = process.env.DEMO_SQLI_MODE !== 'false'; // Defaults to true for local demo

// Initial Seed Data
const initialCategories = [
  { name: 'Headphone', slug: 'headphones', item_count: 240, icon: 'headphones' },
  { name: 'Furniture', slug: 'furniture', item_count: 240, icon: 'armchair' },
  { name: 'Shoe', slug: 'shoes', item_count: 240, icon: 'footprints' },
  { name: 'Bag', slug: 'bags', item_count: 240, icon: 'shopping-bag' },
  { name: 'Laptop', slug: 'laptops', item_count: 240, icon: 'laptop' },
  { name: 'Book', slug: 'books', item_count: 240, icon: 'book' },
];

const initialProducts = [
  {
    name: 'Airpods- Max',
    slug: 'airpods-max',
    category: 'Headphone',
    price: 549.00,
    original_price: 599.00,
    monthly_price: 99.99,
    short_desc: 'a perfect balance of exhilarating high-fidelity audio and the effortless magic of AirPods.',
    description: 'Apple-designed dynamic driver provides high-fidelity audio. Active Noise Cancellation with Transparency mode. Spatial audio with dynamic head tracking for theater-like sound that surrounds you. Designed with a knit-mesh canopy and acoustically engineered memory foam ear cushions for an exceptional fit.',
    image: 'airpods-max',
    rating: 5.0,
    review_count: 121,
    stock: 12,
    colors: JSON.stringify([
      { name: 'Pink', hex: '#e87373', active: true },
      { name: 'Space Gray', hex: '#44474d', active: false },
      { name: 'Green', hex: '#b3cfbe', active: false },
      { name: 'Silver', hex: '#dce0e3', active: false },
      { name: 'Sky Blue', hex: '#7795ad', active: false }
    ]),
    specs: JSON.stringify({
      General: {
        Brand: 'Apple',
        Model: 'AirPods Max',
        HeadphoneType: 'Over-Ear',
        Connectivity: 'Wireless / Bluetooth 5.0',
        ReleaseDate: 'December 2020',
        Weight: '384.8 g'
      },
      ProductDetails: {
        Microphone: 'Yes (9 microphones total)',
        BatteryLife: 'Up to 20 hours',
        Charging: 'Lightning to USB-C',
        NoiseCancellation: 'Active with Transparency Mode',
        SpatialAudio: 'Yes with Dynamic Head Tracking',
        Warranty: '1 Year Limited'
      }
    })
  },
  {
    name: 'Wireless Earbuds, IPX8',
    slug: 'wireless-earbuds-ipx8',
    category: 'Headphone',
    price: 89.00,
    original_price: 119.00,
    monthly_price: 19.99,
    short_desc: 'Organic Cotton, fairtrade certified casing',
    description: 'High performance IPX8 waterproof bluetooth earbuds with dual LED digital battery display case, deep punchy bass, crystal clear mic, and 48 hours total playback time.',
    image: 'wireless-earbuds-ipx8',
    rating: 4.9,
    review_count: 121,
    stock: 25,
    colors: JSON.stringify([
      { name: 'Midnight Black', hex: '#1c1c1e', active: true },
      { name: 'Frost White', hex: '#f2f2f7', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'SoundWave', Model: 'IPX8 Elite', Connectivity: 'Bluetooth 5.3' },
      ProductDetails: { BatteryLife: '48h with Case', WaterResistance: 'IPX8 Waterproof', Charging: 'USB-C Fast Charge' }
    })
  },
  {
    name: 'Bose BT Earphones',
    slug: 'bose-bt-earphones',
    category: 'Headphone',
    price: 289.00,
    original_price: 329.00,
    monthly_price: 49.99,
    short_desc: 'Table with air purifier, stained venner/black',
    description: 'World-class noise cancellation headphones engineered with proprietary acoustic technologies for deep, immersive sound at any volume.',
    image: 'bose-bt-earphones',
    rating: 4.8,
    review_count: 121,
    stock: 18,
    colors: JSON.stringify([
      { name: 'Triple Black', hex: '#111213', active: true },
      { name: 'Luxe Silver', hex: '#c5c8cb', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Bose', Model: 'QuietComfort 45', Connectivity: 'Bluetooth 5.1' },
      ProductDetails: { BatteryLife: '24 Hours', Weight: '240g', QuickCharge: '15 min for 3h' }
    })
  },
  {
    name: 'VIVEFOX Headphones',
    slug: 'vivefox-headphones',
    category: 'Headphone',
    price: 39.00,
    original_price: 49.00,
    monthly_price: 9.99,
    short_desc: 'Wired Stereo Headsets With Mic',
    description: 'Comfortable on-ear wired headphones with tangle-free 3.5mm braided cable, in-line HD microphone, and folding lightweight design perfect for daily study and calls.',
    image: 'vivefox-headphones',
    rating: 4.7,
    review_count: 121,
    stock: 40,
    colors: JSON.stringify([
      { name: 'Bright Coral Red', hex: '#d9434e', active: true },
      { name: 'Teal Blue', hex: '#269399', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'VIVEFOX', Model: 'V-100 Classic', Connectivity: '3.5mm Audio Jack' },
      ProductDetails: { CableLength: '1.5m Braided', DriverUnit: '40mm Neodymium', Mic: 'In-Line Omnidirectional' }
    })
  },
  {
    name: 'JBL TUNE 600BTNC',
    slug: 'jbl-tune-600btnc',
    category: 'Headphone',
    price: 59.00,
    original_price: 79.00,
    monthly_price: 14.99,
    short_desc: 'Premium Bone Conduction Open Ear Bluetooth',
    description: 'JBL Pure Bass Sound with active noise cancellation. Wireless Bluetooth streaming and lightweight flat-folding design for on-the-go audio bliss.',
    image: 'jbl-tune-600btnc',
    rating: 4.9,
    review_count: 121,
    stock: 30,
    colors: JSON.stringify([
      { name: 'Dark Navy', hex: '#212936', active: true },
      { name: 'White', hex: '#f0f0f0', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'JBL', Model: 'Tune 600BTNC', Connectivity: 'Bluetooth 4.1' },
      ProductDetails: { BatteryLife: '12h with ANC on', DriverSize: '32mm', Weight: '173g' }
    })
  },
  {
    name: 'TAGRY Bluetooth',
    slug: 'tagry-bluetooth',
    category: 'Headphone',
    price: 109.00,
    original_price: 139.00,
    monthly_price: 24.99,
    short_desc: '256, 8 core GPU, 8 GB audio acceleration',
    description: 'Cyber-case wireless earbuds with dual LED battery monitor, wireless charging pad compatibility, and 60 hours total endurance.',
    image: 'tagry-bluetooth',
    rating: 5.0,
    review_count: 121,
    stock: 22,
    colors: JSON.stringify([
      { name: 'Cyber Black', hex: '#16191f', active: true },
      { name: 'Electric Green Accent', hex: '#2dd4bf', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'TAGRY', Model: 'X08 Pro', Connectivity: 'Bluetooth 5.3' },
      ProductDetails: { BatteryLife: '60 Hours Total', CaseCharging: 'Type-C + Wireless', Waterproof: 'IPX5' }
    })
  },
  {
    name: 'Monster MNFLEX',
    slug: 'monster-mnflex',
    category: 'Headphone',
    price: 89.75,
    original_price: 110.00,
    monthly_price: 18.50,
    short_desc: 'Flex Active Noise Canceling Bluetooth',
    description: 'Ergonomic neckband open-ear sports earphones engineered for runners and cyclists, delivering rich open audio while keeping you alert to surroundings.',
    image: 'monster-mnflex',
    rating: 4.8,
    review_count: 121,
    stock: 19,
    colors: JSON.stringify([
      { name: 'Matte Charcoal', hex: '#33373b', active: true }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Monster', Model: 'MNFLEX Sport', Connectivity: 'Bluetooth 5.2' },
      ProductDetails: { FormFactor: 'Open-Ear Neckband', Weight: '28g Featherweight', Sweatproof: 'IPX7' }
    })
  },
  {
    name: 'Mpow CH6',
    slug: 'mpow-ch6',
    category: 'Headphone',
    price: 569.00,
    original_price: 599.00,
    monthly_price: 99.00,
    short_desc: 'Kids Headphones With Mic, Hearing Protection',
    description: 'Safe 85dB volume limiting over-ear headphones with ultra-soft plush ear cushions, durable bendable headband, and sharing jack port.',
    image: 'mpow-ch6',
    rating: 5.0,
    review_count: 121,
    stock: 14,
    colors: JSON.stringify([
      { name: 'Sky Cerulean', hex: '#3b82f6', active: true },
      { name: 'Candy Pink', hex: '#ec4899', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Mpow', Model: 'CH6 SafeSound', Connectivity: '3.5mm Gold-Plated' },
      ProductDetails: { VolumeLimit: '85dB / 94dB Switch', EarPads: 'Memory Foam Breathable', SharePort: 'Built-In' }
    })
  },
  {
    name: 'TaoTronics Earbuds',
    slug: 'taotronics-earbuds',
    category: 'Headphone',
    price: 59.00,
    original_price: 79.00,
    monthly_price: 12.00,
    short_desc: 'Wireless Earbuds with Smart Touch',
    description: 'True wireless earbuds with smart touch controls, aptX audio codec support, and clear voice cVc 8.0 noise reduction microphones.',
    image: 'taotronics-earbuds',
    rating: 4.8,
    review_count: 121,
    stock: 35,
    colors: JSON.stringify([
      { name: 'Piano Black', hex: '#111111', active: true },
      { name: 'Pearl White', hex: '#ffffff', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'TaoTronics', Model: 'SoundLiberty 79', Connectivity: 'Bluetooth 5.0' },
      ProductDetails: { Playtime: '30h Total', Waterproof: 'IPX8', SmartSensor: 'In-Ear Detection' }
    })
  },
  {
    name: 'SoundPEATS A7 Pro',
    slug: 'soundpeats-a7-pro',
    category: 'Headphone',
    price: 69.00,
    original_price: 89.00,
    monthly_price: 15.00,
    short_desc: 'Active Noise Canceling Bluetooth Earbuds',
    description: 'Hybrid active noise cancelling earbuds with transparent ambient sound mode and low latency 60ms game mode.',
    image: 'soundpeats-a7-pro',
    rating: 4.9,
    review_count: 121,
    stock: 28,
    colors: JSON.stringify([
      { name: 'Gunmetal Gray', hex: '#4a4d52', active: true }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'SoundPEATS', Model: 'A7 Pro ANC', Connectivity: 'Bluetooth 5.2' },
      ProductDetails: { ANCDepth: 'Up to 35dB', GameLatency: '60ms Low Latency', Drivers: '12mm Bio-diaphragm' }
    })
  },
  {
    name: 'Beats Solo3',
    slug: 'beats-solo3',
    category: 'Headphone',
    price: 199.95,
    original_price: 249.95,
    monthly_price: 39.99,
    short_desc: '40 Hours Battery Life, Apple W1 Chip - Rose Gold',
    description: 'With up to 40 hours of battery life, Beats Solo3 Wireless is your perfect everyday headphone. Fast Fuel gives 3 hours of playback from a 5-minute charge.',
    image: 'beats-solo3',
    rating: 4.9,
    review_count: 121,
    stock: 16,
    colors: JSON.stringify([
      { name: 'Rose Gold', hex: '#e8b8b8', active: true },
      { name: 'Matte Black', hex: '#222222', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Beats by Dre', Model: 'Solo3 Wireless', Connectivity: 'Apple W1 Chip / BT' },
      ProductDetails: { BatteryLife: '40 Hours', FastFuel: '5 min = 3 hours', OnEarControls: 'Call and Music' }
    })
  },
  {
    name: 'Jelly Comb Bluetooth',
    slug: 'jelly-comb-bluetooth',
    category: 'Headphone',
    price: 69.00,
    original_price: 89.00,
    monthly_price: 14.00,
    short_desc: 'Over-Ear 100 hrs Play Time Headphones',
    description: 'Foldable wireless stereo headphones with dual 40mm large-aperture driver units, ultra-soft protein leather ear cushions, and wired backup mode.',
    image: 'jelly-comb-bluetooth',
    rating: 4.7,
    review_count: 121,
    stock: 20,
    colors: JSON.stringify([
      { name: 'Stealth Black', hex: '#1e1f22', active: true }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Jelly Comb', Model: 'JC-100BT', Connectivity: 'Bluetooth 5.0 / 3.5mm' },
      ProductDetails: { BatteryLife: '100 Hours Playtime', Weight: '235g', Cushion: 'Memory Protein Leather' }
    })
  },
  {
    name: 'Gaming Headphone',
    slug: 'gaming-headphone',
    category: 'Accessories',
    price: 239.00,
    original_price: 279.00,
    monthly_price: 45.00,
    short_desc: 'Table with air purifier, stained venner/black',
    description: 'Pro tournament grade esports gaming headset with 7.1 virtual surround sound, noise-isolating broadcast boom mic, and breathable memory foam ear cushions.',
    image: 'gaming-headphone',
    rating: 4.9,
    review_count: 121,
    stock: 15,
    colors: JSON.stringify([
      { name: 'Viper Green & Black', hex: '#22c55e', active: true }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Razer Apex', Model: 'Tournament Elite V2', Connectivity: 'USB / 3.5mm Combo' },
      ProductDetails: { SurroundSound: 'THX Spatial Audio 7.1', Drivers: '50mm TriForce Titanium', Mic: 'HyperClear Cardioid' }
    })
  },
  {
    name: 'Macbook pro 13"',
    slug: 'macbook-pro-13',
    category: 'Laptop',
    price: 1099.00,
    original_price: 1299.00,
    monthly_price: 189.00,
    short_desc: '256, 8 core GPU, 8 GB Unified Memory',
    description: 'Incredible performance and battery efficiency with high-resolution Retina display, Magic Keyboard, Touch ID, and studio-quality mics.',
    image: 'macbook-pro-13',
    rating: 5.0,
    review_count: 121,
    stock: 8,
    colors: JSON.stringify([
      { name: 'Lilac Lavender', hex: '#c4b5fd', active: true },
      { name: 'Space Gray', hex: '#4b5563', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Apple', Model: 'MacBook Pro 13-inch', Processor: 'Apple Silicon 8-core CPU' },
      ProductDetails: { Memory: '8GB Unified', Storage: '256GB NVMe SSD', Battery: 'Up to 20 hours' }
    })
  },
  {
    name: 'HomePod mini',
    slug: 'homepod-mini',
    category: 'Speakers',
    price: 59.00,
    original_price: 99.00,
    monthly_price: 12.00,
    short_desc: '5 Colors Available, Room-filling 360-degree sound',
    description: 'Compact acoustic powerhouse designed to fit anywhere in the home. Seamless multi-room audio, intercom capability, and smart home hub integration.',
    image: 'homepod-mini',
    rating: 4.8,
    review_count: 121,
    stock: 24,
    colors: JSON.stringify([
      { name: 'Mandarin Orange', hex: '#f97316', active: true },
      { name: 'Space Gray', hex: '#374151', active: false },
      { name: 'Yellow', hex: '#eab308', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Apple', Model: 'HomePod mini', Connectivity: 'Wi-Fi 802.11n, Thread, BT 5.0' },
      ProductDetails: { AudioField: '360° Computational Audio', Microphones: 'Four-mic array for Siri', Weight: '345g' }
    })
  },
  {
    name: 'Laptop sleeve MacBook',
    slug: 'laptop-sleeve-macbook',
    category: 'Accessories',
    price: 59.00,
    original_price: 69.00,
    monthly_price: 11.00,
    short_desc: 'Organic Cotton, fairtrade certified',
    description: 'Tailored protective sleeve crafted from organic water-repellent canvas, featuring padded fleece lining, dual external cord organizers, and sturdy YKK zippers.',
    image: 'laptop-sleeve-macbook',
    rating: 4.9,
    review_count: 121,
    stock: 35,
    colors: JSON.stringify([
      { name: 'Mustard Gold', hex: '#d97706', active: true },
      { name: 'Olive Drab', hex: '#4d7c0f', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Bellroy x Shopcart', Model: 'EcoSleeve 13', Material: '100% Recycled Ripstop' },
      ProductDetails: { Compatibility: 'MacBook Air/Pro 13-14"', Padding: '360 Shock Absorption', Pocket: 'Front accessory zip' }
    })
  },
  {
    name: 'iPad Mini',
    slug: 'ipad-mini',
    category: 'Laptop',
    price: 569.00,
    original_price: 649.00,
    monthly_price: 89.00,
    short_desc: 'Table with air purifier, stained venner/black',
    description: 'Liquid Retina display with True Tone and wide color. All-screen design with Touch ID integrated into top button, and USB-C connectivity.',
    image: 'ipad-mini',
    rating: 4.9,
    review_count: 121,
    stock: 11,
    colors: JSON.stringify([
      { name: 'Space Gray', hex: '#374151', active: true },
      { name: 'Starlight', hex: '#e2e8f0', active: false }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'Apple', Model: 'iPad mini 6th Gen', Display: '8.3-inch Liquid Retina' },
      ProductDetails: { Storage: '64GB / 256GB', Camera: '12MP Ultra Wide with Center Stage', Weight: '293g' }
    })
  },
  {
    name: 'Flower Laptop Sleeve',
    slug: 'flower-laptop-sleeve',
    category: 'Accessories',
    price: 39.00,
    original_price: 49.00,
    monthly_price: 8.00,
    short_desc: '15 in. x 10 in. -Flap top closure',
    description: 'Chic quilted floral pattern laptop pouch with magnetic flap closure and plush interior velvet protection against scratches and bumps.',
    image: 'flower-laptop-sleeve',
    rating: 4.8,
    review_count: 121,
    stock: 20,
    colors: JSON.stringify([
      { name: 'Coral Floral', hex: '#f87171', active: true }
    ]),
    specs: JSON.stringify({
      General: { Brand: 'FloralStudio', Model: 'BloomGuard 15', Dimensions: '15 x 10 inches' },
      ProductDetails: { Closure: 'Magnetic Concealed Snaps', Lining: 'Velveteen Microfiber', Exterior: 'Water-resistant Poly' }
    })
  }
];

const initialUsers = [
  {
    name: 'Wade Warren',
    username: 'wadewarren',
    email: 'customer@shopcart.com',
    password: 'password123',
    address: '4140 Parker Rd.',
    city: 'Allentown',
    zip: '31134',
    phone: '+001234567890',
    role: 'customer'
  },
  {
    name: 'Administrator',
    username: 'admin',
    email: 'admin@shopcart.com',
    password: 'admin123',
    address: '100 Executive Way',
    city: 'San Francisco',
    zip: '94105',
    phone: '+001987654321',
    role: 'admin'
  }
];

const initialDemoRecords = [
  { record_name: 'Server Room A', record_value: 'Jakarta Branch Office' },
  { record_name: 'Warehouse 02', record_value: 'Bekasi Distribution Hub' },
  { record_name: 'Inventory System', record_value: 'ERP v3.1 - Operational' },
  { record_name: 'Demo Record 01', record_value: 'Asset ID: BR-001' },
  { record_name: 'Demo Record 02', record_value: 'Asset ID: BR-002' },
  { record_name: 'Demo Record 03', record_value: 'Asset ID: BR-003' },
  { record_name: 'Office Network', record_value: 'VLAN 10 - Internal' },
  { record_name: 'Branch: Surabaya', record_value: 'Floor 3, Tower B' },
  { record_name: 'Branch: Bandung', record_value: 'Floor 7, Menara Hijau' },
  { record_name: 'Maintenance Window', record_value: 'Sunday 00:00 - 04:00 WIB' },
];


// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      item_count INTEGER DEFAULT 0,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      monthly_price REAL,
      short_desc TEXT,
      description TEXT,
      image TEXT NOT NULL,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 10,
      colors TEXT,
      specs TEXT,
      shop_id INTEGER DEFAULT 1,
      shop_name TEXT DEFAULT 'Shopcart Official Merchant',
      shop_logo TEXT,
      shop_city TEXT DEFAULT 'Jakarta',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      address TEXT,
      city TEXT,
      zip TEXT,
      phone TEXT,
      avatar TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      slogan TEXT,
      city TEXT,
      phone TEXT,
      description TEXT,
      logo TEXT,
      banner TEXT,
      rating REAL DEFAULT 5.0,
      review_count INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT,
      payment_method TEXT,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      discount REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      total REAL NOT NULL,
      status TEXT DEFAULT 'Processing',
      items_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      color TEXT,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      items_json TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id TEXT NOT NULL UNIQUE,
      order_number TEXT NOT NULL,
      user_id INTEGER,
      courier_name TEXT NOT NULL,
      courier_service TEXT,
      tracking_number TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'in_transit',
      status_label TEXT,
      recipient_name TEXT,
      recipient_phone TEXT,
      delivery_address TEXT,
      origin_address TEXT,
      estimated_arrival TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      driver_vehicle TEXT,
      current_location TEXT,
      items_count INTEGER DEFAULT 1,
      items_preview_json TEXT,
      total_amount REAL DEFAULT 0,
      checkpoints_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS demo_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_name TEXT NOT NULL,
      record_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed categories
  for (const cat of initialCategories) {
    db.run(
      `INSERT INTO categories (name, slug, item_count, icon) VALUES (?, ?, ?, ?)`,
      [cat.name, cat.slug, cat.item_count, cat.icon]
    );
  }

  // Seed products
  for (const p of initialProducts) {
    db.run(
      `INSERT INTO products (name, slug, category, price, original_price, monthly_price, short_desc, description, image, rating, review_count, stock, colors, specs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.name, p.slug, p.category, p.price, p.original_price, p.monthly_price,
        p.short_desc, p.description, p.image, p.rating, p.review_count, p.stock,
        p.colors, p.specs
      ]
    );
  }

  // Seed users
  for (const u of initialUsers) {
    db.run(
      `INSERT INTO users (name, username, email, password, address, city, zip, phone, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.name, u.username, u.email, u.password, u.address, u.city, u.zip, u.phone, u.role]
    );
  }

  // Seed demo records for UNION data extraction
  for (const dr of initialDemoRecords) {
    db.run(
      `INSERT INTO demo_records (record_name, record_value) VALUES (?, ?)`,
      [dr.record_name, dr.record_value]
    );
  }

  // Seed an initial demo order
  const demoItems = JSON.stringify([
    {
      id: 1,
      name: 'Airpods- Max',
      slug: 'airpods-max',
      price: 549.00,
      quantity: 1,
      color: 'Pink',
      image: 'airpods-max'
    }
  ]);

  db.run(
    `INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, payment_method, subtotal, tax, discount, shipping_cost, total, status, items_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '9945284820',
      1,
      'Wade Warren',
      'customer@shopcart.com',
      '4140 Parker Rd. Allentown, New Mexico 31134',
      'Credit or Debit Card',
      549.00,
      54.90,
      54.90,
      0.00,
      494.10,
      'Delivered',
      demoItems
    ]
  );

  console.log('Shopcart SQLite database initialized successfully.');
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ---------------------------------------------------------------------------
  // API: Get Categories
  // ---------------------------------------------------------------------------
  app.get('/api/categories', (req: Request, res: Response) => {
    try {
      const stmt = db.prepare('SELECT * FROM categories ORDER BY id ASC');
      const rows: any[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      stmt.free();
      res.json({ success: true, data: rows });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Get Products (List & Search)
  //
  // NOTE FOR EVALUATION / DEMONSTRATION:
  // When DEMO_SQLI_MODE=true:
  // Uses raw string concatenation for the search query to demonstrate SQLi.
  //
  // When DEMO_SQLI_MODE=false:
  // Uses safe parameterized query binding.
  // ---------------------------------------------------------------------------
  app.get('/api/products', (req: Request, res: Response) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
      const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
      const sort = typeof req.query.sort === 'string' ? req.query.sort : 'popular';
      const minPrice = Number(req.query.minPrice) || 0;
      const maxPrice = Number(req.query.maxPrice) || 999999;
      const minRating = Number(req.query.minRating) || 0;

      let orderByClause = 'id ASC';
      if (sort === 'price-asc') orderByClause = 'price ASC';
      else if (sort === 'price-desc') orderByClause = 'price DESC';
      else if (sort === 'rating') orderByClause = 'rating DESC';
      else if (sort === 'newest') orderByClause = 'id DESC';

      let products: any[] = [];

      if (q) {
        if (demoSqliMode) {
          // ===================================================================
          // // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
          // ===================================================================
          // Query directly concatenates user input $q into the SQL statement
          const rawSql = `SELECT * FROM products WHERE (name LIKE '%${q}%' OR description LIKE '%${q}%' OR short_desc LIKE '%${q}%' OR category LIKE '%${q}%') AND price >= ${minPrice} AND price <= ${maxPrice} AND rating >= ${minRating} ORDER BY ${orderByClause}`;
          
          try {
            const results = db.exec(rawSql);
            if (results.length > 0 && results[0].values) {
              const columns = results[0].columns;
              products = results[0].values.map(row => {
                const item: any = {};
                columns.forEach((col, idx) => {
                  item[col] = row[idx];
                });
                return item;
              });
            }
          } catch (sqlErr: any) {
            // In SQL injection demonstration, syntax errors from injection are returned naturally
            return res.status(200).json({
              success: true,
              data: [],
              count: 0,
              sqli_mode: true,
              sql_error: sqlErr.message
            });
          }
        } else {
          // ===================================================================
          // // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
          // ===================================================================
          const secureSql = `SELECT * FROM products WHERE (name LIKE :term OR description LIKE :term OR short_desc LIKE :term OR category LIKE :term) AND price >= :minPrice AND price <= :maxPrice AND rating >= :minRating ORDER BY ${orderByClause}`;
          const stmt = db.prepare(secureSql);
          stmt.bind({
            ':term': `%${q}%`,
            ':minPrice': minPrice,
            ':maxPrice': maxPrice,
            ':minRating': minRating
          });
          while (stmt.step()) {
            products.push(stmt.getAsObject());
          }
          stmt.free();
        }
      } else {
        // Standard listing
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params: any = {};

        if (category && category.toLowerCase() !== 'all') {
          sql += ' AND LOWER(category) = :category';
          params[':category'] = category.toLowerCase();
        }

        if (minPrice > 0) {
          sql += ' AND price >= :minPrice';
          params[':minPrice'] = minPrice;
        }

        if (maxPrice < 999999) {
          sql += ' AND price <= :maxPrice';
          params[':maxPrice'] = maxPrice;
        }

        if (minRating > 0) {
          sql += ' AND rating >= :minRating';
          params[':minRating'] = minRating;
        }

        sql += ` ORDER BY ${orderByClause}`;

        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          products.push(stmt.getAsObject());
        }
        stmt.free();
      }

      // Parse JSON fields safely (handle injected UNION results that might contain non-JSON text)
      const parseJsonSafe = (val: any) => {
        if (typeof val !== 'string') return val;
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      };

      const formattedProducts = products.map(p => ({
        ...p,
        colors: parseJsonSafe(p.colors),
        specs: parseJsonSafe(p.specs)
      }));

      res.json({
        success: true,
        count: formattedProducts.length,
        data: formattedProducts,
        sqli_mode: demoSqliMode
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Get Single Product by Slug
  // ---------------------------------------------------------------------------
  app.get('/api/products/:slug', (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      const stmt = db.prepare('SELECT * FROM products WHERE slug = :slug LIMIT 1');
      stmt.bind({ ':slug': slug });

      let product: any = null;
      if (stmt.step()) {
        product = stmt.getAsObject();
      }
      stmt.free();

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product.colors = typeof product.colors === 'string' ? JSON.parse(product.colors) : product.colors;
      product.specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;

      // Also fetch 4 related products in same category
      const relatedStmt = db.prepare(
        'SELECT * FROM products WHERE category = :category AND id != :id LIMIT 4'
      );
      relatedStmt.bind({ ':category': product.category, ':id': product.id });
      const relatedProducts: any[] = [];
      while (relatedStmt.step()) {
        const item = relatedStmt.getAsObject();
        item.colors = typeof item.colors === 'string' ? JSON.parse(item.colors as string) : item.colors;
        relatedProducts.push(item);
      }
      relatedStmt.free();

      res.json({
        success: true,
        data: product,
        related: relatedProducts
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Authentication - Login
  //
  // NOTE FOR EVALUATION / DEMONSTRATION:
  // When DEMO_SQLI_MODE=true:
  // Directly builds raw SQL with user input string concatenation.
  // E.g. username: admin@shopcart.com' --
  //
  // When DEMO_SQLI_MODE=false:
  // Parameterized query looking up user, then validating password.
  // ---------------------------------------------------------------------------
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      if (!username) {
        return res.status(400).json({ success: false, message: 'Please enter your username or email' });
      }

      let user: any = null;

      if (demoSqliMode) {
        // =====================================================================
        // // INTENTIONALLY VULNERABLE FOR LOCAL EDUCATIONAL DEMONSTRATION
        // =====================================================================
        // Directly concatenating $username and $password into raw SQL
        const rawSql = `SELECT * FROM users WHERE (email = '${username}' OR username = '${username}') AND password = '${password}' LIMIT 1`;

        try {
          const results = db.exec(rawSql);
          if (results.length > 0 && results[0].values.length > 0) {
            const columns = results[0].columns;
            const row = results[0].values[0];
            user = {};
            columns.forEach((col, idx) => {
              user[col] = row[idx];
            });
          }
        } catch (sqlErr: any) {
          return res.status(200).json({
            success: false,
            message: 'Invalid credentials or database query syntax error',
            sqli_mode: true,
            sql_error: sqlErr.message
          });
        }
      } else {
        // =====================================================================
        // // SECURE IMPLEMENTATION USING PARAMETERIZED QUERY
        // =====================================================================
        const stmt = db.prepare('SELECT * FROM users WHERE (email = :identifier OR username = :identifier) LIMIT 1');
        stmt.bind({ ':identifier': username });

        let candidateUser: any = null;
        if (stmt.step()) {
          candidateUser = stmt.getAsObject();
        }
        stmt.free();

        if (candidateUser && candidateUser.password === password) {
          user = candidateUser;
        }
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username, email, or password'
        });
      }

      // Safe user object (do not return password)
      const { password: _, ...safeUser } = user;

      res.json({
        success: true,
        message: 'Sign in successful',
        user: safeUser,
        sqli_mode: demoSqliMode
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Authentication - Register
  // ---------------------------------------------------------------------------
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { name, username, email, password } = req.body;

      if (!name || !username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      // Check existing
      const checkStmt = db.prepare('SELECT id FROM users WHERE email = :email OR username = :username LIMIT 1');
      checkStmt.bind({ ':email': email, ':username': username });
      const exists = checkStmt.step();
      checkStmt.free();

      if (exists) {
        return res.status(400).json({ success: false, message: 'An account with that email or username already exists.' });
      }

      // Insert new user securely
      db.run(
        `INSERT INTO users (name, username, email, password, address, city, zip, phone, role)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, username, email, password, '', '', '', '', 'customer']
      );

      const fetchStmt = db.prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
      fetchStmt.bind({ ':email': email });
      let newUser: any = null;
      if (fetchStmt.step()) {
        newUser = fetchStmt.getAsObject();
      }
      fetchStmt.free();

      const { password: _, ...safeUser } = newUser;

      res.json({
        success: true,
        message: 'Account registered successfully',
        user: safeUser
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Orders - Create Order
  // ---------------------------------------------------------------------------
  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const {
        customer_name,
        customer_email,
        shipping_address,
        payment_method,
        subtotal,
        tax,
        discount,
        shipping_cost,
        total,
        items
      } = req.body;

      const orderNumber = String(Math.floor(1000000000 + Math.random() * 9000000000));
      const itemsJson = JSON.stringify(items || []);

      db.run(
        `INSERT INTO orders (order_number, user_id, customer_name, customer_email, shipping_address, payment_method, subtotal, tax, discount, shipping_cost, total, status, items_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          1,
          customer_name || 'Customer',
          customer_email || 'customer@shopcart.com',
          shipping_address || '4140 Parker Rd. Allentown, New Mexico 31134',
          payment_method || 'Credit or Debit Card',
          subtotal || 0,
          tax || 0,
          discount || 0,
          shipping_cost || 0,
          total || 0,
          'Processing',
          itemsJson
        ]
      );

      res.json({
        success: true,
        order_number: orderNumber,
        transaction_id: orderNumber,
        message: 'Order created successfully'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Orders - List Orders (filtered by user_id)
  // ---------------------------------------------------------------------------
  app.get('/api/orders', (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id ? Number(req.query.user_id) : null;
      const stmt = userId
        ? db.prepare('SELECT * FROM orders WHERE user_id = :uid ORDER BY id DESC')
        : db.prepare('SELECT * FROM orders ORDER BY id DESC');
      if (userId) stmt.bind({ ':uid': userId });
      const rows: any[] = [];
      while (stmt.step()) {
        const item = stmt.getAsObject() as any;
        item.items = typeof item.items_json === 'string' ? JSON.parse(item.items_json as string) : [];
        rows.push(item);
      }
      stmt.free();
      res.json({ success: true, data: rows });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Shops - Create / Update Shop
  // ---------------------------------------------------------------------------
  app.post('/api/shops', (req: Request, res: Response) => {
    try {
      const { user_id, name, slug, slogan, city, phone, description, logo, banner } = req.body;
      const cleanSlug = (slug || name || 'store').toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const checkStmt = db.prepare('SELECT id FROM shops WHERE user_id = :user_id OR slug = :slug LIMIT 1');
      checkStmt.bind({ ':user_id': user_id || 1, ':slug': cleanSlug });
      const exists = checkStmt.step();
      checkStmt.free();

      if (exists) {
        db.run(
          `UPDATE shops SET name = ?, slogan = ?, city = ?, phone = ?, description = ?, logo = ?, banner = ? WHERE user_id = ?`,
          [name, slogan || '', city || 'Jakarta', phone || '', description || '', logo || '', banner || '', user_id || 1]
        );
      } else {
        db.run(
          `INSERT INTO shops (user_id, name, slug, slogan, city, phone, description, logo, banner, rating, review_count, verified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [user_id || 1, name, cleanSlug, slogan || '', city || 'Jakarta', phone || '', description || '', logo || '', banner || '', 5.0, 0, 1]
        );
      }

      res.json({
        success: true,
        message: 'Shop saved successfully',
        shop: {
          user_id,
          name,
          slug: cleanSlug,
          slogan,
          city,
          phone,
          description,
          logo,
          banner,
          rating: 5.0,
          review_count: 0,
          verified: true
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Products - Create Product (Seller)
  // ---------------------------------------------------------------------------
  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const p = req.body;
      const slug = p.slug || (p.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      const colorsStr = typeof p.colors === 'string' ? p.colors : JSON.stringify(p.colors || [{ name: 'Default', hex: '#003d29' }]);
      const specsStr = typeof p.specs === 'string' ? p.specs : JSON.stringify(p.specs || { Details: { Warranty: '1 Year' } });

      db.run(
        `INSERT INTO products (name, slug, category, price, original_price, monthly_price, short_desc, description, image, rating, review_count, stock, colors, specs, shop_id, shop_name, shop_logo, shop_city)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.name,
          slug,
          p.category || 'Headphone',
          p.price,
          p.original_price || null,
          p.monthly_price || null,
          p.short_desc || '',
          p.description || '',
          p.image || 'airpods-max',
          p.rating || 5.0,
          p.review_count || 0,
          p.stock || 10,
          colorsStr,
          specsStr,
          p.shop_id || 1,
          p.shop_name || 'Shopcart Official Merchant',
          p.shop_logo || '',
          p.shop_city || 'Jakarta'
        ]
      );

      res.json({
        success: true,
        message: 'Product created successfully',
        product: { ...p, slug }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Products - Delete Product
  // ---------------------------------------------------------------------------
  app.delete('/api/products/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      db.run(`DELETE FROM products WHERE id = ?`, [Number(id)]);
      res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: User Profile - Update
  // ---------------------------------------------------------------------------
  app.put('/api/user/profile', (req: Request, res: Response) => {
    try {
      const { id, name, address, city, zip, phone, avatar } = req.body;
      db.run(
        `UPDATE users SET name = ?, address = ?, city = ?, zip = ?, phone = ?, avatar = ? WHERE id = ? OR username = ?`,
        [name, address, city, zip, phone, avatar, id || 1, 'wade_warren']
      );
      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Cart - Get Cart for User
  // ---------------------------------------------------------------------------
  app.get('/api/cart', (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.user_id) || 1;
      const stmt = db.prepare('SELECT items_json FROM carts WHERE user_id = :userId LIMIT 1');
      stmt.bind({ ':userId': userId });
      let items: any[] = [];
      if (stmt.step()) {
        const row = stmt.getAsObject();
        try {
          items = JSON.parse(row.items_json as string);
        } catch {}
      }
      stmt.free();
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Cart - Save / Sync Cart
  // ---------------------------------------------------------------------------
  app.post('/api/cart', (req: Request, res: Response) => {
    try {
      const { user_id, items } = req.body;
      const uid = Number(user_id) || 1;
      const itemsJson = JSON.stringify(items || []);

      const checkStmt = db.prepare('SELECT id FROM carts WHERE user_id = :uid LIMIT 1');
      checkStmt.bind({ ':uid': uid });
      const exists = checkStmt.step();
      checkStmt.free();

      if (exists) {
        db.run('UPDATE carts SET items_json = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?', [itemsJson, uid]);
      } else {
        db.run('INSERT INTO carts (user_id, items_json) VALUES (?, ?)', [uid, itemsJson]);
      }

      res.json({ success: true, message: 'Cart synced to database' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Cart - Clear Cart
  // ---------------------------------------------------------------------------
  app.delete('/api/cart', (req: Request, res: Response) => {
    try {
      const uid = Number(req.query.user_id) || 1;
      db.run('DELETE FROM carts WHERE user_id = ?', [uid]);
      res.json({ success: true, message: 'Cart cleared' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Deliveries - List All Shipments
  // ---------------------------------------------------------------------------
  app.get('/api/deliveries', (req: Request, res: Response) => {
    try {
      const userId = req.query.user_id ? Number(req.query.user_id) : null;
      const stmt = userId
        ? db.prepare('SELECT * FROM shipments WHERE user_id = :uid ORDER BY id DESC')
        : db.prepare('SELECT * FROM shipments ORDER BY id DESC');
      if (userId) stmt.bind({ ':uid': userId });
      const shipments: any[] = [];
      while (stmt.step()) {
        const item = stmt.getAsObject() as any;
        try {
          item.items_preview = typeof item.items_preview_json === 'string' ? JSON.parse(item.items_preview_json) : [];
        } catch {
          item.items_preview = [];
        }
        try {
          item.checkpoints = typeof item.checkpoints_json === 'string' ? JSON.parse(item.checkpoints_json) : [];
        } catch {
          item.checkpoints = [];
        }
        shipments.push(item);
      }
      stmt.free();
      res.json({ success: true, data: shipments });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Deliveries - Create / Save New Shipment
  // ---------------------------------------------------------------------------
  app.post('/api/deliveries', (req: Request, res: Response) => {
    try {
      const s = req.body;
      const shipmentId = s.id || `shp-${s.order_number || Date.now()}`;
      const trackingNumber = s.tracking_number || `SC-TRK-${s.order_number || Math.floor(100000 + Math.random() * 900000)}`;
      const itemsPreviewJson = JSON.stringify(s.items_preview || []);
      const checkpointsJson = JSON.stringify(s.checkpoints || []);

      db.run(
        `INSERT OR REPLACE INTO shipments (
          shipment_id, order_number, user_id, courier_name, courier_service, tracking_number,
          status, status_label, recipient_name, recipient_phone, delivery_address, origin_address,
          estimated_arrival, driver_name, driver_phone, driver_vehicle, current_location,
          items_count, items_preview_json, total_amount, checkpoints_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          shipmentId,
          s.order_number || String(Date.now()),
          s.user_id || 1,
          s.courier_name || 'Shopcart Express Priority',
          s.courier_service || 'Fast Local & Ground Tracking',
          trackingNumber,
          s.status || 'in_transit',
          s.status_label || 'In Transit — Live GPS Tracking Active',
          s.recipient_name || 'Customer',
          s.recipient_phone || '+1 (555) 234-5678',
          s.delivery_address || '4140 Parker Rd. Allentown, New Mexico 31134',
          s.origin_address || 'Central Fulfillment Center #4, North Hub',
          s.estimated_arrival || 'Tomorrow by 2:00 PM',
          s.driver_name || 'Marcus Vance (Courier Specialist)',
          s.driver_phone || '+1 (555) 987-6543',
          s.driver_vehicle || 'Eco Delivery Van #EV-428',
          s.current_location || 'Regional Distribution Center, Sector 7',
          s.items_count || 1,
          itemsPreviewJson,
          s.total_amount || 0,
          checkpointsJson
        ]
      );

      res.json({
        success: true,
        message: 'Delivery shipment saved to database',
        shipment: {
          ...s,
          id: shipmentId,
          tracking_number: trackingNumber
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // API: Deliveries - Get Single Delivery by Tracking or Order Number
  // ---------------------------------------------------------------------------
  app.get('/api/deliveries/:idOrCode', (req: Request, res: Response) => {
    try {
      const { idOrCode } = req.params;
      const stmt = db.prepare(
        'SELECT * FROM shipments WHERE shipment_id = :code OR tracking_number = :code OR order_number = :code LIMIT 1'
      );
      stmt.bind({ ':code': idOrCode });
      let shipment: any = null;
      if (stmt.step()) {
        shipment = stmt.getAsObject();
        try {
          shipment.items_preview = typeof shipment.items_preview_json === 'string' ? JSON.parse(shipment.items_preview_json) : [];
        } catch {}
        try {
          shipment.checkpoints = typeof shipment.checkpoints_json === 'string' ? JSON.parse(shipment.checkpoints_json) : [];
        } catch {}
      }
      stmt.free();

      if (!shipment) {
        return res.status(404).json({ success: false, message: 'Shipment not found' });
      }

      res.json({ success: true, data: shipment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ---------------------------------------------------------------------------
  // Backend Environment Toggle: DEMO_SQLI_MODE
  // Allows testing both modes during local demonstration without modifying frontend
  // ---------------------------------------------------------------------------
  app.get('/api/config/demo-mode', (req: Request, res: Response) => {
    res.json({
      demo_sqli_mode: demoSqliMode,
      description: demoSqliMode
        ? 'MODE A: Intentionally vulnerable raw queries for local education demonstration'
        : 'MODE B: Secure parameterized implementation'
    });
  });

  app.post('/api/config/demo-mode', (req: Request, res: Response) => {
    const { enabled } = req.body;
    demoSqliMode = Boolean(enabled);
    res.json({
      success: true,
      demo_sqli_mode: demoSqliMode,
      description: demoSqliMode
        ? 'Switched to MODE A: Intentionally vulnerable raw SQL queries'
        : 'Switched to MODE B: Secure parameterized queries'
    });
  });

  // ---------------------------------------------------------------------------
  // Mount Vite Middleware for Dev or Static files in Prod
  // ---------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🛒 Shopcart E-Commerce Store is running`);
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   Backend SQLi Demo Mode: ${demoSqliMode ? 'MODE A (Vulnerable Demo)' : 'MODE B (Secure)'}`);
    console.log(`========================================\n`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
