/**
 * Simoon Cafe Admin Panel - Event Handlers (Final Version)
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
        if (admin.dom.addProductIngredientBtn) {
            admin.dom.addProductIngredientBtn.addEventListener('click', () => {
                console.log('Add Ingredient button clicked in product modal');
                admin.addIngredientRow();
            });
        }
        
        // --- رویدادهای مربوط به بخش Inventory ---
        if (admin.dom.addInventoryIngredientBtn) {
            admin.dom.addInventoryIngredientBtn.addEventListener('click', admin.inventory.handleAddIngredientClick);
            console.log('Add Ingredient button clicked in Inventory modal');
        }
        
        // --- EVENT LISTENERS FOR IMAGE UPLOAD ---
        if (admin.dom.uploadImageBtn && admin.dom.categoryImageUpload) {
            admin.dom.uploadImageBtn.addEventListener('click', () => {
                admin.dom.categoryImageUpload.click();
            });
        }

        if (admin.dom.categoryImageUpload) {
            admin.dom.categoryImageUpload.addEventListener('change', admin.handleImageUpload);
        }

        // --- Event Listeners for Product Modal ---
        if (admin.dom.category) {
            admin.dom.category.addEventListener('change', function() {
                const selectedCategory = this.value;
                admin.updateSubcategoryDropdown(selectedCategory);
            });
        }
        
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
                    const fileName = file.name;
                    productImageInput.value = `File: ${fileName}`;
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        console.log('Product image selected:', e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // --- NEW: Event Listener for Bulk Edit Save Button ---
        const saveBulkEditBtn = document.getElementById('saveBulkEditBtn');
        if (saveBulkEditBtn) {
            saveBulkEditBtn.addEventListener('click', admin.saveBulkEdit);
        }
        
        // --- Event Listeners for Inventory Modals ---
        if (admin.dom.confirmAddIngredientBtn) {
            admin.dom.confirmAddIngredientBtn.addEventListener('click', admin.inventory.handleAddIngredientFormSubmit);
        }
        
        // مدیریت کلیک روی لینک‌های ناوبری دسکتاپ و موبایل
        const handleNavigationClick = function(event) {
            admin.dom.navLinks.forEach(link => link.classList.remove('active'));
            admin.dom.mobileNavItems.forEach(item => item.classList.remove('active'));

            const clickedElement = event.currentTarget;
            clickedElement.classList.add('active');

            const section = clickedElement.dataset.section;
            document.querySelector(`.mobile-bottom-nav-item[data-section="${section}"]`)?.classList.add('active');
            document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');

            if (section === 'categories') {
                admin.showSection('categories');
                admin.updateSectionTitle('Manage Categories & Products');
            } else if (section === 'inventory') {
                admin.showSection('inventory');
                admin.updateSectionTitle('Inventory Management');
                if (typeof admin.inventory.init === 'function') {
                    admin.inventory.init();
                }
            }
        };

        admin.dom.navLinks.forEach(link => {
            link.addEventListener('click', handleNavigationClick);
        });

        admin.dom.mobileNavItems.forEach(item => {
            item.addEventListener('click', handleNavigationClick);
        });

        console.log('EVENT-HANDLERS: Event listeners setup complete.');
    };

})(window.SimoonAdmin);