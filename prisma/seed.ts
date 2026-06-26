import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:admin@localhost:5432/farmfresh",
});

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Customers ──
  const customersData = [
    { id: "CUST-001", name: "Priya Sharma",  email: "priya@gmail.com",  phone: "+91 98765 43210", address: "Plot 42, Jubilee Hills, Hyderabad, Telangana 500033",      joined: "2025-01-15" },
    { id: "CUST-002", name: "Rahul Nair",    email: "rahul@gmail.com",  phone: "+91 91234 56780", address: "12B, MG Road, Kochi, Kerala 682016",                        joined: "2025-03-10" },
    { id: "CUST-003", name: "Anjali Verma",  email: "anjali@gmail.com", phone: "+91 99887 76655", address: "Flat 7, Sector 22, Noida, UP 201301",                       joined: "2025-02-20" },
    { id: "CUST-004", name: "Vikram Singh",  email: "vikram@gmail.com", phone: "+91 98123 45678", address: "45, Model Town, Ludhiana, Punjab 141002",                   joined: "2025-06-05" },
    { id: "CUST-005", name: "Meena Iyer",    email: "meena@gmail.com",  phone: "+91 97654 32100", address: "23, T Nagar, Chennai, Tamil Nadu 600017",                   joined: "2025-01-08" },
    { id: "CUST-006", name: "Arjun Reddy",   email: "arjun@gmail.com",  phone: "+91 95432 10987", address: "89, Banjara Hills, Hyderabad, Telangana 500034",            joined: "2025-09-12" },
    { id: "CUST-007", name: "Sunita Patel",  email: "sunita@gmail.com", phone: "+91 93210 98765", address: "14, CG Road, Ahmedabad, Gujarat 380009",                   joined: "2025-05-18" },
    { id: "CUST-008", name: "Sneha Kapoor",  email: "sneha@gmail.com",  phone: "+91 91098 76543", address: "67, Connaught Place, New Delhi 110001",                     joined: "2025-12-01" },
  ];

  for (const c of customersData) {
    await pool.query(
      `INSERT INTO customers (id, name, email, phone, address, status, joined_date, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,'Active',$6,NOW(),NOW())
       ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.email, c.phone, c.address, c.joined]
    );
  }
  console.log(`✅ ${customersData.length} customers`);

  // ── Categories ──
  const categoriesData = [
    { name: "Vegetables", slug: "vegetables" },
    { name: "Fruits",     slug: "fruits" },
    { name: "Herbs",      slug: "herbs" },
    { name: "Equipment",  slug: "equipment" },
    { name: "Nutrients",  slug: "nutrients" },
  ];

  const catIds: Record<string, number> = {};
  for (const c of categoriesData) {
    const res = await pool.query(
      `INSERT INTO categories (name, slug) VALUES ($1,$2)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [c.name, c.slug]
    );
    catIds[c.slug] = res.rows[0].id;
  }
  console.log(`✅ ${categoriesData.length} categories`);

  // ── Products ──
  const productsData = [
    { name: "Organic Spinach",        price: 60,    unit: "kg",    slug: "vegetables", stock: 120, desc: "Fresh organic spinach grown hydroponically" },
    { name: "Cherry Tomatoes",        price: 80,    unit: "kg",    slug: "vegetables", stock: 85,  desc: "Sweet cherry tomatoes, pesticide-free" },
    { name: "Hydroponic Lettuce",     price: 90,    unit: "pcs",   slug: "vegetables", stock: 60,  desc: "Crisp butterhead lettuce" },
    { name: "Mixed Vegetables Box",   price: 350,   unit: "box",   slug: "vegetables", stock: 30,  desc: "Assorted seasonal vegetables, 3kg box" },
    { name: "Organic Strawberries",   price: 250,   unit: "box",   slug: "fruits",     stock: 40,  desc: "Sweet aeroponically grown strawberries" },
    { name: "Dragon Fruit",           price: 180,   unit: "pcs",   slug: "fruits",     stock: 25,  desc: "Exotic dragon fruit, locally grown" },
    { name: "Fresh Basil",            price: 40,    unit: "bunch", slug: "herbs",      stock: 100, desc: "Fragrant Italian basil" },
    { name: "Mint Leaves",            price: 30,    unit: "bunch", slug: "herbs",      stock: 90,  desc: "Fresh hydroponic mint" },
    { name: "Coriander",              price: 25,    unit: "bunch", slug: "herbs",      stock: 110, desc: "Aromatic fresh coriander" },
    { name: "Hydroponic Tower",       price: 12500, unit: "unit",  slug: "equipment",  stock: 15,  desc: "6-layer vertical hydroponic tower system" },
    { name: "Aeroponic Kit",          price: 14000, unit: "unit",  slug: "equipment",  stock: 10,  desc: "Complete aeroponic growing system" },
    { name: "Hydroponic Starter Kit", price: 4500,  unit: "unit",  slug: "equipment",  stock: 20,  desc: "Beginner-friendly hydroponic setup" },
    { name: "Nutrient Solution A+B",  price: 650,   unit: "litre", slug: "nutrients",  stock: 75,  desc: "Complete hydroponic nutrient mix" },
    { name: "Organic Manure 5kg",     price: 320,   unit: "bag",   slug: "nutrients",  stock: 50,  desc: "Premium organic compost manure" },
    { name: "pH Testing Kit",         price: 280,   unit: "unit",  slug: "nutrients",  stock: 45,  desc: "Digital pH testing kit for hydroponic systems" },
  ];

  const prodIds: Record<string, number> = {};
  for (const p of productsData) {
    const res = await pool.query(
      `INSERT INTO products (name, price, unit, category_id, stock, description, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [p.name, p.price, p.unit, catIds[p.slug], p.stock, p.desc]
    );
    if (res.rows[0]) prodIds[p.name] = res.rows[0].id;
  }
  console.log(`✅ ${productsData.length} products`);

  // ── Orders + OrderItems ──
  const ordersData = [
    { id: "ORD-1028", customerId: "CUST-008", status: "Pending",    payment: "UPI",  date: "2026-04-12", items: [{ name: "Mixed Vegetables Box", qty: 1 }, { name: "Fresh Basil", qty: 3 }] },
    { id: "ORD-1027", customerId: "CUST-004", status: "Processing", payment: "Card", date: "2026-04-12", items: [{ name: "Hydroponic Tower", qty: 1 }] },
    { id: "ORD-1026", customerId: "CUST-001", status: "Delivered",  payment: "UPI",  date: "2026-04-11", items: [{ name: "Organic Spinach", qty: 2 }, { name: "Cherry Tomatoes", qty: 3 }, { name: "Hydroponic Lettuce", qty: 4 }] },
    { id: "ORD-1025", customerId: "CUST-002", status: "Processing", payment: "Card", date: "2026-04-11", items: [{ name: "Aeroponic Kit", qty: 1 }] },
    { id: "ORD-1024", customerId: "CUST-003", status: "Delivered",  payment: "COD",  date: "2026-04-10", items: [{ name: "Hydroponic Lettuce", qty: 2 }, { name: "Fresh Basil", qty: 2 }, { name: "Mint Leaves", qty: 3 }] },
    { id: "ORD-1023", customerId: "CUST-006", status: "Cancelled",  payment: "UPI",  date: "2026-04-10", items: [{ name: "Organic Manure 5kg", qty: 1 }] },
    { id: "ORD-1022", customerId: "CUST-005", status: "Delivered",  payment: "Card", date: "2026-04-09", items: [{ name: "Fresh Basil", qty: 2 }, { name: "Mint Leaves", qty: 2 }, { name: "Coriander", qty: 3 }] },
    { id: "ORD-1021", customerId: "CUST-007", status: "Delivered",  payment: "UPI",  date: "2026-04-08", items: [{ name: "Nutrient Solution A+B", qty: 2 }, { name: "pH Testing Kit", qty: 1 }] },
  ];

  const pricesData = Object.fromEntries(productsData.map((p) => [p.name, p.price]));

  for (const o of ordersData) {
    const subtotal = o.items.reduce((s, i) => s + pricesData[i.name] * i.qty, 0);
    const deliveryFee = subtotal > 500 ? 0 : 40;
    const total = subtotal + deliveryFee;

    await pool.query(
      `INSERT INTO orders (id, customer_id, status, payment_method, subtotal, delivery_fee, discount, total, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,0,$7,$8,NOW())
       ON CONFLICT (id) DO NOTHING`,
      [o.id, o.customerId, o.status, o.payment, subtotal, deliveryFee, total, o.date]
    );

    for (const item of o.items) {
      const pid = prodIds[item.name];
      if (!pid) continue;
      const unitPrice = pricesData[item.name];
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT DO NOTHING`,
        [o.id, pid, item.qty, unitPrice, unitPrice * item.qty]
      );
    }
  }
  console.log(`✅ ${ordersData.length} orders with items`);

  // ── Bulk Orders ──
  const bulkData = [
    { id: "BLK-1008", customerId: "CUST-008", eventType: "Wedding",   status: "Pending",    booking: "2026-04-08", delivery: "2026-04-20", qty: "50 kg",    items: "Mixed Vegetables, Herbs",    total: 8500 },
    { id: "BLK-1007", customerId: "CUST-004", eventType: "Corporate", status: "Confirmed",  booking: "2026-04-07", delivery: "2026-04-15", qty: "30 kg",    items: "Lettuce, Spinach, Tomatoes", total: 5400 },
    { id: "BLK-1006", customerId: "CUST-001", eventType: "Birthday",  status: "Processing", booking: "2026-04-06", delivery: "2026-04-12", qty: "10 boxes", items: "Organic Fruit Box",          total: 3200 },
    { id: "BLK-1005", customerId: "CUST-006", eventType: "Corporate", status: "Confirmed",  booking: "2026-04-05", delivery: "2026-04-18", qty: "20 units", items: "Hydroponics Starter Kits",   total: 28000 },
    { id: "BLK-1004", customerId: "CUST-005", eventType: "Wedding",   status: "Pending",    booking: "2026-04-04", delivery: "2026-04-22", qty: "80 kg",    items: "Mixed Salad Greens",         total: 12800 },
    { id: "BLK-1003", customerId: "CUST-002", eventType: "Festival",  status: "Cancelled",  booking: "2026-04-03", delivery: "2026-04-10", qty: "25 kg",    items: "Herbs Combo",                total: 4000 },
    { id: "BLK-1002", customerId: "CUST-007", eventType: "Other",     status: "Confirmed",  booking: "2026-04-02", delivery: "2026-04-08", qty: "15 boxes", items: "Organic Vegetable Hamper",   total: 6750 },
  ];

  for (const b of bulkData) {
    await pool.query(
      `INSERT INTO bulk_orders (id, customer_id, event_type, status, booking_date, delivery_date, quantity_desc, items_desc, total, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
       ON CONFLICT (id) DO NOTHING`,
      [b.id, b.customerId, b.eventType, b.status, b.booking, b.delivery, b.qty, b.items, b.total]
    );
  }
  console.log(`✅ ${bulkData.length} bulk orders`);

  // ── Services ──
  const servicesData = [
    { name: "Hydroponic Tower Setup",   type: "Hydroponic",   price: 15000, status: "Active",   desc: "Complete installation of 6-layer hydroponic tower system at your home or farm" },
    { name: "Aeroponic System Install", type: "Aeroponic",    price: 22000, status: "Active",   desc: "Full aeroponic system installation with misting setup and timer configuration" },
    { name: "Balcony Garden Setup",     type: "Hydroponic",   price: 8000,  status: "Active",   desc: "Space-efficient hydroponic setup designed for apartment balconies" },
    { name: "Farm Consultation",        type: "Consultation", price: 2500,  status: "Active",   desc: "Expert consultation for setting up organic or hydroponic farming" },
    { name: "Commercial Farm Design",   type: "Hydroponic",   price: 50000, status: "Inactive", desc: "Large-scale commercial hydroponic farm design and planning" },
  ];

  for (const s of servicesData) {
    await pool.query(
      `INSERT INTO services (name, type, price, status, description, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW())
       ON CONFLICT DO NOTHING`,
      [s.name, s.type, s.price, s.status, s.desc]
    );
  }
  console.log(`✅ ${servicesData.length} services`);

  console.log("\n✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => pool.end());
