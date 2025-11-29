// ================================= JAVASCRIPT FILE =================================
// File: js/api.js
// Description: API service functions for interacting with the server
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// Base URL for the API
const API_BASE_URL = 'http://localhost:5000/api';

// متغیری برای نگهداری آخرین داده‌های دریافت شده جهت مقایسه
let lastMenuDataHash = null;

/**
 * Fetches all menu items and custom categories from the server
 * @returns {Promise<Array<Object>>} Array of menu items
 */
export const fetchMenuItems = async () => {
    console.log('\n\n===== 📡 [API] شروع دریافت آیتم‌های منو و دسته‌بندی‌ها از سرور =====');
    try {
        // ۱. دریافت محصولات از سرور
        const menuResponse = await fetch(`${API_BASE_URL}/menu`);
        if (!menuResponse.ok) {
            throw new Error(`HTTP error! status: ${menuResponse.status}`);
        }
        let menuData = await menuResponse.json();
        console.log('📊 داده‌های خام محصولات دریافت شده از سرور:', menuData);
        console.log('📊 تعداد کل محصولات دریافت شده:', menuData.length);

        // ۲. دریافت دسته‌بندی‌های سفارشی از سرور
        let allCategories = new Set();
        let allSubcategories = new Set();

        try {
            const categoriesResponse = await fetch(`${API_BASE_URL}/admin/custom-categories`);
            if (categoriesResponse.ok) {
                const categoriesData = await categoriesResponse.json();
                console.log('✅ دسته‌بندی‌های سفارشی دریافت شد:', categoriesData);

                // استخراج دسته‌های اصلی و زیرمجموعه‌ها
                categoriesData.forEach(item => {
                    if (item.type === 'category') {
                        allCategories.add(item.name);
                    } else if (item.type === 'subcategory') {
                        allSubcategories.add(item.name);
                    }
                });
            } else {
                console.warn('خطا در دریافت دسته‌بندی‌های سفارشی، فقط از محصولات استفاده می‌شود.');
            }
        } catch (categoriesError) {
            console.error('خطا در دریافت دسته‌بندی‌های سفارشی:', categoriesError);
        }

        // ۳. استخراج دسته‌ها و زیرمجموعه‌ها از محصولات
        menuData.forEach(item => {
            if (item.category) allCategories.add(item.category);
            if (item.sub_category) allSubcategories.add(item.sub_category);
        });

        // ۴. افزودن دسته‌های سفارشی به لیست (اگر محصولی با آن دسته وجود ندارد)
        const finalCategories = Array.from(allCategories);
        finalCategories.forEach(cat => {
            if (!menuData.some(item => item.category === cat)) {
                // یک محصول ساختگی برای نمایش دسته اضافه می‌کنیم
                menuData.push({
                    id: `custom-cat-${cat}`,
                    name: `محصولی برای ${cat} یافت نشد`,
                    category: cat,
                    sub_category: null,
                    price: 0,
                    stock_quantity: 0,
                    is_special: false,
                    image: '',
                    description: ''
                });
            }
        });

        // ۵. تبدیل داده‌ها به فرمت مورد نیاز فرانت‌اند
        const transformedData = menuData.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            mainCategory: item.category, // Map 'category' to 'mainCategory'
            subCategory: item.sub_category, // Map 'sub_category' to 'subCategory'
            image: item.image,
            available: item.stock_quantity, // Map 'stock_quantity' to 'available'
            isSpecial: item.is_special // Map 'is_special' to 'isSpecial'
        }));

        // ذخیره داده‌های تمام دسته‌ها و زیرمجموعه‌ها برای استفاده در بخش UI
        window.allCategories = finalCategories.sort();
        window.allSubcategories = Array.from(allSubcategories).sort();

        console.log('🔄 داده‌های تبدیل شده برای فرانت:', transformedData);
        console.log('✅ [API] دریافت و تبدیل داده‌ها با موفقیت انجام شد.');
        console.log('===== 📡 [API] پایان دریافت آیتم‌های منو از سرور =====\n\n');
        window.allMenuItems = transformedData;
        
        // محاسبه یک "هش" ساده از داده‌ها برای مقایسه سریع
        lastMenuDataHash = JSON.stringify(transformedData.sort((a, b) => a.id - b.id));
        
        return transformedData;
    } catch (error) {
        console.error('❌ [API] خطا در دریافت آیتم‌های منو:', error);
        return [];
    }
};

/**
 * Checks if the menu data has changed on the server.
 * @returns {Promise<boolean>} True if data has changed, false otherwise.
 */
export const checkForMenuUpdates = async () => {
    console.log('\n\n===== 🔍 [API] شروع بررسی به‌روزرسانی‌های منو =====');
    try {
        const response = await fetch(`${API_BASE_URL}/menu`);
        if (!response.ok) {
            console.warn('⚠️ [API] نمی‌توان به‌روزرسانی‌ها را بررسی کرد، سرور ممکن است در دسترس نباشد.');
            return false;
        }
        const data = await response.json();
        
        const transformedData = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: parseFloat(item.price),
            mainCategory: item.category,
            subCategory: item.sub_category,
            image: item.image,
            available: item.stock_quantity,
            isSpecial: item.is_special
        }));
        
        const newDataHash = JSON.stringify(transformedData.sort((a, b) => a.id - b.id));
        console.log('🔢 [API] هش داده‌های جدید:', newDataHash.substring(0, 50) + '...');
        console.log('🔢 [API] هش داده‌های قبلی:', lastMenuDataHash ? lastMenuDataHash.substring(0, 50) + '...' : 'N/A');

        if (newDataHash !== lastMenuDataHash) {
            lastMenuDataHash = newDataHash;
            window.allMenuItems = transformedData;
            console.log('🔄 [API] داده‌های منو تغییر کرده است! به‌روزرسانی UI لازم است.');
            console.log('===== 🔍 [API] پایان بررسی به‌روزرسانی‌های منو (تغییر یافت) =====\n\n');
            return true; // تغییر کرده است
        } else {
            console.log('✅ [API] داده‌های منو تغییری نکرده است.');
            console.log('===== 🔍 [API] پایان بررسی به‌روزرسانی‌های منو (بدون تغییر) =====\n\n');
            return false; // تغییری نکرده است
        }
    } catch (error) {
        console.error('❌ [API] خطا در بررسی به‌روزرسانی‌های منو:', error);
        return false;
    }
};
// ============================== END OF JAVASCRIPT FILE ==============================