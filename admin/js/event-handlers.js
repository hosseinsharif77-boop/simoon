/**
 * Simoon Cafe Admin Panel - Event Handlers (نسخه اصلاح شده و نهایی)
 */
(function(admin) {
    'use strict';

    /**
     * تمام رویدادهای مورد نیاز برای پنل ادمین را تنظیم می‌کند.
     */
    admin.setupEventListeners = function() {
        console.log('EVENT-HANDLERS: Setting up event listeners...');
        
        // --- رویدادهای ناوبری (Navigation) ---
        if (admin.dom.previewBtn) {
            admin.dom.previewBtn.addEventListener('click', admin.toggleView);
        }
        
        if (admin.dom.logoutBtn) {
            admin.dom.logoutBtn.addEventListener('click', admin.logout);
        }
        
        // --- رویدادهای مربوط به دکمه‌های ذخیره و حذف در مودال‌ها ---
        if (admin.dom.saveProductBtn) {
            admin.dom.saveProductBtn.addEventListener('click', admin.saveProduct);
        }
        
        if (admin.dom.saveCategoryBtn) {
            admin.dom.saveCategoryBtn.addEventListener('click', admin.saveCategory);
        }
        
        if (admin.dom.deleteProductBtn) {
            admin.dom.deleteProductBtn.addEventListener('click', () => {
                if (admin.state.currentEditingId) {
                    admin.confirmDeleteProduct(admin.state.currentEditingId);
                }
            });
        }
        
        if (admin.dom.deleteCategoryBtn) {
            admin.dom.deleteCategoryBtn.addEventListener('click', () => {
                if (admin.state.currentEditingId) {
                    if (admin.state.currentEditingType === 'category') {
                        admin.confirmDeleteCategory(admin.state.currentEditingId);
                    } else {
                        admin.confirmDeleteSubcategory(admin.dom.parentCategory.value, admin.state.currentEditingId);
                    }
                }
            });
        }
        
        // --- رویدادهای مربوط به فرم محصول ---
        if (admin.dom.addIngredientBtn) {
            admin.dom.addIngredientBtn.addEventListener('click', () => {
                admin.addIngredientRow();
            });
        }
        
        // --- NEW EVENT LISTENERS FOR IMAGE UPLOAD ---
        if (admin.dom.uploadImageBtn && admin.dom.categoryImageUpload) {
            admin.dom.uploadImageBtn.addEventListener('click', () => {
                admin.dom.categoryImageUpload.click();
            });
        }

        if (admin.dom.categoryImageUpload) {
            admin.dom.categoryImageUpload.addEventListener('change', admin.handleImageUpload);
        }

        // --- رویدادهای غیرفعال (Passive) برای بهبود عملکرد در دستگاه‌های لمسی ---
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
        
        // --- رویدادهای ابزار دیباگ ---
        const logLayoutBtn = document.getElementById('log-layout-btn');
        if (logLayoutBtn) {
            logLayoutBtn.addEventListener('click', admin.logLayoutStructure);
        }
        
        // --- مدیریت رویدادهای مودال (بسیار مهم برای رفع خطای دسترسی) ---
        // این رویدادها باید پس از بارگذاری کامل DOM تنظیم شوند.
        // از آنجایی که این تابع (setupEventListeners) معمولاً از app.js پس از لود DOM فراخوانی می‌شود،
        // نیازی به تودرتو کردن در addEventListener('DOMContentLoaded') نیست.

        const categoryModalEl = document.getElementById('categoryModal');
        const productModalEl = document.getElementById('productModal');

        // مدیریت رویداد 'hide.bs.modal' برای مودال دسته‌بندی
        // این رویداد دقیقاً قبل از اینکه مودال مخفی شود اجرا می‌شود
        if (categoryModalEl) {
            categoryModalEl.addEventListener('hide.bs.modal', function () {
                console.log('EVENT-HANDLERS: Category modal is about to hide. Removing focus from its children.');
                const activeElement = document.activeElement;
                // اگر المان فعال داخل مودال دسته‌بندی است، فوکوس آن را بردار تا خطای دسترسی رخ ندهد
                if (activeElement && categoryModalEl.contains(activeElement)) {
                    activeElement.blur();
                }
            });
        }

        // مدیریت رویداد 'hide.bs.modal' برای مودال محصول
        if (productModalEl) {
            productModalEl.addEventListener('hide.bs.modal', function () {
                console.log('EVENT-HANDLERS: Product modal is about to hide. Removing focus from its children.');
                const activeElement = document.activeElement;
                // اگر المان فعال داخل مودال محصول است، فوکوس آن را بردار
                if (activeElement && productModalEl.contains(activeElement)) {
                    activeElement.blur();
                }
            });
        }

        // --- Event Listeners for Product Modal ---
        // Add event listener for category dropdown to update subcategories
        if (admin.dom.category) {
            admin.dom.category.addEventListener('change', function() {
                const selectedCategory = this.value;
                admin.updateSubcategoryDropdown(selectedCategory);
            });
        }
        
        // Add event listener for image upload button
        const productUploadImageBtn = document.getElementById('productUploadImageBtn');
        const productImageUpload = document.getElementById('imageUpload');
        const productImageInput = document.getElementById('image');

        if (productUploadImageBtn && productImageUpload) {
            productUploadImageBtn.addEventListener('click', function() {
                productImageUpload.click();
            });
            
            productImageUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // Here you would typically upload the file to a server
                    // For now, we'll just show the file name
                    const fileName = file.name;
                    productImageInput.value = `File: ${fileName}`;
                    
                    // If you want to preview the image, you can create a temporary URL
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        // You could display a preview here if needed
                        console.log('Product image selected:', e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Add event listener for image upload button
        if (admin.dom.productUploadImageBtn && admin.dom.imageUpload) {
            admin.dom.productUploadImageBtn.addEventListener('click', function() {
                admin.dom.imageUpload.click();
            });
            
            admin.dom.imageUpload.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    // Here you would typically upload the file to a server
                    // For now, we'll just show the file name
                    const fileName = file.name;
                    admin.dom.image.value = `File: ${fileName}`;
                    
                    // If you want to preview the image, you can create a temporary URL
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        // You could display a preview here if needed
                        console.log('Product image selected:', e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // در داخل تابع admin.setupEventListeners یا رویداد DOMContentLoaded

        // مدیریت کلیک روی لینک‌های ناوبری دسکتاپ و موبایل
        const handleNavigationClick = function(event) {
            // حذف کلاس active از همه لینک‌ها
            admin.dom.navLinks.forEach(link => link.classList.remove('active'));
            admin.dom.mobileNavItems.forEach(item => item.classList.remove('active'));

            // اضافه کردن کلاس active به لینک کلیک شده
            const clickedElement = event.currentTarget;
            clickedElement.classList.add('active');

            // پیدا کردن لینک متناظر در موبایل یا دسکتاپ و فعال کردن آن
            const section = clickedElement.dataset.section;
            document.querySelector(`.mobile-bottom-nav-item[data-section="${section}"]`)?.classList.add('active');
            document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');

            // نمایش سکشن مربوطه و به‌روزرسانی عنوان
            if (section === 'categories') {
                admin.showSection('categories');
                admin.updateSectionTitle('Manage Categories & Products');
            } else if (section === 'inventory') {
                admin.showSection('inventory');
                admin.updateSectionTitle('Inventory Management');
                // مقداردهی اولیه بخش انبار (اختیاری)
                if (typeof admin.inventory.init === 'function') {
                    admin.inventory.init();
                }
            }
            // می‌توانید برای سکشن‌های دیگر هم شرط اضافه کنید
        };

        // اتصال رویداد به لینک‌های دسکتاپ
        admin.dom.navLinks.forEach(link => {
            link.addEventListener('click', handleNavigationClick);
        });

        // اتصال رویداد به آیتم‌های موبایل
        admin.dom.mobileNavItems.forEach(item => {
            item.addEventListener('click', handleNavigationClick);
        });
        console.log('EVENT-HANDLERS: Event listeners setup complete.');
    };

})(window.SimoonAdmin);