// ================================= JAVASCRIPT FILE =================================
// File: js/api.js
// Description: API service functions for interacting with server
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================
import { config } from './config.js';
import { 
    apiLogger, 
    validateMenuData, 
    checkImagesExist, 
    createPerformanceMonitor
} from './logger.js';
import { setBackgroundImage } from './utils.js';

let lastMenuDataHash = null;
const welcomeSection = document.querySelector('.welcome-section');
setBackgroundImage(welcomeSection, 'locwel.png');

// --- متغیرهای جدید برای کش کردن دسته‌بندی‌ها ---
// برای اینکه هر بار به سرور درخواست نزنیم، دسته‌بندی‌ها را در یک متغیر نگه می‌داریم.
let allCategories = [];
let categoriesLastFetched = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقیقه کش

/**
 * تمام دسته‌بندی‌ها و زیردسته‌بندی‌ها را از سرور دریافت می‌کند.
 * @returns {Promise<Array<Object>>} آرایه‌ای از دسته‌بندی‌ها
 */
export const fetchCategories = async () => {
    const monitor = createPerformanceMonitor('fetchCategories');
    const now = Date.now();

    // اگر داده‌ها کش شده و هنوز منقضی نشده باشند، همان را برمی‌گردانیم
    if (allCategories.length > 0 && (now - categoriesLastFetched < CACHE_DURATION)) {
        apiLogger.info('Returning categories from cache.');
        return allCategories;
    }

    try {
        apiLogger.section('Fetch Categories');
        const response = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        if (!response.ok) {
            throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
        const data = await response.json();
        allCategories = data;
        categoriesLastFetched = now;
        
        apiLogger.logApiCall('GET', `${config.API_BASE_URL}/api/admin/custom-categories`, null, data);
        const duration = monitor.end({ itemCount: data.length });
        apiLogger.endSection();
        
        return data;
    } catch (error) {
        apiLogger.logApiCall('GET', `${config.API_BASE_URL}/api/admin/custom-categories`, null, null, error);
        apiLogger.endSection();
        throw error;
    }
};

/**
 * یک تابع کمکی برای پیدا کردن ID یک دسته‌بندی بر اساس نام آن.
 * @param {string} name - نام دسته‌بندی
 * @param {string} type - 'category' یا 'subcategory'
 * @returns {number|null} ID دسته‌بندی یا null در صورت پیدا نشدن
 */
const findCategoryIdByName = (name, type) => {
    const category = allCategories.find(cat => cat.name === name && cat.type === type);
    return category ? category.id : null;
};

/**
 * Fetches all menu items and maps category/subcategory IDs to names.
 * @returns {Promise<Array<Object>>} Array of menu items with readable category names
 */
export const fetchMenuItems = async () => {
    const monitor = createPerformanceMonitor('fetchMenuItems');
    
    try {
        apiLogger.section('Fetch Menu Items');
        
        // ابتدا دسته‌بندی‌ها را برای نگاشت دریافت می‌کنیم
        const categories = await fetchCategories();
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = cat.name;
        });
        
        // دریافت محصولات از سرور
        const productsResponse = await fetch(`${config.API_BASE_URL}/api/menu`);
        
        if (!productsResponse.ok) {
            throw new Error(`Server responded with ${productsResponse.status}: ${productsResponse.statusText}`);
        }
        
        const productsData = await productsResponse.json();
        apiLogger.debug('Products data received from server', productsData);
        
        // تبدیل داده‌های محصولات به ساختار مورد انتظار فرانت
        // حالا ما مستقیماً از ID‌ها برای پیدا کردن نام‌ها استفاده می‌کنیم
        const transformedData = productsData.map(item => ({
            ...item,
            // نگاشت ID به نام برای نمایش در فرانت
            mainCategory: categoryMap[item.category_id] || 'نامشخص',      
            subCategory: categoryMap[item.sub_category_id] || null,     
            ingredients: item.ingredients || []
        }));
        
        const validation = validateMenuData(transformedData);
        apiLogger.logDataValidation('Menu Items', transformedData, validation.isValid, validation.issues);
        
        if (validation.isValid) {
            apiLogger.info('Checking if menu item images exist...');
            checkImagesExist(transformedData).then(results => {
                const missingImages = results.filter(result => !result.exists);
                if (missingImages.length > 0) {
                    apiLogger.warn(`Found ${missingImages.length} missing images`, missingImages);
                } else {
                    apiLogger.info('All menu item images loaded successfully');
                }
            });
        }
        
        apiLogger.logApiCall('GET', `${config.API_BASE_URL}/api/menu`, null, transformedData);
        const duration = monitor.end({ itemCount: transformedData.length });
        apiLogger.endSection();
        
        return transformedData;
    } catch (error) {
        apiLogger.logApiCall('GET', `${config.API_BASE_URL}/api/menu`, null, null, error);
        apiLogger.endSection();
        throw error;
    }
};

// --- توابع جدید برای ایجاد و ویرایش محصولات ---

/**
 * یک محصول جدید با استفاده از ID دسته‌بندی‌ها ایجاد می‌کند.
 * @param {Object} productData - اطلاعات محصول (شامل نام، قیمت، نام دسته‌بندی اصلی و فرعی)
 * @returns {Promise<Object>} محصول ایجاد شده
 */
