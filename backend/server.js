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

// Health check route
app.get('/', (req, res) => {
  res.send('Simoon Cafe Server is running with the new database structure!');
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
app.get('/api/menu', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.price,
        m.image,
        m.category,
        m.sub_category,
        m.is_special,
        m.stock_quantity,
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
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      GROUP BY m.id
      ORDER BY m.id
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching menu items:', err.message);
    res.status(500).json({ message: 'Server error while fetching menu' });
  }
});

// API to get a single product by ID with ingredients
app.get('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.price,
        m.image,
        m.category,
        m.sub_category,
        m.is_special,
        m.stock_quantity,
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
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [id]);
    
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
app.post('/api/admin/menu', async (req, res) => {
  const client = await db.connect(); // Get a client for transaction
  try {
    await client.query('BEGIN');
    const { name, price, image, category, sub_category, is_special, stock_quantity, ingredients } = req.body;
    
    // 1. Insert the main product
    const { rows } = await client.query(
      'INSERT INTO menu_items (name, price, image, category, sub_category, is_special, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, price, image, category, sub_category, is_special, stock_quantity]
    );
    
    const productId = rows[0].id;
    
    // 2. Insert ingredients if provided
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        // Check if ingredient exists, if not, create it
        let { rows: [existingIngredient] } = await client.query(
          'SELECT id FROM ingredients WHERE name = $1',
          [ingredient.name]
        );
        
        if (!existingIngredient) {
          const { rows: [newIngredient] } = await client.query(
            'INSERT INTO ingredients (name, unit) VALUES ($1, $2) RETURNING id',
            [ingredient.name, ingredient.unit || 'grams']
          );
          existingIngredient = newIngredient;
        }
        
        // Link product to ingredient
        await client.query(
          'INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (product_id, ingredient_id) DO UPDATE SET quantity = EXCLUDED.quantity',
          [productId, existingIngredient.id, ingredient.quantity]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // Get the complete product with ingredients to return
    const { rows: [fullProduct] } = await client.query(`
      SELECT 
        m.*,
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
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [productId]);
    
    res.status(201).json(fullProduct);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating menu item:', err.message);
    res.status(500).json({ message: 'Server error while creating product' });
  } finally {
    client.release(); // Release client back to the pool
  }
});

// API to update an existing product with ingredients
app.put('/api/admin/menu/:id', async (req, res) => {
  let client;
  try {
    client = await db.connect();
    await client.query('BEGIN');
    const productId = req.params.id;
    const { name, price, image, category, sub_category, is_special, stock_quantity, ingredients } = req.body;
    
    console.log('Updating product with data:', { productId, name, price, image, category, sub_category, is_special, stock_quantity, ingredients });
    
    // 1. Update the main product
    const { rows } = await client.query(
      'UPDATE menu_items SET name = $1, price = $2, image = $3, category = $4, sub_category = $5, is_special = $6, stock_quantity = $7 WHERE id = $8 RETURNING *',
      [name, price, image, category, sub_category, is_special, stock_quantity, productId]
    );
    
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Product not found for update' });
    }
    
    // 2. Delete old ingredient links for this product
    await client.query('DELETE FROM product_ingredients WHERE product_id = $1', [productId]);
    
    // 3. Re-insert ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        console.log('Processing ingredient:', ingredient);
        
        let existingIngredient;
        try {
          const result = await client.query(
            'SELECT id FROM ingredients WHERE name = $1',
            [ingredient.name]
          );
          
          if (result.rows.length > 0) {
            existingIngredient = result.rows[0];
          }
          
          if (!existingIngredient) {
            const newResult = await client.query(
              'INSERT INTO ingredients (name, unit) VALUES ($1, $2) RETURNING id',
              [ingredient.name, ingredient.unit || 'grams']
            );
            existingIngredient = newResult.rows[0];
          }
          
          await client.query(
            'INSERT INTO product_ingredients (product_id, ingredient_id, quantity) VALUES ($1, $2, $3)',
            [productId, existingIngredient.id, ingredient.quantity]
          );
        } catch (err) {
          console.error('Error processing ingredient:', ingredient.name, err);
          // Continue with next ingredient even if one fails
        }
      }
    }
    
    await client.query('COMMIT');
    
    // Get the complete product with ingredients to return
    const { rows: [fullProduct] } = await client.query(`
      SELECT 
        m.*,
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
      LEFT JOIN product_ingredients pi ON m.id = pi.product_id
      LEFT JOIN ingredients i ON pi.ingredient_id = i.id
      WHERE m.id = $1
      GROUP BY m.id
    `, [productId]);
    
    res.json(fullProduct);
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error(`Error updating menu item ${req.params.id}:`, err.message);
    console.error('Full error stack:', err.stack);
    res.status(500).json({ message: 'Server error while updating product', error: err.message });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// API to delete a product
app.delete('/api/admin/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
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
app.get('/api/admin/custom-categories', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT * FROM custom_categories ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching custom categories:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// API to create a new custom category
app.post('/api/admin/categories', async (req, res) => {
    try {
        const { name, type, parentCategory } = req.body;
        
        // اطمینان از اینکه type همیشه مقدار داشته باشد
        const categoryType = type || 'category';
        
        console.log('Creating category with data:', { name, type: categoryType, parentCategory });
        
        const { rows } = await db.query(
            'INSERT INTO custom_categories (name, type, parent_category) VALUES ($1, $2, $3) RETURNING *',
            [name, categoryType, parentCategory]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating category:', err.message);
        console.error('Full error stack:', err.stack);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// API to create a new custom subcategory
app.post('/api/admin/subcategories', async (req, res) => {
    try {
        const { name, parentCategory } = req.body;
        const { rows } = await db.query(
            'INSERT INTO custom_categories (name, type, parent_category) VALUES ($1, $2, $3) RETURNING *',
            [name, 'subcategory', parentCategory]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating subcategory:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});
app.delete('/api/admin/subcategories/:name', async (req, res) => {
    try {
        // دیکد کردن نام از URL برای پشتیبانی از حروف فارسی
        const name = decodeURIComponent(req.params.name);
        const { parentCategory } = req.body;
        
        console.log(`--- Deleting subcategory "${name}" from category "${parentCategory}" ---`);
        
        const { rows } = await db.query('DELETE FROM custom_categories WHERE name = $1 AND parent_category = $2 RETURNING *', [name, parentCategory]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Subcategory not found for deletion' });
        }

        // ارسال اطلاع‌رسانی به کلاینت‌های متصل به SSE
        sseClients.forEach(client => {
            client.res.write(`data: ${JSON.stringify({ action: 'refresh' })}\n\n`);
        });
        console.log(`✅ Subcategory "${name}" deleted and notification sent.`);

        res.json({ message: 'Subcategory deleted successfully' });
    } catch (err) {
        console.error(`Error deleting subcategory ${req.params.name}:`, err.message);
        res.status(500).json({ message: 'Server error while deleting subcategory' });
    }
});
// API to update an existing subcategory
app.put('/api/admin/subcategories/:name', async (req, res) => {
    try {
        const oldName = decodeURIComponent(req.params.name);
        const { name, parentCategory } = req.body;

        console.log(`--- Updating subcategory "${oldName}" ---`);
        console.log('Request body:', req.body);

        const { rows } = await db.query(
            'UPDATE custom_categories SET name = $1, parent_category = $2 WHERE name = $3 AND type = \'subcategory\' RETURNING *',
            [name, parentCategory, oldName]
        );

        if (rows.length === 0) {
            console.log(`Subcategory "${oldName}" not found for update`);
            return res.status(404).json({ message: 'Subcategory not found for update' });
        }

        console.log(`✅ Subcategory "${oldName}" updated to "${name}"`);

        // ارسال اطلاع‌رسانی به کلاینت‌های متصل به SSE
        sseClients.forEach(client => {
            client.res.write(`data: ${JSON.stringify({ action: 'refresh' })}\n\n`);
        });
        console.log(`✅ Notification sent to ${sseClients.length} clients`);

        // ارسال پاسخ موفقیت‌آمیز
        res.status(200).json(rows[0]);
    } catch (err) {
        console.error(`Error updating subcategory ${req.params.name}:`, err.message);
        console.error('Full error stack:', err.stack);
        // اطمینان از ارسال پاسخ خطا
        res.status(500).json({ message: 'Server error while updating subcategory', error: err.message });
    }
});

// API to delete a category or subcategory
app.delete('/api/admin/categories/:name', async (req, res) => {
    try {
        // دیکد کردن نام از URL برای پشتیبانی از حروف فارسی
        const name = decodeURIComponent(req.params.name);
        
        console.log(`--- Deleting category "${name}" ---`);

        // ابتدا بررسی می‌کنیم که آیا زیردسته‌هایی برای این دسته‌بندی اصلی وجود دارد یا نه
        const { rows: subcategories } = await db.query(
            'SELECT * FROM custom_categories WHERE parent_category = $1',
            [name]
        );

        if (subcategories.length > 0) {
            return res.status(400).json({ 
                message: `Cannot delete category "${name}" because it has subcategories. Please delete subcategories first.` 
            });
        }

        // حذف دسته‌بندی
        const { rows } = await db.query('DELETE FROM custom_categories WHERE name = $1 RETURNING *', [name]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Category not found for deletion' });
        }

        // ارسال اطلاع‌رسانی به کلاینت‌های متصل به SSE
        sseClients.forEach(client => {
            client.res.write(`data: ${JSON.stringify({ action: 'refresh' })}\n\n`);
        });
        console.log(`✅ Category "${name}" deleted and notification sent.`);

        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error(`Error deleting category ${req.params.name}:`, err.message);
        res.status(500).json({ message: 'Server error while deleting category' });
    }
});

// API to update an existing category or subcategory
app.put('/api/admin/categories/:name', async (req, res) => {
    try {
        // دیکد کردن نام از URL برای پشتیبانی از حروف فارسی
        const oldName = decodeURIComponent(req.params.name);
        const { name, type, parentCategory, image, description } = req.body;

        console.log(`--- Updating category "${oldName}" ---`);

        // بررسی وجود ستون‌ها قبل از استفاده از آن‌ها
        const { rows: tableInfo } = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'custom_categories'
        `);
        
        const hasImageColumn = tableInfo.some(col => col.column_name === 'image');
        const hasDescriptionColumn = tableInfo.some(col => col.column_name === 'description');
        
        // ساخت دینامیک کوئری بر اساس ستون‌های موجود
        let updateQuery = 'UPDATE custom_categories SET name = $1, type = $2, parent_category = $3';
        const queryParams = [name, type, parentCategory || null];
        let paramIndex = 4;
        
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
        
        updateQuery += ` WHERE name = $${paramIndex} RETURNING *`;
        queryParams.push(oldName);

        const { rows } = await db.query(updateQuery, queryParams);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Category not found for update' });
        }

        // ارسال اطلاع‌رسانی به کلاینت‌های متصل به SSE
        sseClients.forEach(client => {
            client.res.write(`data: ${JSON.stringify({ action: 'refresh' })}\n\n`);
        });
        console.log(`✅ Category "${oldName}" updated to "${name}" and notification sent.`);

        res.json(rows[0]);
    } catch (err) {
        console.error(`Error updating category ${req.params.name}:`, err.message);
        res.status(500).json({ message: 'Server error while updating category' });
    }
});
// ======================= SERVER-SENT EVENTS (SSE) FOR CATEGORY UPDATES =======================

