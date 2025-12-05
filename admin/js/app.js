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

            // 3. NEW: اسلایدهای کاروسل ویژه را بارگذاری کنید
            if (typeof admin.fetchSpecialSlides === 'function') {
                await admin.fetchSpecialSlides();
            } else {
                console.warn('Warning: admin.fetchSpecialSlides is not defined.');
            }

            // 4. رابط کاربری را رندر کنید
            if (typeof admin.renderMainTabs === 'function') {
                admin.renderMainTabs();
            } else {
                console.warn('Warning: admin.renderMainTabs is not defined.');
            }
            
            // 5. اولین دسته بندی را انتخاب کنید
            if (admin.state.allCategories && admin.state.allCategories.length > 0) {
                if (typeof admin.selectMainCategory === 'function') {
                    admin.selectMainCategory(admin.state.allCategories[0]);
                }
            }
            
        } catch (error) {
            console.error('An error occurred during initialization:', error);
            alert('An error occurred while loading admin panel. Please check the console for details.');
        }
    });

    /**
     * نمایش سکشن مورد نظر و مخفی کردن بقیه
     * @param {string} sectionName - نام سکشن (مثلاً 'categories', 'inventory')
     */
    admin.showSection = function(sectionName) {
        // مخفی کردن همه سکشن‌ها
        admin.dom.categoriesSection.style.display = 'none';
        admin.dom.inventorySection.style.display = 'none';
        
        // نمایش سکشن فعال
        if (sectionName === 'categories') {
            admin.dom.categoriesSection.style.display = 'block';
        } else if (sectionName === 'inventory') {
            admin.dom.inventorySection.style.display = 'block';
        }
        
        // به‌روزرسانی عنوان هدر بر اساس سکشن فعال
        if (sectionName === 'categories') {
            admin.updateSectionTitle('Manage Categories & Products');
        } else if (sectionName === 'inventory') {
            admin.updateSectionTitle('Inventory Management');
        }
    };

    /**
     * تغییر عنوان هدر بر اساس سکشن فعال
     * @param {string} title - عنوان جدید
     */
    admin.updateSectionTitle = function(title) {
        if (admin.dom.sectionTitle) {
            admin.dom.sectionTitle.textContent = title;
        }
    };

    // --- NEW: Notification System ---
    let alertIntervalId; // برای نگهداری ID تایمر

    // تابع بررسی هشدارها
    admin.checkForLowStockAlerts = async () => {
        try {
            const response = await fetch('/api/inventory/low-stock-alerts');
            if (!response.ok) return; // اگر خطایی داشت، فعلاً کاری نکن
            
            const alerts = await response.json();

            if (alerts && alerts.length > 0) {
                admin.displayLowStockAlert(alerts);
            }
        } catch (error) {
            console.error('Could not fetch stock alerts:', error);
        }
    };

    // تابع نمایش هشدار به کاربر
    admin.displayLowStockAlert = (alerts) => {
        // اگر قبلاً یک هشدار باز است، هشدار جدیدی نشان نده
        if (document.getElementById('stock-alert-notification')) {
            return;
        }

        // ساخت لیست مواد برای نمایش در هشدار
        const alertItems = alerts.map(alert => 
            `<li>${alert.name}: ${alert.stock_quantity} ${alert.unit}</li>`
        ).join('');

        // ساخت کانتینر هشدار
        const alertContainer = document.createElement('div');
        alertContainer.id = 'stock-alert-notification';
        alertContainer.className = 'alert alert-warning alert-dismissible fade show position-fixed';
        alertContainer.style.cssText = 'top: 80px; right: 20px; z-index: 1050; max-width: 350px;';
        alertContainer.innerHTML = `
            <h6 class="alert-heading"><i class="bi bi-exclamation-triangle-fill"></i> Low Stock Alert!</h6>
            <p>The following ingredients are running low:</p>
            <ul>
                ${alertItems}
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // اضافه کردن هشدار به body
        document.body.appendChild(alertContainer);

        // به طور خودکار بعد از ۱۰ ثانیه هشدار را مخفی کن
        setTimeout(() => {
            if (alertContainer.parentNode) {
                alertContainer.remove();
            }
        }, 10000);
    };

    // تابع شروع بررسی دوره‌ای
    admin.startStockAlertPolling = () => {
        // هر ۱۵ ثانیه یکبار هشدارها را چک کن
        alertIntervalId = setInterval(admin.checkForLowStockAlerts, 15000);
    };

    // تابع توقف بررسی دوره‌ای
    admin.stopStockAlertPolling = () => {
        if (alertIntervalId) {
            clearInterval(alertIntervalId);
        }
    };

})(window.SimoonAdmin);