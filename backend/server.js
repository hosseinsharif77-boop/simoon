// backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { uploadImage } = require('./upload');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.static(path.resolve(__dirname, '../frontend')));

// =================================================================================
// TODO: پیاده‌سازی کامل احراز هویت (Authentication)
// این یک middleware موقت برای دمو است. در نسخه نهایی، باید یک سیستم لاگین
// مبتنی بر JWT یا Session پیاده‌سازی کنید که کاربر را شناسایی کرده و
// restaurantId مربوط به او را در req.user قرار دهد.
// فعلاً برای دمو، یک رستوران با id=1 را در نظر می‌گیریم.
const authenticateUser = (req, res, next) => {
    // در نسخه نهایی، این مقدار از توکن احراز هویت استخراج می‌شود
    req.user = { restaurantId: 1 }; 
    next();
};
// =================================================================================

// Health check route
app.get('/', (req, res) => {
  res.send('Simoon Cafe Server is running with the new multi-tenant database structure!');
});

// ======================= IMAGE UPLOAD API ROUTE =======================

// API برای آپلود یک تصویر
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'هیچ فایل تصویری ارائه نشد.' });
  }

  try {
    const { publicUrl, error } = await uploadImage(req.file.buffer, req.file.originalname);

    if (error) {
      return res.status(500).json({ message: 'خطا در آپلود تصویر.', error: error.message });
    }

    res.status(200).json({ imageUrl: publicUrl });
  } catch (err) {
    console.error('خطای غیرمنتظره هنگام آپلود تصویر:', err);
    res.status(500).json({ message: 'خطای غیرمنتظره رخ داد.' });
  }
});

// ======================= MENU API ROUTES =======================

