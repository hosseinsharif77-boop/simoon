/**
 * Simoon Cafe Admin Panel - Main Application
 */
(function(admin) {
    'use strict';

    document.addEventListener('DOMContentLoaded', async () => {
        console.log('🚀 Admin panel script loaded.');
        
        // بررسی وجود توابع قبل از فراخوانی
        if (typeof admin.setupEventListeners !== 'function') {
            console.error('Fatal Error: admin.setupEventListeners is not a function. Check event-handlers.js');
            return; // جلوگیری از اجرای ادامه کد
        }
        
        try {
            // 1. اول از همه، رویدادها را تنظیم کنید
            admin.setupEventListeners();
            
            // 2. سپس داده‌ها را بارگذاری کنید
            if (typeof admin.fetchProducts === 'function') {
                await admin.fetchProducts();
            } else {
                console.warn('Warning: admin.fetchProducts is not defined.');
            }

            if (typeof admin.fetchCategoriesAndSubcategories === 'function') {
                await admin.fetchCategoriesAndSubcategories();
            } else {
                console.warn('Warning: admin.fetchCategoriesAndSubcategories is not defined.');
            }

            // 3. رابط کاربری را رندر کنید
            if (typeof admin.renderMainTabs === 'function') {
                admin.renderMainTabs();
            } else {
                console.warn('Warning: admin.renderMainTabs is not defined.');
            }
            
            // 4. اولین دسته بندی را انتخاب کنید
            if (admin.state.allCategories && admin.state.allCategories.length > 0) {
                if (typeof admin.selectMainCategory === 'function') {
                    admin.selectMainCategory(admin.state.allCategories[0]);
                }
            }
            
        } catch (error) {
            console.error('An error occurred during initialization:', error);
            alert('An error occurred while loading the admin panel. Please check the console for details.');
        }
    });

})(window.SimoonAdmin);