/**
 * Simoon Cafe Admin Panel - Product Management (Updated for Tabbed Modal & Modal Fix)
 */
(function(admin) {
    'use strict';

    admin.fetchProducts = async function() {
        console.log('\n\n===== 🛒 [ADMIN] Starting to fetch products from server =====');
        try {
            console.log(`📡 Sending GET request to: ${admin.API_URL}/menu`);
            const response = await fetch(`${admin.API_URL}/menu`);
            console.log('📨 Server response received:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Raw JSON data received:', data);
            console.log('📊 Total products received:', data.length);
            
            // --- تغییر کلیدی در اینجا ---
            // بک‌اند category_name و sub_category_name را ارسال می‌کند.
            // ما آن‌ها را به پراپرتی‌هایی که بقیه کد انتظار دارد (category و sub_category) تبدیل می‌کنیم.
            const transformedData = data.map(item => ({
                ...item, // تمام پراپرتی‌های اصلی (id, price, category_id و ...) را نگه دار
                category: item.category_name, // یک پراپرتی جدید به نام 'category' با مقدار نام دسته‌بندی بساز
                sub_category: item.sub_category_name // یک پراپرتی جدید به نام 'sub_category' با مقدار نام زیردسته بساز
            }));
            
            admin.state.products = transformedData;
            console.log('✅ Global products variable updated. Total count:', admin.state.products.length);

            console.log('===== 🛒 [ADMIN] Product fetching complete =====\n\n');
        } catch (err) {
            console.error('!!! ERROR in fetchProducts !!!', err.message);
            admin.showNotification('Error fetching product information!', 'error');
        }
    };

    admin.addIngredientRow = function(name = '', quantity = '', unit = 'grams') {
        const newRow = document.createElement('div');
        newRow.className = 'ingredient-row row mb-2';
        newRow.innerHTML = `
            <div class="col-md-5"><input type="text" class="form-control ingredient-name" placeholder="Ingredient name" value="${name}"></div>
            <div class="col-md-3"><input type="number" step="0.01" class="form-control ingredient-quantity" placeholder="Quantity" value="${quantity}"></div>
            <div class="col-md-3">
                <select class="form-select ingredient-unit">
                    <option value="grams" ${unit === 'grams' ? 'selected' : ''}>Grams</option>
                    <option value="kg" ${unit === 'kg' ? 'selected' : ''}>Kilograms</option>
                    <option value="pieces" ${unit === 'pieces' ? 'selected' : ''}>Pieces</option>
                    <option value="ml" ${unit === 'ml' ? 'selected' : ''}>Milliliters</option>
                    <option value="tablespoon" ${unit === 'tablespoon' ? 'selected' : ''}>Tablespoon</option>
                    <option value="cup" ${unit === 'cup' ? 'selected' : ''}>Cup</option>
                </select>
            </div>
            <div class="col-md-1"><button type="button" class="btn btn-danger btn-sm remove-ingredient-btn"><i class="bi bi-trash"></i></button></div>
        `;
        admin.dom.ingredientsContainer.appendChild(newRow);
        newRow.querySelector('.remove-ingredient-btn').addEventListener('click', () => admin.removeIngredientRow(newRow));
    };

    admin.removeIngredientRow = function(row) {
        if (admin.dom.ingredientsContainer.children.length > 1) {
            row.remove();
        } else {
            admin.showNotification('At least one ingredient row must exist.', 'error');
        }
    };

    // --- Modal Management Functions ---

    admin.openAddProductModal = function(category, subcategory) {
        console.log(`PRODUCT-MANAGEMENT: Opening addProductModal for category: ${category}, subcategory: ${subcategory}`);
        const existingModal = bootstrap.Modal.getInstance(admin.dom.productModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = null;
        admin.dom.productModalLabel.innerText = 'New Product';
        admin.dom.productForm.reset();
        
        // Reset all tabs to ensure only the first one is active
        const allTabs = document.querySelectorAll('#productTab button');
        const allTabPanes = document.querySelectorAll('#productTabContent .tab-pane');
        
        allTabs.forEach(tab => tab.classList.remove('active'));
        allTabPanes.forEach(pane => pane.classList.remove('active', 'show'));
        
        // Activate the first tab
        const firstTab = document.querySelector('#productTab button:first-child');
        const firstTabPane = document.querySelector('#basic');
        if (firstTab) firstTab.classList.add('active');
        if (firstTabPane) firstTabPane.classList.add('active', 'show');

        // Set the category and subcategory correctly
        admin.dom.category.value = category;
        admin.updateSubcategoryDropdown(category);
        
        // Set subcategory if provided
        if (subcategory) {
            // Wait a bit for the dropdown to be populated
            setTimeout(() => {
                admin.dom.sub_category.value = subcategory;
            }, 100);
        }
        
        admin.dom.ingredientsContainer.innerHTML = '';
        admin.addIngredientRow();
        
        admin.dom.deleteProductBtn.style.display = 'none';
        
        const modal = new bootstrap.Modal(admin.dom.productModal);
        modal.show();
    };

    admin.openEditProductModal = async function(id) {
        console.log(`PRODUCT-MANAGEMENT: Opening editProductModal for product ID: ${id}`);
        const existingModal = bootstrap.Modal.getInstance(admin.dom.productModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = id;
        admin.dom.productModalLabel.innerText = 'Edit Product';
        try {
            const response = await fetch(`${admin.API_URL}/menu/${id}`);
            const product = await response.json();

            admin.dom.productForm.reset();
            
            // Reset all tabs to ensure only the first one is active
            const allTabs = document.querySelectorAll('#productTab button');
            const allTabPanes = document.querySelectorAll('#productTabContent .tab-pane');
            
            allTabs.forEach(tab => tab.classList.remove('active'));
            allTabPanes.forEach(pane => pane.classList.remove('active', 'show'));
            
            // Activate the first tab
            const firstTab = document.querySelector('#productTab button:first-child');
            const firstTabPane = document.querySelector('#basic');
            if (firstTab) firstTab.classList.add('active');
            if (firstTabPane) firstTabPane.classList.add('active', 'show');

            admin.dom.name.value = product.name;
            admin.dom.price.value = product.price;
            admin.dom.image.value = product.image || '';
            admin.dom.category.value = product.category;
            
            if (!admin.state.subcategoriesByCategory[product.category]) {
                await admin.fetchCategoriesAndSubcategories();
            }
            
            // Update subcategory dropdown first
            admin.updateSubcategoryDropdown(product.category);
            
            // Then set the subcategory value after a short delay
            setTimeout(() => {
                admin.dom.sub_category.value = product.sub_category;
            }, 100);
            
            admin.dom.stock_quantity.value = product.stock_quantity;
            admin.dom.is_special.checked = product.is_special;

            admin.dom.ingredientsContainer.innerHTML = '';
            if (product.ingredients && product.ingredients.length > 0) {
                product.ingredients.forEach(ingredient => admin.addIngredientRow(ingredient.name, ingredient.quantity, ingredient.unit));
            } else {
                admin.addIngredientRow();
            }

            admin.dom.meta_title.value = product.meta_title || '';
            admin.dom.meta_description.value = product.meta_description || '';
            admin.dom.deleteProductBtn.style.display = 'block';

            const modal = new bootstrap.Modal(admin.dom.productModal);
            modal.show();
        } catch (error) {
            console.error('Error opening edit modal:', error.message);
            admin.showNotification('Error fetching product data for editing!', 'error');
        }
    };

    admin.updateSubcategoryDropdown = function(selectedCategory) {
        console.log(`--- Updating subcategory dropdown for category: ${selectedCategory} ---`);
        admin.dom.sub_category.innerHTML = '<option value="">Select...</option>';
        const subcategories = admin.state.subcategoriesByCategory[selectedCategory] || [];
        console.log(`Subcategories found for "${selectedCategory}":`, subcategories);

        subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub.charAt(0).toUpperCase() + sub.slice(1);
            admin.dom.sub_category.appendChild(option);
        });
        console.log('✅ Subcategory dropdown updated.');
    };

    // --- Save/Delete Functions with Modal Fix ---

    admin.saveProduct = async function() {
        const ingredientRows = document.querySelectorAll('.ingredient-row');
        const ingredients = [];
        ingredientRows.forEach(row => {
            const name = row.querySelector('.ingredient-name').value.trim();
            const quantity = parseFloat(row.querySelector('.ingredient-quantity').value);
            const unit = row.querySelector('.ingredient-unit').value;
            if (name && !isNaN(quantity) && quantity > 0) {
                ingredients.push({ name, quantity, unit });
            }
        });

        const productData = {
            name: admin.dom.name.value,
            price: parseFloat(admin.dom.price.value),
            category: admin.dom.category.value,
            sub_category: admin.dom.sub_category.value,
            stock_quantity: parseInt(admin.dom.stock_quantity.value),
            image: admin.dom.image.value,
            is_special: admin.dom.is_special.checked,
            ingredients: ingredients,
            meta_title: admin.dom.meta_title.value,
            meta_description: admin.dom.meta_description.value
        };
        console.log('📝 Product data to save:', productData);

        if (!productData.name || !productData.category || !productData.price) {
            console.warn('⚠️ Validation failed: required fields are empty.');
            admin.showNotification('Please fill in name, category, and price fields.', 'error');
            return;
        }

        try {
            let response;
            if (admin.state.currentEditingId) {
                console.log(`📡 Sending PUT request to edit product ${admin.state.currentEditingId}...`);
                response = await fetch(`${admin.API_URL}/admin/menu/${admin.state.currentEditingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
            } else {
                console.log('📡 Sending POST request to add product...');
                response = await fetch(`${admin.API_URL}/admin/menu`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
            }
            
            console.log('📨 Server response from saving product:', response.status, response.statusText);

            if (response.ok) {
                console.log('PRODUCT-MANAGEMENT: Product saved successfully. Preparing to close modal.');
                const modal = bootstrap.Modal.getInstance(admin.dom.productModal);
                if (modal) {
                    modal.hide();
                    admin.dom.productModal.addEventListener('hidden.bs.modal', function () {
                        console.log('PRODUCT-MANAGEMENT: Product modal is now fully hidden. Disposing instance and moving focus.');
                        modal.dispose();
                        document.querySelector('#addMainCategoryBtn')?.focus();
                    }, { once: true });
                }
                
                admin.showNotification(admin.state.currentEditingId ? 'Product successfully updated!' : 'Product successfully added!', 'success');
                
                await admin.fetchProducts();
                await admin.fetchCategoriesAndSubcategories();
                admin.renderMainTabs();
                if (admin.state.activeMainCategory) admin.renderContentArea();
            } else {
                const errorData = await response.json();
                console.error('!!! ERROR saving product !!!', response.status, errorData);
                admin.showNotification(`Error: ${errorData.message || 'Unknown error occurred'}`, 'error');
            }
        } catch (error) {
            console.error('!!! ERROR in saveProduct !!!', error.message);
            admin.showNotification('Error saving product!', 'error');
        }
        console.log('===== 💾 [ADMIN] Product saving process complete =====\n\n');
    };

    admin.confirmDeleteProduct = function(id) {
        admin.showConfirmDialog(
            'Are you sure you want to delete this product?',
            () => admin.deleteProduct(id),
            {
                title: 'Delete Product',
                okText: 'Delete',
                okClass: 'btn-danger'
            }
        );
    };

    admin.deleteProduct = async function(id) {
        console.log('\n\n===== 🗑️ [ADMIN] Starting product deletion process =====');
        console.log(`🎯 Product with ID to delete: ${id}`);
        
        try {
            console.log(`📡 Sending DELETE request to delete product ${id}...`);
            const response = await fetch(`${admin.API_URL}/admin/menu/${id}`, { method: 'DELETE' });
            console.log('📨 Server response from deleting product:', response.status, response.statusText);

            if (response.ok) {
                console.log('✅ Product successfully deleted from server.');
                admin.showNotification('Product successfully deleted!', 'success');
                
                // Close the modal after successful deletion
                const modal = bootstrap.Modal.getInstance(admin.dom.productModal);
                if (modal) {
                    modal.hide();
                    admin.dom.productModal.addEventListener('hidden.bs.modal', function () {
                        console.log('PRODUCT-MANAGEMENT: Product modal is now fully hidden after deletion. Disposing instance.');
                        modal.dispose();
                    }, { once: true });
                }
                
                console.log('🔄 Starting to update lists in admin panel...');
                await admin.fetchProducts();
                if (admin.state.activeMainCategory) {
                    admin.renderContentArea();
                }
                console.log('✅ Admin panel lists updated.');
            } else {
                const errorData = await response.json();
                console.error('!!! ERROR deleting product !!!', response.status, errorData);
                admin.showNotification('Error deleting product! See console for details.', 'error');
            }
        } catch (error) {
            console.error('!!! ERROR in deleteProduct !!!', error.message);
            admin.showNotification('Error deleting product!', 'error');
        }
        console.log('===== 🗑️ [ADMIN] Product deletion process complete =====\n\n');
    };

    // --- Event Listeners for Product Modal ---
    document.addEventListener('DOMContentLoaded', function() {
        // Add event listener for category dropdown to update subcategories
        admin.dom.category.addEventListener('change', function() {
            const selectedCategory = this.value;
            admin.updateSubcategoryDropdown(selectedCategory);
        });
    });

})(window.SimoonAdmin);