// API to get all menu items with their ingredients
app.get('/api/menu', authenticateUser, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    // این کوئری اکنون داده‌های اصلی را به همراه نام‌های دسته‌بندی برمی‌گرداند
    const { rows } = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.price,
        m.image,
        m.is_special,
        m.category_id,
        m.sub_category_id,
        c.name as category_name,
        sc.name as sub_category_name,
        COALESCE(
          json_agg(
            json_build_object(
              'name', i.name,
              'quantity', pi.quantity,
              'unit', i.unit
            ) ORDER BY i.name
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'::json
        ) as ingredients
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN categories sc ON m.sub_category_id = sc.id
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.restaurant_id = $1
      GROUP BY m.id, c.name, sc.name
      ORDER BY m.id
    `, [restaurantId]);

    // دیگر نیازی به تبدیل داده نیست، فرانت‌اند با ID و نام کار می‌کند
    res.json(rows);
  } catch (err) {
    console.error('Error fetching menu items:', err.message);
    res.status(500).json({ message: 'Server error while fetching menu' });
  }
});

// API to get a single product by ID with ingredients
app.get('/api/menu/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    const { rows } = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.price,
        m.image,
        m.is_special,
        m.category_id,
        m.sub_category_id,
        c.name as category_name,
        sc.name as sub_category_name,
        COALESCE(
          json_agg(
            json_build_object(
              'name', i.name,
              'quantity', pi.quantity,
              'unit', i.unit
            ) ORDER BY i.name
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'::json
        ) as ingredients
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN categories sc ON m.sub_category_id = sc.id
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.id = $1 AND m.restaurant_id = $2
      GROUP BY m.id, c.name, sc.name
    `, [id, restaurantId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching menu item ${req.params.id}:`, err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ======================= ADMIN API ROUTES =======================

// API to create a new product with ingredients
app.post('/api/admin/menu', authenticateUser, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    // فرانت‌اند اکنون مستقیماً category_id و sub_category_id را ارسال می‌کند
    const { name, price, image, category_id, sub_category_id, is_special, ingredients } = req.body;
    const restaurantId = req.user.restaurantId;

    // 1. Insert the main product
    const { rows } = await client.query(
      'INSERT INTO menu_items (name, price, image, category_id, sub_category_id, is_special, restaurant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, price, image, category_id, sub_category_id, is_special, restaurantId]
    );
    
    const productId = rows[0].id;
    
    // 2. Insert ingredients if provided
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        let { rows: [existingIngredient] } = await client.query(
          'SELECT id FROM ingredients WHERE name = $1 AND restaurant_id = $2',
          [ingredient.name, restaurantId]
        );
        
        if (!existingIngredient) {
          const { rows: [newIngredient] } = await client.query(
            'INSERT INTO ingredients (name, unit, restaurant_id) VALUES ($1, $2, $3) RETURNING id',
            [ingredient.name, ingredient.unit || 'grams', restaurantId]
          );
          existingIngredient = newIngredient;
        }
        
        await client.query(
          'INSERT INTO product_ingredients (product_id, ingredient_id, quantity, restaurant_id) VALUES ($1, $2, $3, $4) ON CONFLICT (product_id, ingredient_id, restaurant_id) DO UPDATE SET quantity = EXCLUDED.quantity',
          [productId, existingIngredient.id, ingredient.quantity, restaurantId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Get the complete product with ingredients to return
    const { rows: [fullProduct] } = await client.query(`
      SELECT 
        m.id, m.name, m.price, m.image, m.is_special, m.restaurant_id,
        m.category_id, m.sub_category_id,
        c.name as category_name, sc.name as sub_category_name,
        COALESCE(json_agg(json_build_object('name', i.name, 'quantity', pi.quantity, 'unit', i.unit) ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL), '[]'::json) as ingredients
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN categories sc ON m.sub_category_id = sc.id
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id AND m.restaurant_id = pi.restaurant_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.id = $1
      GROUP BY m.id, c.name, sc.name
    `, [productId]);
    
    res.status(201).json(fullProduct);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating menu item:', err.message);
    res.status(500).json({ message: 'Server error while creating product' });
  } finally {
    client.release();
  }
});

// API to update an existing product with ingredients
app.put('/api/admin/menu/:id', authenticateUser, async (req, res) => {
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const productId = req.params.id;
    // فرانت‌اند اکنون مستقیماً category_id و sub_category_id را ارسال می‌کند
    const { name, price, image, category_id, sub_category_id, is_special, ingredients } = req.body;
    const restaurantId = req.user.restaurantId;
    
    // 1. Update the main product
    const { rows } = await client.query(
      'UPDATE menu_items SET name = $1, price = $2, image = $3, category_id = $4, sub_category_id = $5, is_special = $6 WHERE id = $7 AND restaurant_id = $8 RETURNING *',
      [name, price, image, category_id, sub_category_id, is_special, productId, restaurantId]
    );
    
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Product not found for update' });
    }
    
    // 2. Delete old ingredient links for this product
    await client.query('DELETE FROM product_ingredients WHERE product_id = $1 AND restaurant_id = $2', [productId, restaurantId]);
    
    // 3. Re-insert ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        let existingIngredient;
        const result = await client.query(
          'SELECT id FROM ingredients WHERE name = $1 AND restaurant_id = $2',
          [ingredient.name, restaurantId]
        );
        
        if (result.rows.length > 0) {
          existingIngredient = result.rows[0];
        }
        
        if (!existingIngredient) {
          const newResult = await client.query(
            'INSERT INTO ingredients (name, unit, restaurant_id) VALUES ($1, $2, $3) RETURNING id',
            [ingredient.name, ingredient.unit || 'grams', restaurantId]
          );
          existingIngredient = newResult.rows[0];
        }
        
        await client.query(
          'INSERT INTO product_ingredients (product_id, ingredient_id, quantity, restaurant_id) VALUES ($1, $2, $3, $4)',
          [productId, existingIngredient.id, ingredient.quantity, restaurantId]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Get the complete product with ingredients to return
    const { rows: [fullProduct] } = await client.query(`
      SELECT 
        m.id, m.name, m.price, m.image, m.is_special, m.restaurant_id,
        m.category_id, m.sub_category_id,
        c.name as category_name, sc.name as sub_category_name,
        COALESCE(json_agg(json_build_object('name', i.name, 'quantity', pi.quantity, 'unit', i.unit) ORDER BY i.name) FILTER (WHERE i.id IS NOT NULL), '[]'::json) as ingredients
      FROM menu_items m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN categories sc ON m.sub_category_id = sc.id
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id AND m.restaurant_id = pi.restaurant_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.id = $1
      GROUP BY m.id, c.name, sc.name
    `, [productId]);

    res.json(fullProduct);
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error(`Error updating menu item ${req.params.id}:`, err.message);
    res.status(500).json({ message: 'Server error while updating product', error: err.message });
  } finally {
    if (client) client.release();
  }
});

// API to delete a product
app.delete('/api/admin/menu/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    const { rows } = await db.query('DELETE FROM menu_items WHERE id = $1 AND restaurant_id = $2 RETURNING *', [id, restaurantId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Product not found for deletion' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(`Error deleting menu item ${req.params.id}:`, err.message);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// ======================= CUSTOM CATEGORIES API ROUTES =======================

// API to get all custom categories
app.get('/api/admin/custom-categories', authenticateUser, async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        // این کوئری اکنون نام دسته‌بندی والد را نیز برمی‌گرداند
        const { rows } = await db.query(`
            SELECT 
                c.id, 
                c.name, 
                c.type, 
                c.parent_category_id,
                pc.name as parent_category_name
            FROM categories c
            LEFT JOIN categories pc ON c.parent_category_id = pc.id
            WHERE c.restaurant_id = $1 
            ORDER BY c.name
        `, [restaurantId]);
        res.json(rows);
    } catch (err) {
        console.error('Error fetching custom categories:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// API to create a new custom category
app.post('/api/admin/categories', authenticateUser, async (req, res) => {
    try {
        const { name, type, parent_category_id } = req.body; // فرانت‌اند اکنون parent_category_id را ارسال می‌کند
        const restaurantId = req.user.restaurantId;
        const categoryType = type || 'category';
        
        const { rows } = await db.query(
            'INSERT INTO categories (name, type, parent_category_id, restaurant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, categoryType, parent_category_id, restaurantId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating category:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// API to create a new custom subcategory
app.post('/api/admin/subcategories', authenticateUser, async (req, res) => {
    try {
        const { name, parent_category_id } = req.body; // فرانت‌اند اکنون parent_category_id را ارسال می‌کند
        const restaurantId = req.user.restaurantId;

        const { rows } = await db.query(
            'INSERT INTO categories (name, type, parent_category_id, restaurant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, 'subcategory', parent_category_id, restaurantId]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating subcategory:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// API to delete a subcategory
app.delete('/api/admin/subcategories/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurantId;
        
        const { rows } = await db.query(
            'DELETE FROM categories WHERE id = $1 AND restaurant_id = $2 AND type = \'subcategory\' RETURNING *', 
            [id, restaurantId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subcategory not found for deletion' });
        }

        res.json({ message: 'Subcategory deleted successfully' });
    } catch (err) {
        console.error(`Error deleting subcategory ${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Server error while deleting subcategory' });
    }
});

// API to update a subcategory
app.put('/api/admin/subcategories/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, parent_category_id } = req.body; // فرانت‌اند اکنون parent_category_id را ارسال می‌کند
        const restaurantId = req.user.restaurantId;

        const { rows } = await db.query(
            'UPDATE categories SET name = $1, parent_category_id = $2 WHERE id = $3 AND restaurant_id = $4 AND type = \'subcategory\' RETURNING *',
            [name, parent_category_id, id, restaurantId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subcategory not found for update' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`Error updating subcategory ${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Server error while updating subcategory' });
    }
});

