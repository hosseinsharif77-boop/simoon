/**
 * Simoon Cafe Admin Panel - Category Management (Updated for Dynamic Tabs & Inline Edit)
 */
(function(admin) {
    'use strict';

    admin.fetchCategoriesAndSubcategories = async function() {
        console.log('\n\n===== 📁 [ADMIN] Starting category extraction =====');
        try {
            if (!admin.state.products || admin.state.products.length === 0) {
                console.warn('⚠️ Products variable is empty. Cannot extract categories.');
                return;
            }
            
            const productCategories = [...new Set(admin.state.products.map(p => p.category))].sort();
            const tempSubcategories = {};

            admin.state.products.forEach(p => {
                if (p.category && p.sub_category) {
                    if (!tempSubcategories[p.category]) {
                        tempSubcategories[p.category] = new Set();
                    }
                    tempSubcategories[p.category].add(p.sub_category);
                }
            });

            try {
                console.log('📡 Requesting custom categories from server...');
                const customResponse = await fetch(`${admin.API_URL}/admin/custom-categories`);
                
                if (!customResponse.ok) {
                    const errorText = await customResponse.text();
                    throw new Error(`Server Error: ${customResponse.status} ${customResponse.statusText}. Response: ${errorText}`);
                }
                
                const customData = await customResponse.json();
                console.log('✅ Custom categories received:', customData);

                const customMainCategories = customData.filter(item => item.type === 'category').map(item => item.name);
                admin.state.allCategories = [...new Set([...productCategories, ...customMainCategories])].sort();

                customData.filter(item => item.type === 'subcategory').forEach(item => {
                    if (!tempSubcategories[item.parent_category]) {
                        tempSubcategories[item.parent_category] = new Set();
                    }
                    tempSubcategories[item.parent_category].add(item.name);
                });

            } catch (error) {
                console.error('!!! ERROR fetching custom categories !!!', error.message);
                console.error('Stack Trace:', error.stack);
                admin.state.allCategories = productCategories;
            }
            
            admin.state.subcategoriesByCategory = {};
            for (const cat in tempSubcategories) {
                admin.state.subcategoriesByCategory[cat] = Array.from(tempSubcategories[cat]).sort();
            }

            console.log('✅ All main categories:', admin.state.allCategories);
            console.log('📊 Subcategory structure:', admin.state.subcategoriesByCategory);

            admin.populateCategoryDropdowns();
            console.log('===== 📁 [ADMIN] Category extraction complete =====\n\n');
        } catch (error) {
            console.error('!!! ERROR in fetchCategoriesAndSubcategories !!!', error.message);
            console.error('Stack Trace:', error.stack);
            alert('Error fetching categories! See console for details.');
        }
    };

    admin.renderMainTabs = function() {
        console.log('--- Rendering main tabs ---');
        admin.dom.mainTabs.innerHTML = '';
        
        const addCategoryItem = document.createElement('div');
        addCategoryItem.className = 'main-tab-item';
        addCategoryItem.innerHTML = `<button class="add-main-tab-btn" id="addMainCategoryBtn"><i class="bi bi-plus-lg"></i></button>`;
        admin.dom.mainTabs.appendChild(addCategoryItem);
        
        admin.state.allCategories.forEach((category, index) => {
            const tabItem = document.createElement('div');
            tabItem.className = 'main-tab-item';
            
            const tabButton = document.createElement('button');
            tabButton.className = `main-tab-btn ${index === 0 ? 'active' : ''}`;
            tabButton.setAttribute('data-category', category);
            
            const tabText = document.createElement('span');
            tabText.className = 'tab-text';
            tabText.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            tabButton.appendChild(tabText);
            
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'tab-actions';

            const editButton = document.createElement('button');
            editButton.className = 'edit-tab-btn';
            editButton.setAttribute('data-category', category);
            editButton.innerHTML = `<i class="bi bi-pencil"></i>`;
            editButton.title = 'Edit Category';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-main-tab-btn';
            deleteButton.setAttribute('data-category', category);
            deleteButton.innerHTML = `<i class="bi bi-trash"></i>`;
            deleteButton.title = 'Delete Category';

            actionsContainer.appendChild(editButton);
            actionsContainer.appendChild(deleteButton);
            
            tabItem.appendChild(tabButton);
            tabItem.appendChild(actionsContainer);
            admin.dom.mainTabs.appendChild(tabItem);
        });
        
        document.getElementById('addMainCategoryBtn').addEventListener('click', admin.addMainCategory);
        
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => admin.selectMainCategory(btn.getAttribute('data-category')));
        });
        
        document.querySelectorAll('.edit-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                admin.startInlineEditCategory(btn.getAttribute('data-category'));
            });
        });
        
        document.querySelectorAll('.delete-main-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                admin.confirmDeleteCategory(btn.getAttribute('data-category'));
            });
        });
        
        if (admin.state.allCategories.length > 0 && !admin.state.activeMainCategory) {
            admin.selectMainCategory(admin.state.allCategories[0]);
        }
        
        console.log('✅ Main tabs rendered successfully.');
        admin.logLayoutOnLoad();
    };

    admin.selectMainCategory = function(category) {
        console.log(`--- Selecting main category: ${category} ---`);
        
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === category);
        });
        
        admin.state.activeMainCategory = category;
        admin.state.activeSubCategory = null;
        admin.renderContentArea();
    };

    admin.renderContentArea = function() {
        console.log('--- Rendering tab content ---');
        admin.dom.contentArea.innerHTML = '';
        
        if (!admin.state.activeMainCategory) {
            admin.dom.contentArea.innerHTML = '<div class="text-center text-muted p-4">Please select a category.</div>';
            return;
        }
        
        const subcategories = admin.state.subcategoriesByCategory[admin.state.activeMainCategory] || [];
        const subTabsContainer = document.createElement('div');
        subTabsContainer.className = 'sub-tabs';
        
        const addSubcategoryItem = document.createElement('div');
        addSubcategoryItem.className = 'sub-tab-item';
        addSubcategoryItem.innerHTML = `<button class="add-sub-tab-btn" id="addSubcategoryBtn"><i class="bi bi-plus-lg"></i></button>`;
        subTabsContainer.appendChild(addSubcategoryItem);
        
        subcategories.forEach((subcategory, index) => {
            const subTabItem = document.createElement('div');
            subTabItem.className = 'sub-tab-item';
            
            const subTabButton = document.createElement('button');
            subTabButton.className = `sub-tab-btn ${index === 0 && !admin.state.activeSubCategory ? 'active' : ''}`;
            subTabButton.setAttribute('data-subcategory', subcategory);
            
            const tabText = document.createElement('span');
            tabText.className = 'tab-text';
            tabText.textContent = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
            subTabButton.appendChild(tabText);
            
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'tab-actions';

            const editButton = document.createElement('button');
            editButton.className = 'edit-tab-btn';
            editButton.setAttribute('data-subcategory', subcategory);
            editButton.innerHTML = `<i class="bi bi-pencil"></i>`;
            editButton.title = 'Edit Subcategory';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-sub-tab-btn';
            deleteButton.setAttribute('data-subcategory', subcategory);
            deleteButton.innerHTML = `<i class="bi bi-x"></i>`;
            deleteButton.title = 'Delete Subcategory';

            actionsContainer.appendChild(editButton);
            actionsContainer.appendChild(deleteButton);
            
            subTabItem.appendChild(subTabButton);
            subTabItem.appendChild(actionsContainer);
            subTabsContainer.appendChild(subTabItem);
        });
        
        if (subcategories.length === 0) {
            const noSubcategoriesMsg = document.createElement('div');
            noSubcategoriesMsg.className = 'text-muted';
            noSubcategoriesMsg.textContent = 'No subcategories found. Add one to organize products.';
            subTabsContainer.appendChild(noSubcategoriesMsg);
        }
        
        admin.dom.contentArea.appendChild(subTabsContainer);
        
        const productsContainer = document.createElement('div');
        productsContainer.className = 'products-container';
        productsContainer.innerHTML = admin.renderProductsBySubCategory();
        admin.dom.contentArea.appendChild(productsContainer);
        
        if (!admin.state.activeSubCategory && subcategories.length > 0) {
            admin.state.activeSubCategory = subcategories[0];
        }
        
        document.getElementById('addSubcategoryBtn').addEventListener('click', () => admin.addSubcategory(admin.state.activeMainCategory));
        
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => admin.selectSubCategory(btn.getAttribute('data-subcategory')));
        });
        
        document.querySelectorAll('.edit-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subcategory = btn.getAttribute('data-subcategory');
                admin.startInlineEditSubcategory(admin.state.activeMainCategory, subcategory);
            });
        });
        
        document.querySelectorAll('.delete-sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subcategory = btn.getAttribute('data-subcategory');
                admin.confirmDeleteSubcategory(admin.state.activeMainCategory, subcategory);
            });
        });
        
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => admin.openEditProductModal(card.getAttribute('data-product-id')));
        });
        
        document.querySelectorAll('.add-product-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.getAttribute('data-category');
                const subcategory = card.getAttribute('data-subcategory') || '';
                admin.openAddProductModal(category, subcategory);
            });
        });
    };

    admin.selectSubCategory = function(subcategory) {
        console.log(`--- Selecting subcategory: ${subcategory} ---`);
        
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-subcategory') === subcategory);
        });
        
        admin.state.activeSubCategory = subcategory;
        
        document.querySelector('.products-container').innerHTML = admin.renderProductsBySubCategory();
        
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => admin.openEditProductModal(card.getAttribute('data-product-id')));
        });
        
        document.querySelectorAll('.add-product-card').forEach(card => {
            card.addEventListener('click', () => {
                const category = card.getAttribute('data-category');
                const subcategory = card.getAttribute('data-subcategory') || '';
                admin.openAddProductModal(category, subcategory);
            });
        });
    };

    admin.renderProductsBySubCategory = function() {
        let categoryProducts = [];
        
        if (admin.state.activeSubCategory) {
            categoryProducts = admin.state.products.filter(p => 
                p.category === admin.state.activeMainCategory && p.sub_category === admin.state.activeSubCategory
            );
        } else {
            categoryProducts = admin.state.products.filter(p => p.category === admin.state.activeMainCategory);
        }
        
        let html = '<div class="row g-3">';
        
        html += `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="add-product-card" data-category="${admin.state.activeMainCategory}" data-subcategory="${admin.state.activeSubCategory || ''}">
                    <i class="bi bi-plus-circle-fill add-icon"></i>
                    <div class="add-text">Add new product</div>
                </div>
            </div>
        `;
        
        if (categoryProducts.length === 0) {
            html += '</div>';
            return html;
        }
        
        categoryProducts.forEach(product => {
            html += `
                <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                    <div class="product-card h-100" data-product-id="${product.id}">
                        <div class="product-image-container">
                            <img src="${product.image || 'https://picsum.photos/seed/product' + product.id + '/300/200.jpg'}" class="product-image" alt="${product.name}">
                            <div class="product-actions">
                                <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); SimoonAdmin.openEditProductModal(${product.id})"><i class="bi bi-pencil"></i></button>
                                <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); SimoonAdmin.confirmDeleteProduct(${product.id})"><i class="bi bi-trash"></i></button>
                            </div>
                        </div>
                        <div class="product-info">
                            <h5 class="product-title">${product.name}</h5>
                            <div class="product-meta">
                                <span class="badge bg-secondary">${product.sub_category || 'N/A'}</span>
                                <span class="product-price">$${product.price}</span>
                            </div>
                            <div class="product-stock">
                                <small class="text-muted">Stock: ${product.stock_quantity}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        return html;
    };

    admin.populateCategoryDropdowns = function() {
        console.log('--- Populating category dropdowns ---');
        admin.dom.category.innerHTML = '<option value="">Select...</option>';
        admin.state.allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            admin.dom.category.appendChild(option);
        });

        admin.dom.parentCategory.innerHTML = '<option value="">Select main category...</option>';
        admin.state.allCategories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            admin.dom.parentCategory.appendChild(option);
        });
        console.log('✅ Category dropdowns populated.');
    };

    // --- NEW: Inline Edit Functions ---

    admin.startInlineEditCategory = function(categoryName) {
        console.log(`Starting inline edit for category: ${categoryName}`);
        
        // Find the tab button for this category
        const tabButton = document.querySelector(`.main-tab-btn[data-category="${categoryName}"]`);
        if (!tabButton) return;
        
        // Get the current text
        const tabText = tabButton.querySelector('.tab-text');
        const currentText = tabText.textContent;
        
        // Create the inline edit container
        const editContainer = document.createElement('div');
        editContainer.className = 'inline-edit-container';
        
        // Create the input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = currentText;
        
        // Create the actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'inline-edit-actions';
        
        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'inline-edit-btn inline-edit-save';
        saveBtn.innerHTML = '<i class="bi bi-check"></i>';
        saveBtn.title = 'Save';
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'inline-edit-btn inline-edit-cancel';
        cancelBtn.innerHTML = '<i class="bi bi-x"></i>';
        cancelBtn.title = 'Cancel';
        
        // Add elements to containers
        actionsContainer.appendChild(saveBtn);
        actionsContainer.appendChild(cancelBtn);
        editContainer.appendChild(input);
        editContainer.appendChild(actionsContainer);
        
        // Replace the tab text with the edit container
        tabButton.replaceChild(editContainer, tabText);
        
        // Focus on the input
        input.focus();
        input.select();
        
        // Add event listeners
        saveBtn.addEventListener('click', () => admin.saveInlineEditCategory(categoryName, input.value));
        cancelBtn.addEventListener('click', () => admin.cancelInlineEditCategory(categoryName, currentText));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                admin.saveInlineEditCategory(categoryName, input.value);
            } else if (e.key === 'Escape') {
                admin.cancelInlineEditCategory(categoryName, currentText);
            }
        });
    };

    admin.saveInlineEditCategory = async function(oldName, newName) {
        if (!newName.trim()) {
            admin.cancelInlineEditCategory(oldName, oldName);
            return;
        }
        
        try {
            // استفاده از encodeURIComponent برای ارسال صحیح نام‌های حاوی کاراکترهای خاص
            const response = await fetch(`${admin.API_URL}/admin/categories/${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName.trim(), 
                    type: 'category'
                    // حذف image و description تا زمانی که مطمئن شویم در پایگاه داده وجود دارند
                })
            });
            
            if (response.ok) {
                // Update the category name in the state
                const index = admin.state.allCategories.indexOf(oldName);
                if (index !== -1) {
                    admin.state.allCategories[index] = newName.trim();
                }
                
                // Update the active category if it's the one being edited
                if (admin.state.activeMainCategory === oldName) {
                    admin.state.activeMainCategory = newName.trim();
                }
                
                // Update subcategories if they belong to this category
                if (admin.state.subcategoriesByCategory[oldName]) {
                    admin.state.subcategoriesByCategory[newName.trim()] = admin.state.subcategoriesByCategory[oldName];
                    delete admin.state.subcategoriesByCategory[oldName];
                }
                
                // Update products that belong to this category
                admin.state.products.forEach(product => {
                    if (product.category === oldName) {
                        product.category = newName.trim();
                    }
                });
                
                // Re-render the tabs
                admin.renderMainTabs();
                if (admin.state.activeMainCategory) {
                    admin.renderContentArea();
                }
                
                // Show success message
                admin.showNotification(`Category "${oldName}" renamed to "${newName.trim()}" successfully!`, 'success');
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error renaming category: ${errorData.message}`, 'error');
                admin.cancelInlineEditCategory(oldName, oldName);
            }
        } catch (error) {
            console.error('Error renaming category:', error);
            admin.showNotification('Error communicating with server!', 'error');
            admin.cancelInlineEditCategory(oldName, oldName);
        }
    };

    admin.cancelInlineEditCategory = function(categoryName, originalText) {
        const tabButton = document.querySelector(`.main-tab-btn[data-category="${categoryName}"]`);
        if (!tabButton) return;
        
        const editContainer = tabButton.querySelector('.inline-edit-container');
        if (!editContainer) return;
        
        // Create the original tab text
        const tabText = document.createElement('span');
        tabText.className = 'tab-text';
        tabText.textContent = originalText;
        
        // Replace the edit container with the original text
        tabButton.replaceChild(tabText, editContainer);
    };

    admin.startInlineEditSubcategory = function(parentCategory, subcategoryName) {
        console.log(`Starting inline edit for subcategory: ${subcategoryName} in category: ${parentCategory}`);
        
        // Find the tab button for this subcategory
        const tabButton = document.querySelector(`.sub-tab-btn[data-subcategory="${subcategoryName}"]`);
        if (!tabButton) return;
        
        // Get the current text
        const tabText = tabButton.querySelector('.tab-text');
        const currentText = tabText.textContent;
        
        // Create the inline edit container
        const editContainer = document.createElement('div');
        editContainer.className = 'inline-edit-container';
        
        // Create the input field
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-edit-input';
        input.value = currentText;
        
        // Create the actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'inline-edit-actions';
        
        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'inline-edit-btn inline-edit-save';
        saveBtn.innerHTML = '<i class="bi bi-check"></i>';
        saveBtn.title = 'Save';
        
        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'inline-edit-btn inline-edit-cancel';
        cancelBtn.innerHTML = '<i class="bi bi-x"></i>';
        cancelBtn.title = 'Cancel';
        
        // Add elements to containers
        actionsContainer.appendChild(saveBtn);
        actionsContainer.appendChild(cancelBtn);
        editContainer.appendChild(input);
        editContainer.appendChild(actionsContainer);
        
        // Replace the tab text with the edit container
        tabButton.replaceChild(editContainer, tabText);
        
        // Focus on the input
        input.focus();
        input.select();
        
        // Add event listeners
        saveBtn.addEventListener('click', () => admin.saveInlineEditSubcategory(parentCategory, subcategoryName, input.value));
        cancelBtn.addEventListener('click', () => admin.cancelInlineEditSubcategory(subcategoryName, currentText));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                admin.saveInlineEditSubcategory(parentCategory, subcategoryName, input.value);
            } else if (e.key === 'Escape') {
                admin.cancelInlineEditSubcategory(subcategoryName, currentText);
            }
        });
    };

    admin.saveInlineEditSubcategory = async function(parentCategory, oldName, newName) {
        if (!newName.trim()) {
            admin.cancelInlineEditSubcategory(oldName, oldName);
            return;
        }
        
        try {
            // استفاده از encodeURIComponent برای ارسال صحیح نام‌های حاوی کاراکترهای خاص
            const response = await fetch(`${admin.API_URL}/admin/subcategories/${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName.trim(), 
                    type: 'subcategory',
                    parentCategory: parentCategory
                    // حذف image و description تا زمانی که مطمئن شویم در پایگاه داده وجود دارند
                })
            });
            
            if (response.ok) {
                // Update the subcategory name in the state
                if (admin.state.subcategoriesByCategory[parentCategory]) {
                    const index = admin.state.subcategoriesByCategory[parentCategory].indexOf(oldName);
                    if (index !== -1) {
                        admin.state.subcategoriesByCategory[parentCategory][index] = newName.trim();
                    }
                }
                
                // Update the active subcategory if it's the one being edited
                if (admin.state.activeSubCategory === oldName) {
                    admin.state.activeSubCategory = newName.trim();
                }
                
                // Update products that belong to this subcategory
                admin.state.products.forEach(product => {
                    if (product.sub_category === oldName) {
                        product.sub_category = newName.trim();
                    }
                });
                
                // Re-render the content area
                admin.renderContentArea();
                
                // Show success message
                admin.showNotification(`Subcategory "${oldName}" renamed to "${newName.trim()}" successfully!`, 'success');
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error renaming subcategory: ${errorData.message}`, 'error');
                admin.cancelInlineEditSubcategory(oldName, oldName);
            }
        } catch (error) {
            console.error('Error renaming subcategory:', error);
            admin.showNotification('Error communicating with server!', 'error');
            admin.cancelInlineEditSubcategory(oldName, oldName);
        }
    };

    admin.cancelInlineEditSubcategory = function(subcategoryName, originalText) {
        const tabButton = document.querySelector(`.sub-tab-btn[data-subcategory="${subcategoryName}"]`);
        if (!tabButton) return;
        
        const editContainer = tabButton.querySelector('.inline-edit-container');
        if (!editContainer) return;
        
        // Create the original tab text
        const tabText = document.createElement('span');
        tabText.className = 'tab-text';
        tabText.textContent = originalText;
        
        // Replace the edit container with the original text
        tabButton.replaceChild(tabText, editContainer);
    };

    // --- Notification Function ---
    admin.showNotification = function(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '6px';
        notification.style.color = '#fff';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        notification.style.maxWidth = '300px';
        
        // Set background color based on type
        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        } else {
            notification.style.backgroundColor = '#3b82f6';
        }
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    };

    // --- Modal Management Functions (unchanged) ---

    admin.addMainCategory = function() {
        console.log('Opening modal for a NEW MAIN CATEGORY.');
        const existingModal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = null;
        admin.state.currentEditingType = 'category'; // KEY: Set the type
        admin.dom.categoryModalLabel.innerText = 'Add new category';
        admin.dom.categoryForm.reset();
        
        // Show main category fields, hide subcategory fields
        admin.dom.mainCategoryFields.style.display = 'block';
        admin.dom.parentCategoryDiv.style.display = 'none';
        
        admin.dom.deleteCategoryBtn.style.display = 'none';
        
        const modal = new bootstrap.Modal(admin.dom.categoryModal);
        modal.show();
    };

    admin.addSubcategory = function(parentCategory) {
        console.log(`Opening modal for a NEW SUBCATEGORY under "${parentCategory}".`);
        const existingModal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = null;
        admin.state.currentEditingType = 'subcategory'; // KEY: Set the type
        admin.dom.categoryModalLabel.innerText = 'Add new subcategory';
        admin.dom.categoryForm.reset();
        
        // Hide main category fields, show subcategory fields
        admin.dom.mainCategoryFields.style.display = 'none';
        admin.dom.parentCategoryDiv.style.display = 'block';
        
        admin.populateCategoryDropdowns(); // Ensure parent dropdown is populated
        
        if (parentCategory) {
            admin.dom.parentCategory.value = parentCategory;
        }
        
        admin.dom.deleteCategoryBtn.style.display = 'none';
        
        const modal = new bootstrap.Modal(admin.dom.categoryModal);
        modal.show();
    };

    // --- NEW FUNCTION FOR IMAGE UPLOAD ---
    admin.handleImageUpload = async function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('image', file);
        
        try {
            const response = await fetch(`${admin.API_URL}/upload-image`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                admin.dom.categoryImage.value = data.imageUrl;
                admin.showNotification('Image uploaded successfully!', 'success');
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error uploading image: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            admin.showNotification('Error uploading image!', 'error');
        }
    };

    // --- SAVE FUNCTION (REVISED TO HANDLE BOTH TYPES) ---
    admin.saveCategory = async function() {
        const categoryNameValue = admin.dom.categoryName.value.trim();
        const categoryImageValue = admin.dom.categoryImage.value.trim();
        const categoryDescriptionValue = admin.dom.categoryDescription.value.trim();
        const parentCategoryValue = admin.dom.parentCategory.value;
        
        if (!categoryNameValue) {
            alert('Name cannot be empty.');
            return;
        }
        
        // This is the key part: we build the data object based on the type
        let categoryData = { name: categoryNameValue };
        
        if (admin.state.currentEditingType === 'category') {
            categoryData.type = 'category';
            categoryData.image = categoryImageValue;
            categoryData.description = categoryDescriptionValue;
        } else { // It's a subcategory
            categoryData.type = 'subcategory';
            categoryData.parentCategory = parentCategoryValue;
            if (!parentCategoryValue) {
                alert('Please select a parent category.');
                return;
            }
        }
        
        try {
            let response;
            if (admin.state.currentEditingId) {
                // This part handles EDITING, which we'll assume works similarly
                response = await fetch(`${admin.API_URL}/admin/categories/${admin.state.currentEditingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryData) });
            } else {
                // This part handles ADDING a new category/subcategory
                response = await fetch(`${admin.API_URL}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryData) });
            }
            
            const data = await response.json();

            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
                if (modal) modal.hide();
                
                alert(`${categoryData.type === 'category' ? 'Category' : 'Subcategory'} "${categoryNameValue}" has been successfully ${admin.state.currentEditingId ? 'updated' : 'added'}.`);
                
                await admin.fetchCategoriesAndSubcategories();
                admin.renderMainTabs();
                if (admin.state.activeMainCategory) admin.renderContentArea();
            } else {
                console.error(`!!! ERROR saving ${categoryData.type} !!!`, data.message);
                alert(data.message || `Error saving ${categoryData.type}!`);
            }
        } catch (error) {
            console.error('!!! ERROR in saveCategory !!!', error.message);
            alert('Error communicating with server!');
        }
    };


    admin.editCategory = function(categoryName) {
        console.log(`CATEGORY-MANAGEMENT: Opening editCategory modal for: ${categoryName}`);
        const existingModal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = categoryName;
        admin.state.currentEditingType = 'category';
        admin.dom.categoryModalLabel.innerText = 'Edit Category';
        admin.dom.categoryForm.reset();
        admin.dom.categoryName.value = categoryName;
        admin.dom.categoryType.value = 'category';
        admin.dom.parentCategoryDiv.style.display = 'none';
        admin.dom.deleteCategoryBtn.style.display = 'block';
        
        const modal = new bootstrap.Modal(admin.dom.categoryModal);
        modal.show();
    };

    admin.editSubcategory = function(parentCategory, subcategoryName) {
        console.log(`CATEGORY-MANAGEMENT: Opening editSubcategory modal for: ${subcategoryName}`);
        const existingModal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = subcategoryName;
        admin.state.currentEditingType = 'subcategory';
        admin.dom.categoryModalLabel.innerText = 'Edit Subcategory';
        admin.dom.categoryForm.reset();
        admin.dom.categoryName.value = subcategoryName;
        admin.dom.categoryType.value = 'subcategory';
        admin.dom.parentCategory.value = parentCategory;
        admin.dom.parentCategoryDiv.style.display = 'block';
        admin.dom.deleteCategoryBtn.style.display = 'block';
        
        const modal = new bootstrap.Modal(admin.dom.categoryModal);
        modal.show();
    };

    admin.confirmDeleteCategory = function(categoryName) {
        if (confirm(`Are you sure you want to delete category "${categoryName}"? This will also delete all subcategories and products in this category.`)) {
            admin.deleteCategory(categoryName);
        }
    };

    admin.confirmDeleteSubcategory = function(parentCategory, subcategoryName) {
        if (confirm(`Are you sure you want to delete subcategory "${subcategoryName}"? This will also delete all products in this subcategory.`)) {
            admin.deleteSubcategory(parentCategory, subcategoryName);
        }
    };

    // --- Save/Delete Functions (unchanged) ---

    admin.saveCategory = async function() {
        const categoryNameValue = admin.dom.categoryName.value.trim();
        const categoryTypeValue = admin.dom.categoryType.value;
        const parentCategoryValue = admin.dom.parentCategory.value;
        const categoryImageValue = admin.dom.categoryImage.value.trim();
        const categoryDescriptionValue = admin.dom.categoryDescription.value.trim();
        
        if (!categoryNameValue) {
            alert('Category name cannot be empty.');
            return;
        }
        
        try {
            let response;
            const categoryData = { name: categoryNameValue, type: categoryTypeValue, image: categoryImageValue, description: categoryDescriptionValue };
            
            if (categoryTypeValue === 'subcategory') {
                categoryData.parentCategory = parentCategoryValue;
            }
            
            if (admin.state.currentEditingId) {
                response = await fetch(`${admin.API_URL}/admin/categories/${admin.state.currentEditingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryData) });
            } else {
                response = await fetch(`${admin.API_URL}/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryData) });
            }
            
            const data = await response.json();

            if (response.ok) {
                console.log('CATEGORY-MANAGEMENT: Category saved successfully. Preparing to close modal.');
                const modal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
                if (modal) {
                    modal.hide();
                    admin.dom.categoryModal.addEventListener('hidden.bs.modal', function () {
                        console.log('CATEGORY-MANAGEMENT: Category modal is now fully hidden. Disposing instance and moving focus.');
                        modal.dispose();
                        document.querySelector('#addMainCategoryBtn')?.focus();
                    }, { once: true });
                }
                
                alert(`${categoryTypeValue === 'category' ? 'Category' : 'Subcategory'} "${categoryNameValue}" has been successfully ${admin.state.currentEditingId ? 'updated' : 'added'}.`);
                
                await admin.fetchCategoriesAndSubcategories();
                admin.renderMainTabs();
                if (admin.state.activeMainCategory) admin.renderContentArea();
                
                try { await fetch(`${admin.API_URL}/notify-category-update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }) }); } catch (e) { console.error('Notify error', e); }
            } else {
                console.error(`!!! ERROR ${admin.state.currentEditingId ? 'updating' : 'saving'} ${categoryTypeValue} !!!`, data.message);
                alert(data.message || `Error ${admin.state.currentEditingId ? 'updating' : 'adding'} ${categoryTypeValue}!`);
            }
        } catch (error) {
            console.error('!!! ERROR in saveCategory !!!', error.message);
            alert('Error communicating with server!');
        }
    };

    admin.deleteCategory = async function(categoryName = null) {
        const categoryToDelete = categoryName || admin.state.currentEditingId;
        console.log(`--- Deleting category "${categoryToDelete}" ---`);
        
        try {
            // استفاده از encodeURIComponent برای ارسال صحیح نام‌های حاوی کاراکترهای خاص
            const response = await fetch(`${admin.API_URL}/admin/categories/${encodeURIComponent(categoryToDelete)}`, { method: 'DELETE' });
            
            if (response.ok) {
                console.log('CATEGORY-MANAGEMENT: Category deleted successfully. Preparing to close modal.');
                const modal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
                if (modal) {
                    modal.hide();
                    admin.dom.categoryModal.addEventListener('hidden.bs.modal', function () {
                        console.log('CATEGORY-MANAGEMENT: Category modal is now fully hidden. Disposing instance and moving focus.');
                        modal.dispose();
                        document.querySelector('#addMainCategoryBtn')?.focus();
                    }, { once: true });
                }
                
                admin.showNotification(`Category "${categoryToDelete}" has been successfully deleted.`, 'success');
                
                await admin.fetchCategoriesAndSubcategories();
                admin.renderMainTabs();
                
                if (admin.state.activeMainCategory === categoryToDelete) {
                    admin.state.activeMainCategory = null;
                    admin.state.activeSubCategory = null;
                    admin.dom.contentArea.innerHTML = '<div class="text-center text-muted p-4">Please select a category.</div>';
                }
                
                try { 
                    await fetch(`${admin.API_URL}/notify-category-update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }) }); 
                } catch (e) { 
                    console.error('Notify error', e); 
                }
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error deleting category: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('!!! ERROR in deleteCategory !!!', error.message);
            admin.showNotification('Error communicating with server!', 'error');
        }
    };

    admin.deleteSubcategory = async function(parentCategory, subcategoryName = null) {
        const subcategoryToDelete = subcategoryName || admin.state.currentEditingId;
        console.log(`--- Deleting subcategory "${subcategoryToDelete}" from category "${parentCategory}" ---`);
        
        try {
            // استفاده از encodeURIComponent برای ارسال صحیح نام‌های حاوی کاراکترهای خاص
            const response = await fetch(`${admin.API_URL}/admin/subcategories/${encodeURIComponent(subcategoryToDelete)}`, { 
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ parentCategory: parentCategory }) 
            });
            
            if (response.ok) {
                console.log('CATEGORY-MANAGEMENT: Subcategory deleted successfully. Preparing to close modal.');
                const modal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
                if (modal) {
                    modal.hide();
                    admin.dom.categoryModal.addEventListener('hidden.bs.modal', function () {
                        console.log('CATEGORY-MANAGEMENT: Category modal is now fully hidden. Disposing instance and moving focus.');
                        modal.dispose();
                        document.querySelector('#addMainCategoryBtn')?.focus();
                    }, { once: true });
                }
                
                admin.showNotification(`Subcategory "${subcategoryToDelete}" has been successfully deleted.`, 'success');
                
                await admin.fetchCategoriesAndSubcategories();
                
                if (admin.state.activeSubCategory === subcategoryToDelete) {
                    admin.state.activeSubCategory = null;
                }
                
                admin.renderContentArea();
                
                try { 
                    await fetch(`${admin.API_URL}/notify-category-update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }) }); 
                } catch (e) { 
                    console.error('Notify error', e); 
                }
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error deleting subcategory: ${errorData.message}`, 'error');
            }
        } catch (error) {
            console.error('!!! ERROR in deleteSubcategory !!!', error.message);
            admin.showNotification('Error communicating with server!', 'error');
        }
    };

})(window.SimoonAdmin);