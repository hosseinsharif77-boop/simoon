// ================================= JAVASCRIPT FILE =================================
// File: backend/upload.js
// Description: Handles uploading image files to Supabase Storage.
// Author: [Your Name]
// ============================== END OF FILE HEADER ==============================

// این خط را در بالاترین قسمت فایل اضافه کنید
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// اطلاعات اتصال از فایل .env خوانده می‌شوند
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// برای اطمینان می‌توانید اینجا لاگ بگیرید
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey ? 'Loaded' : 'Not Loaded');

const supabase = createClient(supabaseUrl, supabaseKey);

// این نام باید دقیقاً با نام Bucket که در Supabase ساخته‌اید، یکسان باشد
const BUCKET_NAME = 'images';

/**
 * یک فایل را به Supabase Storage آپلود می‌کند.
 * @param {Buffer} buffer - بافر فایل دریافتی از multer.
 * @param {string} originalName - نام اصلی فایل.
 * @returns {Promise<{publicUrl: string, error: any}>}
 */
const uploadImage = async (buffer, originalName) => {
  // یک نام منحصر به فرد برای فایل می‌سازیم تا جایگزینی اتفاق نیفتد
  const fileExtension = path.extname(originalName);
  const fileName = `${Date.now()}-${fileExtension}`;

  console.log(`Uploading file: ${fileName}`);

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, buffer, {
      cacheControl: '3600', // کش شدن فایل برای یک ساعت
      upsert: false, // اجازه نده اگر فایلی با همین نام وجود داشت جایگزین شود
    });

  if (error) {
    console.error('Error uploading to Supabase Storage:', error);
    return { error };
  }

  console.log(`File uploaded successfully: ${fileName}`);

  // دریافت لینک عمومی فایل آپلود شده
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  console.log(`Public URL generated: ${publicUrl}`);

  return { publicUrl, error: null };
};

module.exports = { uploadImage };