// API to delete a category
app.delete('/api/admin/categories/:id', authenticateUser, async (req, res) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        
        // The 'id' in the URL is actually the category NAME sent by the frontend
        const categoryName = req.params.id; 
        const restaurantId = req.user.restaurantId;
        
        // 1. First, find the category by its NAME to get its ID
        const { rows: [categoryToDelete] } = await client.query(
            'SELECT id FROM categories WHERE name = $1 AND restaurant_id = $2 AND parent_category_id IS NULL',
            [categoryName, restaurantId]
        );

        if (!categoryToDelete) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Main category not found for deletion' });
        }

        const categoryIdToDelete = categoryToDelete.id;

        // 2. Delete all subcategories of this main category using the ID
        const deleteSubcategoriesResult = await client.query(
            'DELETE FROM categories WHERE parent_category_id = $1 AND restaurant_id = $2 RETURNING *',
            [categoryIdToDelete, restaurantId]
        );

        // 3. Delete all products belonging to this main category using the ID
        const deleteProductsResult = await client.query(
            'DELETE FROM menu_items WHERE category_id = $1 AND restaurant_id = $2 RETURNING *',
            [categoryIdToDelete, restaurantId]
        );
        
        // 4. Delete the main category itself using the ID
        const { rows } = await client.query(
            'DELETE FROM categories WHERE id = $1 AND restaurant_id = $2 RETURNING *', 
            [categoryIdToDelete, restaurantId]
        );
        
        await client.query('COMMIT');

        res.json({ 
            message: `Category "${categoryName}" and ${deleteSubcategoriesResult.rows.length} subcategories and ${deleteProductsResult.rows.length} products deleted successfully.` 
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`Error deleting category ${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Server error while deleting category', error: err.message });
    } finally {
        client.release();
    }
});

// API to update a category
app.put('/api/admin/categories/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, image, description } = req.body;
        const restaurantId = req.user.restaurantId;

        // بررسی وجود ستون‌ها قبل از استفاده از آن‌ها
        const { rows: tableInfo } = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'categories'
        `);
        
        const hasImageColumn = tableInfo.some(col => col.column_name === 'image');
        const hasDescriptionColumn = tableInfo.some(col => col.column_name === 'description');
        
        // ساخت دینامیک کوئری بر اساس ستون‌های موجود
        let updateQuery = 'UPDATE categories SET name = $1, type = $2';
        const queryParams = [name, type || 'category'];
        let paramIndex = 3;
        
        if (hasImageColumn) {
            updateQuery += `, image = $${paramIndex}`;
            queryParams.push(image || null);
            paramIndex++;
        }
        
        if (hasDescriptionColumn) {
            updateQuery += `, description = $${paramIndex}`;
            queryParams.push(description || null);
            paramIndex++;
        }
        
        updateQuery += ` WHERE id = $${paramIndex} AND restaurant_id = $${paramIndex + 1} RETURNING *`;
        queryParams.push(id, restaurantId);

        const { rows } = await db.query(updateQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Category not found for update' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(`Error updating category ${req.params.id}:`, err.message);
        res.status(500).json({ message: 'Server error while updating category' });
    }
});


