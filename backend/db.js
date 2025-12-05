// db.js

/**
 * فایل اتصال به دیتابیس و مستندات ساختار (Schema)
 * 
 * این فایل مدیریت اتصال به پایگاه داده PostgreSQL را با استفاده از یک Connection Pool بر عهده دارد.
 * در ادامه، مروری مختصر بر ساختار دیتابیس (جداول) برای این پلتفرم مدیریت رستوران چندمستأجره ارائه شده است.
 * 
 * --- جداول اصلی ---
 * 
 * 1. `restaurants`
 *    - هدف: ذخیره اطلاعات هر رستوران (مستأجر).
 *    - ستون‌های کلیدی: id (PK), name, subdomain, is_active.
 * 
 * 2. `users`
 *    - هدف: ذخیره حساب‌های کاربری (صاحبان، کارمندان) مرتبط با یک رستوران.
 *    - ستون‌های کلیدی: id (PK), restaurant_id (FK -> restaurants), email, password_hash, role.
 * 
 * --- جداول منو و محصولات ---
 * 
 * 3. `categories`
 *    - هدف: تعریف دسته‌بندی‌های داینامیک منو (مانند "پیتزا"، "نوشیدنی").
 *    - ستون‌های کلیدی: id (PK), restaurant_id (FK), name, type ('category'/'subcategory'), parent_category_id (ارجاع به خود).
 * 
 * 4. `menu_items`
 *    - هدف: ذخیره محصولات نهایی که به مشتریان فروخته می‌شود (مانند "پیتزا پپرونی").
 *    - ستون‌های کلیدی: id (PK), restaurant_id (FK), name, price, image, category_id (FK -> categories), sub_category_id (FK -> categories).
 * 
 * 5. `ingredients`
 *    - هدف: مدیریت مواد اولیه خام در انبار آشپزخانه (مانند "پنیر"، "آرد").
 *    - ستون‌های کلیدی: id (PK), restaurant_id (FK), name, unit, stock_quantity, min_stock_alert.
 * 
 * 6. `product_ingredients`
 *    - هدف: جدول واسط برای تعریف "دستور پخت" هر محصول.
 *    - ستون‌های کلیدی: id (PK), restaurant_id (FK), product_id (FK -> menu_items), ingredient_id (FK -> ingredients), quantity.
 * 
 * --- جداول سفارشات و تراکنش‌ها ---
 * 
 * 7. `orders`
 *    - هدف: ذخیره اطلاعات کلی سفارشات مشتریان.
 *    - ستون‌های کلیدی: id (PK), restaurant_id (FK), status ('pending', 'completed'), total_amount.
 * 
 * 8. `order_items`
 *    - هدف: لیست محصولات موجود در هر سفارش.
 *    - ستون‌های کلیدی: id (PK), order_id (FK -> orders), product_id (FK -> menu_items), quantity, price_at_time.
 * 
 * --- جداول انبار و لاگ‌ها ---
 * 
 * 9. `inventory_logs`
 *    - هدف: یک دفترچه ثبت کامل برای تمام تغییرات موجودی (فروش، ورود دستی، ضایعات).
 *    - ستون‌های کلیدی: id (PK), restaurant_id (FK), ingredient_id (FK -> ingredients), change_type, quantity_change, reason.
 * 
 * --- نکات مهم ---
 * - تمام جداول (به جز `restaurants`) شامل ستون `restaurant_id` برای اطمینان از جداسازی کامل داده‌ها بین مستأجرها هستند.
 * - (FK) نشان‌دهنده کلید خارجی (Foreign Key) است.
 * - (PK) نشان‌دهنده کلید اصلی (Primary Key) است.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect() 
};