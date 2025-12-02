// admin/js/config.js

// مرحله ۱: اطمینان از وجود آبجکت اصلی
window.SimoonAdmin = window.SimoonAdmin || {};

// مرحله ۲: ارجاع به آبجکت اصلی
const admin = window.SimoonAdmin;

// مرحله ۳: تعریف تنظیمات و وضعیت

// --- تشخیص خودکار محیط و تنظیم آدرس API ---
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    // محیط توسعه (Development)
    admin.API_URL = 'http://localhost:5000/api';
} else {
    // محیط تولید (Production) - آدرس سرور خود را اینجا قرار دهید
    admin.API_URL = 'https://simoon.onrender.com/api'; // <--- این آدرس را با آدرس بک‌اند خود در Render جایگزین کنید
}

admin.state = {
    products: [],
    allCategories: [],
    subcategoriesByCategory: {},
    activeMainCategory: null,
    activeSubCategory: null,
    currentEditingId: null,
    currentEditingType: null
};

admin.dom = {};

console.log('✅ Admin Config.js loaded. API URL:', admin.API_URL);