// ======================= SPECIAL SLIDES API ROUTES =======================

// API to get all special carousel slides
app.get('/api/admin/special-slides', authenticateUser, async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        const { rows } = await db.query(`
            SELECT id, title, description, image_url
            FROM special_slides
            WHERE restaurant_id = $1
            ORDER BY id
        `, [restaurantId]);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching special slides:', err.message);
        res.status(500).json({ message: 'Server error while fetching special slides' });
    }
});

// API to create a new special carousel slide
app.post('/api/admin/special-slides', authenticateUser, async (req, res) => {
    try {
        const { title, description, image_url } = req.body;
        const restaurantId = req.user.restaurantId;
        
        if (!title || !description || !image_url) {
            return res.status(400).json({ message: 'Please provide title, description, and image_url' });
        }
        
        const { rows } = await db.query(`
            INSERT INTO special_slides (title, description, image_url, restaurant_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [title, description, image_url, restaurantId]);
        
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating special slide:', err.message);
        res.status(500).json({ message: 'Server error while creating special slide' });
    }
});

// API to update an existing special carousel slide
app.put('/api/admin/special-slides/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, image_url } = req.body;
        const restaurantId = req.user.restaurantId;
        
        if (!title || !description || !image_url) {
            return res.status(400).json({ message: 'Please provide title, description, and image_url' });
        }
        
        const { rows } = await db.query(`
            UPDATE special_slides
            SET title = $1, description = $2, image_url = $3
            WHERE id = $4 AND restaurant_id = $5
            RETURNING *
        `, [title, description, image_url, id, restaurantId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Special slide not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error updating special slide:', err.message);
        res.status(500).json({ message: 'Server error while updating special slide' });
    }
});

// API to delete a special carousel slide
app.delete('/api/admin/special-slides/:id', authenticateUser, async (req, res) => {
    try {
        const { id } = req.params;
        const restaurantId = req.user.restaurantId;
        
        const { rows } = await db.query(`
            DELETE FROM special_slides
            WHERE id = $1 AND restaurant_id = $2
            RETURNING *
        `, [id, restaurantId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Special slide not found' });
        }
        
        res.json({ message: 'Special slide deleted successfully' });
    } catch (err) {
        console.error('Error deleting special slide:', err.message);
        res.status(500).json({ message: 'Server error while deleting special slide' });
    }
});

// ======================= SERVER-SENT EVENTS (SSE) FOR CATEGORY UPDATES =======================

// ذخیره کلاینت‌های متصل به SSE
let sseClients = [];

// مسیر برای اتصال کلاینت‌ها به SSE
app.get('/api/categories-updates', authenticateUser, (req, res) => {
    // تنظیم هدرهای لازم برای SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // ارسال پیام اولیه برای تأیید اتصال
    res.write('data: {"action": "connected"}\n\n');
    
    // اضافه کردن کلاینت به لیست کلاینت‌های متصل
    const clientId = Date.now();
    const newClient = {
        id: clientId,
        res: res
    };
    sseClients.push(newClient);
    
    console.log(`Client ${clientId} connected to SSE. Total clients: ${sseClients.length}`);
    
    // حذف کلاینت از لیست در صورت قطع اتصال
    req.on('close', () => {
        sseClients = sseClients.filter(client => client.id !== clientId);
        console.log(`Client ${clientId} disconnected from SSE. Total clients: ${sseClients.length}`);
    });
});

// مسیر برای ارسال اطلاع‌رسانی به تمام کلاینت‌های متصل
app.post('/api/notify-category-update', authenticateUser, (req, res) => {
    const { action } = req.body;
    
    // ارسال اطلاع‌رسانی به تمام کلاینت‌های متصل
    sseClients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ action })}\n\n`);
    });
    
    console.log(`Notification sent to ${sseClients.length} clients: ${action}`);
    res.status(200).json({ message: 'Notification sent' });
});