// ذخیره کلاینت‌های متصل به SSE
let sseClients = [];

// مسیر برای اتصال کلاینت‌ها به SSE
app.get('/api/categories-updates', (req, res) => {
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
app.post('/api/notify-category-update', (req, res) => {
    const { action } = req.body;
    
    // ارسال اطلاع‌رسانی به تمام کلاینت‌های متصل
    sseClients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ action })}\n\n`);
    });
    
    console.log(`Notification sent to ${sseClients.length} clients: ${action}`);
    res.status(200).json({ message: 'Notification sent' });
});

// ======================= END OF SERVER-SENT EVENTS (SSE) =======================

// API to show database structure (for debugging)
app.get('/api/debug/database-structure', async (req, res) => {
    try {
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
                const { rows: sampleData } = await db.query(`
                    SELECT * FROM ${table.table_name} LIMIT 3
                `);
                structure[table.table_name].push({ 
                    _sampleData: sampleData,
                    _count: (await db.query(`SELECT COUNT(*) as count FROM ${table.table_name}`)).rows[0].count
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
app.get('/api/debug/table/:tableName', async (req, res) => {
    try {
        const tableName = req.params.tableName;
        
        // Security check - only allow specific tables
        const allowedTables = ['menu_items', 'custom_categories', 'ingredients', 'product_ingredients'];
        if (!allowedTables.includes(tableName)) {
            return res.status(400).json({ error: 'Table not allowed' });
        }
        
        const { rows } = await db.query(`SELECT * FROM ${tableName}`);
        
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