export const createMenuItem = async (productData) => {
    const monitor = createPerformanceMonitor('createMenuItem');
    const client = await fetchCategories(); // اطمینان از اینکه دسته‌بندی‌ها بارگذاری شده‌اند

    try {
        apiLogger.section('Create Menu Item');

        // 1. پیدا کردن ID دسته‌بندی اصلی و فرعی بر اساس نام
        const categoryId = findCategoryIdByName(productData.mainCategory, 'category');
        if (!categoryId) {
            throw new Error(`دسته‌بندی اصلی "${productData.mainCategory}" پیدا نشد.`);
        }

        let subCategoryId = null;
        if (productData.subCategory) {
            subCategoryId = findCategoryIdByName(productData.subCategory, 'subcategory');
            if (!subCategoryId) {
                throw new Error(`زیردسته‌بندی "${productData.subCategory}" پیدا نشد.`);
            }
        }

        // 2. ساخت payload نهایی با ID‌ها برای ارسال به سرور
        const payload = {
            name: productData.name,
            price: productData.price,
            image: productData.image,
            category_id: categoryId,        // <-- ارسال ID به جای نام
            sub_category_id: subCategoryId,  // <-- ارسال ID به جای نام
            is_special: productData.isSpecial || false,
            ingredients: productData.ingredients || []
        };
        
        apiLogger.debug('Payload for POST /api/admin/menu', payload);

        const response = await fetch(`${config.API_BASE_URL}/api/admin/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.statusText}`);
        }

        const newItem = await response.json();
        
        apiLogger.logApiCall('POST', `${config.API_BASE_URL}/api/admin/menu`, payload, newItem);
        const duration = monitor.end({ createdItemId: newItem.id });
        apiLogger.endSection();
        
        return newItem;
    } catch (error) {
        apiLogger.logApiCall('POST', `${config.API_BASE_URL}/api/admin/menu`, productData, null, error);
        apiLogger.endSection();
        throw error;
    }
};

/**
 * یک محصول موجود را با استفاده از ID دسته‌بندی‌ها ویرایش می‌کند.
 * @param {number} productId - ID محصولی که باید ویرایش شود
 * @param {Object} productData - اطلاعات جدید محصول
 * @returns {Promise<Object>} محصول ویرایش شده
 */
export const updateMenuItem = async (productId, productData) => {
    const monitor = createPerformanceMonitor('updateMenuItem');
    await fetchCategories(); // اطمینان از اینکه دسته‌بندی‌ها بارگذاری شده‌اند

    try {
        apiLogger.section('Update Menu Item');
        
        // 1. پیدا کردن ID دسته‌بندی اصلی و فرعی بر اساس نام
        const categoryId = findCategoryIdByName(productData.mainCategory, 'category');
        if (!categoryId) {
            throw new Error(`دسته‌بندی اصلی "${productData.mainCategory}" پیدا نشد.`);
        }

        let subCategoryId = null;
        if (productData.subCategory) {
            subCategoryId = findCategoryIdByName(productData.subCategory, 'subcategory');
            if (!subCategoryId) {
                throw new Error(`زیردسته‌بندی "${productData.subCategory}" پیدا نشد.`);
            }
        }

        // 2. ساخت payload نهایی با ID‌ها
        const payload = {
            name: productData.name,
            price: productData.price,
            image: productData.image,
            category_id: categoryId,        // <-- ارسال ID به جای نام
            sub_category_id: subCategoryId,  // <-- ارسال ID به جای نام
            is_special: productData.isSpecial || false,
            ingredients: productData.ingredients || []
        };

        apiLogger.debug(`Payload for PUT /api/admin/menu/${productId}`, payload);

        const response = await fetch(`${config.API_BASE_URL}/api/admin/menu/${productId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.statusText}`);
        }

        const updatedItem = await response.json();
        
        apiLogger.logApiCall('PUT', `${config.API_BASE_URL}/api/admin/menu/${productId}`, payload, updatedItem);
        const duration = monitor.end({ updatedItemId: updatedItem.id });
        apiLogger.endSection();
        
        return updatedItem;
    } catch (error) {
        apiLogger.logApiCall('PUT', `${config.API_BASE_URL}/api/admin/menu/${productId}`, productData, null, error);
        apiLogger.endSection();
        throw error;
    }
};

// تابع checkForMenuUpdates نیز باید منطق مشابهی داشته باشد
export const checkForMenuUpdates = async () => {
    const monitor = createPerformanceMonitor('checkForMenuUpdates');
    
    apiLogger.section('Check for Menu Updates');
    
    try {
        const response = await fetch(`${config.API_BASE_URL}/api/menu`);
        if (!response.ok) {
            apiLogger.warn('Could not check for updates, server might be unavailable');
            apiLogger.endSection();
            return false;
        }
        
        const data = await response.json();
        
        // برای مقایسه، داده‌ها را به فرمت یکسان تبدیل می‌کنیم
        const categories = await fetchCategories();
        const categoryMap = {};
        categories.forEach(cat => categoryMap[cat.id] = cat.name);

        const transformedData = data.map(item => ({
            id: item.id,
            name: item.name,
            price: parseFloat(item.price),
            mainCategory: categoryMap[item.category_id] || 'نامشخص',
            subCategory: categoryMap[item.sub_category_id] || null,
            image: item.image,
            available: item.stock_quantity,
            isSpecial: item.is_special,
            ingredients: item.ingredients || []
        }));
        
        const newDataHash = JSON.stringify(transformedData.sort((a, b) => a.id - b.id));
        
        if (newDataHash !== lastMenuDataHash) {
            apiLogger.info('Menu data has changed, update required');
            lastMenuDataHash = newDataHash;
            window.allMenuItems = transformedData;
            
            const duration = monitor.end({ hasChanges: true });
            apiLogger.endSection();
            return true;
        } else {
            apiLogger.info('Menu data has not changed');
            
            const duration = monitor.end({ hasChanges: false });
            apiLogger.endSection();
            return false;
        }
    } catch (error) {
        apiLogger.error('Error checking for menu updates', error);
        apiLogger.endSection();
        return false;
    }
};
// ============================== END OF JAVASCRIPT FILE ==============================