// ======================= INVENTORY API ROUTES =======================

// API برای دریافت تمام مواد اولیه به همراه موجودی آن‌ها
app.get('/api/inventory/ingredients', authenticateUser, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { rows } = await db.query(`
      SELECT 
        i.id,
        i.name,
        i.unit,
        i.stock_quantity,
        i.min_stock_alert
      FROM ingredients i
      WHERE i.restaurant_id = $1
      ORDER BY i.name
    `, [restaurantId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inventory ingredients:', err.message);
    res.status(500).json({ message: 'Server error while fetching inventory' });
  }
});

// API برای به‌روزرسانی موجودی یک ماده اولیه (ورود یا خروج دستی)
app.post('/api/inventory/update-stock', authenticateUser, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { ingredientId, quantityChange, reason } = req.body;
    const restaurantId = req.user.restaurantId;

    // 1. دریافت موجودی فعلی ماده اولیه
    const { rows: [currentStock] } = await client.query(
      'SELECT stock_quantity FROM ingredients WHERE id = $1 AND restaurant_id = $2 FOR UPDATE',
      [ingredientId, restaurantId]
    );

    if (!currentStock) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    const newStock = parseFloat(currentStock.stock_quantity) + parseFloat(quantityChange);

    if (newStock < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient stock for this operation.' });
    }

    // 2. به‌روزرسانی موجودی ماده اولیه
    await client.query(
      'UPDATE ingredients SET stock_quantity = $1 WHERE id = $2 AND restaurant_id = $3',
      [newStock, ingredientId, restaurantId]
    );

    // 3. ثبت عملیات در لاگ انبار
    await client.query(
      'INSERT INTO inventory_logs (ingredient_id, change_type, quantity_change, quantity_before, quantity_after, reason, restaurant_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [ingredientId, quantityChange > 0 ? 'manual_in' : 'manual_out', quantityChange, currentStock.stock_quantity, newStock, reason, restaurantId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Stock updated successfully', newStock: newStock });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating stock:', err.message);
    res.status(500).json({ message: 'Server error while updating stock' });
  } finally {
    client.release();
  }
});

