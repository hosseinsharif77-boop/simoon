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
            console.log('Add Ingredient button clicked in Inventory section');
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
        
        // --- مدیریت کلیک روی لینک‌های ناوبری دسکتاپ و موبایل ---
        const handleNavigationClick = function(event) {
            // Remove active class from all links
            document.querySelectorAll('.nav-link, .mobile-bottom-nav-item').forEach(link => link.classList.remove('active'));
            
            // Add active class to clicked element
            const clickedElement = event.currentTarget;
            clickedElement.classList.add('active');

            const section = clickedElement.dataset.section;
            admin.showSection(section);
        };

        // Attach to desktop and mobile nav links
        document.querySelectorAll('.nav-link[data-section]').forEach(link => {
            link.addEventListener('click', handleNavigationClick);
        });

        document.querySelectorAll('.mobile-bottom-nav-item[data-section]').forEach(item => {
            item.addEventListener('click', handleNavigationClick);
        });

        // --- NEW: Orders Section Event Listeners ---
        if (admin.dom.ordersTabsRibbon) {
            admin.dom.ordersTabsRibbon.addEventListener('click', (e) => {
                const tabItem = e.target.closest('.main-tab-item');
                if (!tabItem) return;

                document.querySelectorAll('#ordersTabsRibbon .main-tab-item').forEach(item => item.classList.remove('active'));
                tabItem.classList.add('active');

                // This function should be defined in orders-management.js
                if (typeof admin.orders.renderOrders === 'function') {
                    admin.orders.renderOrders(tabItem.dataset.ordersTab);
                }
            });
        }

        if (admin.dom.orderSearchInput) {
            admin.dom.orderSearchInput.addEventListener('input', (e) => {
                if (typeof admin.orders.filterOrders === 'function') {
                    admin.orders.filterOrders(e.target.value);
                }
            });
        }

        if (admin.dom.clearOrderSearchBtn) {
            admin.dom.clearOrderSearchBtn.addEventListener('click', () => {
                admin.dom.orderSearchInput.value = '';
                if (typeof admin.orders.filterOrders === 'function') {
                    admin.orders.filterOrders('');
                }
            });
        }

        if (admin.dom.updateOrderStatusBtn) {
            admin.dom.updateOrderStatusBtn.addEventListener('click', () => {
                if (typeof admin.orders.updateOrderStatus === 'function') {
                    admin.orders.updateOrderStatus();
                }
            });
        }
        // --- End Orders ---

        // --- NEW: Settings Section Event Listeners ---
        if (admin.dom.settingsNavLinks) {
            admin.dom.settingsNavLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const tabName = link.dataset.settingsTab;
                    
                    // This function should be defined in settings-management.js
                    if (typeof admin.settings.showSettingsTab === 'function') {
                        admin.settings.showSettingsTab(tabName);
                    }
                });
            });
        }

        if (admin.dom.addUserBtn) {
            admin.dom.addUserBtn.addEventListener('click', () => {
                if (typeof admin.settings.openUserModal === 'function') {
                    admin.settings.openUserModal(); // For adding a new user
                }
            });
        }
        // --- End Settings ---

        console.log('EVENT-HANDLERS: Event listeners setup complete.');
    };

})(window.SimoonAdmin);