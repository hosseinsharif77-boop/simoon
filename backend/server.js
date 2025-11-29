const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./db'); // *** استفاده از فایل db.js برای اتصال ***

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// سرو کردن فایل‌های استاتیک از پوشه frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// یک مسیر تستی
app.get('/', (req, res) => {
  res.send('سرور کافه سیمون با اتصال مستقیم PostgreSQL با موفقیت اجرا شد!');
});

// ======================= MENU API ROUTES =======================

// API برای گرفتن تمام آیتم‌های منو
app.get('/api/menu', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM menu_items ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور');
  }
});

// API برای خواندن یک محصول خاص بر اساس id
app.get('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM menu_items WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'محصولی یافت نشد' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور');
  }
});

// ======================= ADMIN API ROUTES =======================

// --- مدیریت محصولات ---

// API برای ایجاد محصول جدید (Create)
app.post('/api/admin/menu', async (req, res) => {
  try {
    const { name, description, price, image, category, sub_category, is_special, stock_quantity } = req.body;
    
    // ۱. اطمینان از وجود دسته‌بندی‌ها
    await ensureCategoryExists(category, 'category');
    if (sub_category) {
        await ensureCategoryExists(sub_category, 'subcategory', category);
    }

    // ۲. افزودن محصول
    const { rows } = await db.query(
      'INSERT INTO menu_items (name, description, price, image, category, sub_category, is_special, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [name, description, price, image, category, sub_category, is_special, stock_quantity]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور هنگام ایجاد محصول');
  }
});

// API برای ویرایش محصول موجود (Update)
app.put('/api/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, category, sub_category, is_special, stock_quantity } = req.body;
    
    // ۱. اطمینان از وجود دسته‌بندی‌ها
    await ensureCategoryExists(category, 'category');
    if (sub_category) {
        await ensureCategoryExists(sub_category, 'subcategory', category);
    }

    // ۲. ویرایش محصول
    const { rows } = await db.query(
      'UPDATE menu_items SET name = $1, description = $2, price = $3, image = $4, category = $5, sub_category = $6, is_special = $7, stock_quantity = $8 WHERE id = $9 RETURNING *',
      [name, description, price, image, category, sub_category, is_special, stock_quantity, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'محصولی برای ویرایش یافت نشد' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور هنگام ویرایش محصول');
  }
});

// API برای حذف محصول (Delete)
app.delete('/api/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'محصولی برای حذف یافت نشد' });
    }
    res.json({ message: 'محصول با موفقیت حذف شد' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور هنگام حذف محصول');
  }
});

// --- مدیریت دسته‌بندی‌های سفارشی ---

// API برای ایجاد یک دسته‌بندی اصلی جدید
app.post('/api/admin/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const { rows } = await db.query(
      'INSERT INTO custom_categories (name, type) VALUES ($1, $2) ON CONFLICT (name, type) DO NOTHING RETURNING *',
      [name, 'category']
    );

    if (rows.length === 0) {
        return res.status(409).json({ message: 'این دسته‌بندی قبلاً وجود دارد.' });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور هنگام ایجاد دسته‌بندی');
  }
});

// API برای ایجاد یک زیرمجموعه جدید
app.post('/api/admin/subcategories', async (req, res) => {
  try {
    const { name, parentCategory } = req.body;
    const { rows } = await db.query(
      'INSERT INTO custom_categories (name, type, parent_category) VALUES ($1, $2, $3) ON CONFLICT (name, type) DO NOTHING RETURNING *',
      [name, 'subcategory', parentCategory]
    );

    if (rows.length === 0) {
        return res.status(409).json({ message: 'این زیرمجموعه قبلاً وجود دارد.' });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطا در سرور هنگام ایجاد زیرمجموعه');
  }
});

// API برای گرفتن تمام دسته‌بندی‌های سفارشی
app.get('/api/admin/custom-categories', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM custom_categories ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('خطا در سرور');
    }
});

// --- تابع کمکی ---

// تابعی برای اطمینان از وجود دسته‌بندی (معادل upsert)
async function ensureCategoryExists(name, type, parentCategory = null) {
    if (!name || name.trim() === '') return;
    const queryText = `
        INSERT INTO custom_categories (name, type, parent_category) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (name, type) DO NOTHING
    `;
    await db.query(queryText, [name.trim(), type, parentCategory]);
}


// app.listen باید همیشه در انتهای فایل باشد
app.listen(PORT, () => {
  console.log(`سرور در پورت ${PORT} در حال اجراست...`);
});