// API برای افزودن یک ماده اولیه جدید
app.post('/api/inventory/ingredients', authenticateUser, async (req, res) => {
  try {
    const { name, unit, stock_quantity, min_stock_alert } = req.body;
    const restaurantId = req.user.restaurantId;
    const { rows } = await db.query(
      'INSERT INTO ingredients (name, unit, stock_quantity, min_stock_alert, restaurant_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, unit, stock_quantity || 0, min_stock_alert || 10.0, restaurantId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating ingredient:', err.message);
    res.status(500).json({ message: 'Server error while creating ingredient' });
  }
});

// API برای دریافت موجودی قابل‌تولید محصولات
app.get('/api/inventory/product-stock', authenticateUser, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    // این کوئری کمی پیچیده‌تر است. برای هر محصول، کمترین مقدار قابل تولید را بر اساس مواد اولیه محاسبه می‌کند.
    const { rows } = await db.query(`
      SELECT
        m.id AS product_id,
        m.name AS product_name,
        MIN(
          CASE 
            WHEN i.stock_quantity IS NULL OR i.stock_quantity = 0 THEN 0 
            ELSE FLOOR(i.stock_quantity / pi.quantity) 
          END
        ) AS producible_quantity
      FROM menu_items m
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.restaurant_id = $1
      GROUP BY m.id, m.name
      ORDER BY m.name
    `, [restaurantId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching product stock:', err.message);
    res.status(500).json({ message: 'Server error while fetching product stock' });
  }
});

// API برای ثبت سفارش و کاهش خودکار موجودی
app.post('/api/inventory/consume-order', authenticateUser, async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { orderItems } = req.body; // orderItems باید آرایه‌ای از { productId, quantity } باشد
    const restaurantId = req.user.restaurantId;

    for (const item of orderItems) {
      const { productId, quantity } = item;

      // 1. پیدا کردن مواد اولیه مورد نیاز برای این محصول
      const { rows: ingredients } = await client.query(`
        SELECT pi.ingredient_id, pi.quantity, i.name as ingredient_name
        FROM product_ingredients pi
        LEFT JOIN ingredients i ON pi.ingredient_id = i.id
        WHERE pi.product_id = $1 AND pi.restaurant_id = $2
      `, [productId, restaurantId]);

      // 2. برای هر ماده اولیه، موجودی را کاهش دهید
      for (const ing of ingredients) {
        const { rows: [currentStock] } = await client.query(
          'SELECT stock_quantity FROM ingredients WHERE id = $1 AND restaurant_id = $2 FOR UPDATE',
          [ing.ingredient_id, restaurantId]
        );

        const totalQuantityToConsume = ing.quantity * quantity;
        const newStock = parseFloat(currentStock.stock_quantity) - totalQuantityToConsume;

        if (newStock < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Insufficient stock for ingredient: ${ing.ingredient_name}. Cannot fulfill order.` 
          });
        }

        // 3. به‌روزرسانی موجودی ماده اولیه
        await client.query(
          'UPDATE ingredients SET stock_quantity = $1 WHERE id = $2 AND restaurant_id = $3',
          [newStock, ing.ingredient_id, restaurantId]
        );

        // 4. ثبت در لاگ انبار
        await client.query(
          'INSERT INTO inventory_logs (ingredient_id, change_type, quantity_change, quantity_before, quantity_after, reason, restaurant_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [ing.ingredient_id, 'sale', -totalQuantityToConsume, currentStock.stock_quantity, newStock, `Sale of product ID: ${productId}`, restaurantId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Order consumed and inventory updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error consuming order:', err.message);
    res.status(500).json({ message: 'Server error while processing order consumption' });
  } finally {
    client.release();
  }
});

// API برای دریافت هشدارهای موجودی پایین
app.get('/api/inventory/low-stock-alerts', authenticateUser, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { rows } = await db.query(`
      SELECT id, name, stock_quantity, unit
      FROM ingredients
      WHERE restaurant_id = $1 AND stock_quantity <= min_stock_alert
      ORDER BY stock_quantity ASC
    `, [restaurantId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching low stock alerts:', err.message);
    res.status(500).json({ message: 'Server error while fetching alerts' });
  }
});

// API برای دریافت گزارشات عملیات انبار
app.get('/api/inventory/logs', authenticateUser, async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { type, date, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        il.id,
        il.ingredient_id,
        i.name as ingredient_name,
        il.change_type,
        il.quantity_change,
        il.quantity_before,
        il.quantity_after,
        il.reason,
        il.created_at
      FROM inventory_logs il
      LEFT JOIN ingredients i ON il.ingredient_id = i.id
      WHERE il.restaurant_id = $1
    `;
    
    const queryParams = [restaurantId];
    let paramIndex = 2;
    
    if (type) {
      query += ` AND il.change_type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }
    
    if (date) {
      query += ` AND DATE(il.created_at) = $${paramIndex}`;
      queryParams.push(date);
      paramIndex++;
    }
    
    query += ` ORDER BY il.created_at DESC LIMIT $${paramIndex}`;
    queryParams.push(parseInt(limit));
    
    const { rows } = await db.query(query, queryParams);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching inventory logs:', err.message);
    res.status(500).json({ message: 'Server error while fetching inventory logs' });
  }
});

// ======================= DEBUG API ROUTES =======================

// API to show database structure (for debugging)
app.get('/api/debug/database-structure', authenticateUser, async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        // Get all tables
        const { rows: tables } = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        const structure = {};
        
        // Get columns for each table
        for (const table of tables) {
            const { rows: columns } = await db.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_name = '${table.table_name}'
                ORDER BY ordinal_position
            `);
            
            structure[table.table_name] = columns;
            
            // Get sample data for each table (first 3 rows)
            try {
                // For tables with restaurant_id, filter by the current restaurant
                let query = `SELECT * FROM ${table.table_name} LIMIT 3`;
                const hasRestaurantId = columns.some(col => col.column_name === 'restaurant_id');
                
                if (hasRestaurantId) {
                    query = `SELECT * FROM ${table.table_name} WHERE restaurant_id = ${restaurantId} LIMIT 3`;
                }
                
                const { rows: sampleData } = await db.query(query);
                structure[table.table_name].push({ 
                    _sampleData: sampleData,
                    _count: (await db.query(`SELECT COUNT(*) as count FROM ${table.table_name} ${hasRestaurantId ? `WHERE restaurant_id = ${restaurantId}` : ''}`)).rows[0].count
                });
            } catch (err) {
                structure[table.table_name].push({ _error: err.message });
            }
        }
        
        res.json({
            message: 'Database structure and sample data',
            structure: structure,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting database structure:', error);
        res.status(500).json({ error: error.message });
    }
});

// API to show all data from a specific table
app.get('/api/debug/table/:tableName', authenticateUser, async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        const tableName = req.params.tableName;
        
        // Security check - only allow specific tables
        const allowedTables = ['menu_items', 'categories', 'ingredients', 'product_ingredients', 'inventory_logs'];
        if (!allowedTables.includes(tableName)) {
            return res.status(400).json({ error: 'Table not allowed' });
        }
        
        // Check if table has restaurant_id column
        const { rows: columns } = await db.query(`
            SELECT column_name 
            FROM information_schema.columns
            WHERE table_name = $1
        `, [tableName]);
        
        const hasRestaurantId = columns.some(col => col.column_name === 'restaurant_id');
        
        let query = `SELECT * FROM ${tableName}`;
        if (hasRestaurantId) {
            query += ` WHERE restaurant_id = ${restaurantId}`;
        }
        
        const { rows } = await db.query(query);
        
        res.json({
            table: tableName,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error(`Error getting data from table ${req.params.tableName}:`, error);
        res.status(500).json({ error: error.message });
    }
});

// ======================= ERROR HANDLING =======================

// Middleware for handling 404 errors (route not found)
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});

// Middleware for handling other errors
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
  console.log(`Frontend is available at: http://127.0.0.1:${PORT}`);
});