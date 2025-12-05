/**
 * Simoon Cafe Admin Panel - Category Management (Updated for Dynamic Tabs & Inline Edit & Special Products)
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
            
            const productCategories = [...new Set(admin.state.products.map(p => p.category).filter(cat => cat != null))].sort();
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

                const customMainCategories = customData.filter(item => item.type === 'category' && item.name != null).map(item => item.name);
                admin.state.allCategories = [...new Set([...productCategories, ...customMainCategories])].sort();

                customData.filter(item => item.type === 'subcategory' && item.name != null && item.parent_category != null).forEach(item => {
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
            
            // NEW: Check if there are any special products and add the Special tab
            const hasSpecialProducts = admin.state.products.some(p => p.is_special === true);
            if (hasSpecialProducts) {
                // Add 'Special' if it's not already there
                if (!admin.state.allCategories.includes('Special')) {
                    admin.state.allCategories.push('Special');
                }
            } else {
                // Remove 'Special' if no special products exist
                admin.state.allCategories = admin.state.allCategories.filter(cat => cat !== 'Special');
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
            admin.showNotification('Error fetching categories! See console for details.', 'error');
        }
    };


    admin.renderMainTabs = function() {
        console.log('--- Rendering main tabs ribbon ---');
        const mainTabsRibbon = document.getElementById('mainTabsRibbon');
        mainTabsRibbon.innerHTML = '';
        
        admin.state.allCategories.forEach((category, index) => {
            if (!category) {
                console.warn('Skipping undefined category in renderMainTabs');
                return;
            }

            const tabItem = document.createElement('div');
            tabItem.className = `main-tab-item ${category === admin.state.activeMainCategory ? 'active' : ''}`;
            
            if (category === 'Special') {
                tabItem.classList.add('special-tab');
            }
            
            const tabButton = document.createElement('button');
            tabButton.className = `main-tab-btn`;
            tabButton.setAttribute('data-category', category);
            
            if (category === 'Special') {
                tabButton.innerHTML = '<i class="bi bi-star-fill"></i> Special';
            } else {
                tabButton.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            }
            
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'tab-actions';

            if (category !== 'Special') {
                const editButton = document.createElement('button');
                editButton.className = 'edit-tab-btn';
                editButton.setAttribute('data-category', category);
                editButton.innerHTML = `<i class="bi bi-pencil"></i>`;
                editButton.title = 'Edit Category';

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-tab-btn';
                deleteButton.setAttribute('data-category', category);
                deleteButton.innerHTML = `<i class="bi bi-trash"></i>`;
                deleteButton.title = 'Delete Category';

                actionsContainer.appendChild(editButton);
                actionsContainer.appendChild(deleteButton);
            }
            
            tabItem.appendChild(tabButton);
            tabItem.appendChild(actionsContainer);
            mainTabsRibbon.appendChild(tabItem);
        });
        
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                admin.selectMainCategory(btn.getAttribute('data-category'));
            });
        });
        
        document.querySelectorAll('.edit-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                admin.startInlineEditCategory(btn.getAttribute('data-category'));
            });
        });
        
        document.querySelectorAll('.delete-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                admin.confirmDeleteCategory(btn.getAttribute('data-category'));
            });
        });
        
        if (admin.state.allCategories.length > 0 && !admin.state.activeMainCategory) {
            admin.selectMainCategory(admin.state.allCategories[0]);
        }
        
        console.log('✅ Main tabs ribbon rendered successfully.');
    };


    admin.selectMainCategory = function(category) {
        console.log(`--- Selecting main category: ${category} ---`);
        
        document.querySelectorAll('.main-tab-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeTabButton = document.querySelector(`.main-tab-btn[data-category="${category}"]`);
        if (activeTabButton) {
            const activeTabItem = activeTabButton.closest('.main-tab-item');
            activeTabItem.classList.add('active');
            
            setTimeout(() => {
                activeTabItem.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }, 100);
        }
        
        admin.state.activeMainCategory = category;
        admin.state.activeSubCategory = null;
        admin.renderContentArea();
    };


    admin.renderContentArea = function() {
        console.log('--- Rendering content area (sub-tabs and products) ---');
        
        if (!admin.state.activeMainCategory) {
            admin.dom.contentArea.innerHTML = '<div class="text-center text-muted p-4">Please select a category.</div>';
            return;
        }
        
        // NEW: Special category doesn't have subcategories, render special carousel management
        if (admin.state.activeMainCategory === 'Special') {
            // نمایش بخش مدیریت کاروسل ویژه
            admin.toggleSpecialCarouselManagement(true);
            admin.renderSpecialSlidesManagement();
            return; 
        } else {
            // مخفی کردن بخش مدیریت کاروسل برای دسته‌بندی‌های دیگر
            admin.toggleSpecialCarouselManagement(false);
        }

        // --- Original logic for other categories ---
        const subcategories = admin.state.subcategoriesByCategory[admin.state.activeMainCategory] || [];
        
        const subTabsContainer = document.getElementById('subTabsRibbon');
        subTabsContainer.innerHTML = '';
        
        subcategories.forEach((subcategory) => {
            if (!subcategory) {
                console.warn('Skipping undefined subcategory in renderContentArea');
                return;
            }

            const subTabItem = document.createElement('div');
            subTabItem.className = `sub-tab-item ${subcategory === admin.state.activeSubCategory ? 'active' : ''}`;
            
            const subTabButton = document.createElement('button');
            subTabButton.className = `sub-tab-btn`;
            subTabButton.setAttribute('data-subcategory', subcategory);
            subTabButton.textContent = subcategory.charAt(0).toUpperCase() + subcategory.slice(1);
            
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'tab-actions';

            const editButton = document.createElement('button');
            editButton.className = 'edit-tab-btn';
            editButton.setAttribute('data-subcategory', subcategory);
            editButton.innerHTML = `<i class="bi bi-pencil"></i>`;
            editButton.title = 'Edit Subcategory';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-tab-btn';
            deleteButton.setAttribute('data-subcategory', subcategory);
            deleteButton.innerHTML = `<i class="bi bi-trash"></i>`;
            deleteButton.title = 'Delete Subcategory';

            actionsContainer.appendChild(editButton);
            actionsContainer.appendChild(deleteButton);
            
            subTabItem.appendChild(subTabButton);
            subTabItem.appendChild(actionsContainer);
            subTabsContainer.appendChild(subTabItem);
        });
        
        const productsContainer = document.createElement('div');
        productsContainer.className = 'products-container';
        productsContainer.innerHTML = admin.renderProductsBySubCategory();
        admin.dom.contentArea.innerHTML = '';
        admin.dom.contentArea.appendChild(productsContainer);
        
        document.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                admin.selectSubCategory(btn.getAttribute('data-subcategory'));
            });
        });
        
        document.querySelectorAll('.sub-tab-item .edit-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const subcategory = btn.getAttribute('data-subcategory');
                admin.startInlineEditSubcategory(admin.state.activeMainCategory, subcategory);
            });
        });
        
        document.querySelectorAll('.sub-tab-item .delete-tab-btn').forEach(btn => {
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

    // NEW: Function to render products for the "Special" tab
    admin.renderSpecialProducts = function() {
        const specialProducts = admin.state.products.filter(p => p.is_special === true);
        
        let html = '<div class="row g-3">';
        
        if (specialProducts.length === 0) {
            html += '<div class="col-12"><div class="alert alert-info text-center">No special products found. Mark products as special in their edit modal to see them here.</div></div>';
        } else {
            specialProducts.forEach(product => {
                html += `
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                        <div class="product-card h-100 special-product-card" data-product-id="${product.id}">
                            <div class="product-image-container">
                                <img src="${product.image || 'https://picsum.photos/seed/product' + product.id + '/300/200.jpg'}" class="product-image" alt="${product.name}">
                                <div class="special-badge">
                                    <i class="bi bi-star-fill"></i> Special
                                </div>
                                <div class="product-actions">
                                    <button class="btn btn-sm btn-warning" onclick="event.stopPropagation(); SimoonAdmin.openEditProductModal(${product.id})"><i class="bi bi-pencil"></i></button>
                                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); SimoonAdmin.confirmDeleteProduct(${product.id})"><i class="bi bi-trash"></i></button>
                                </div>
                            </div>
                            <div class="product-info">
                                <h5 class="product-title">${product.name}</h5>
                                <div class="product-meta">
                                    <span class="badge bg-secondary">${product.category}</span>
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
        }
        
        html += '</div>';
        return html;
    };

    admin.selectSubCategory = function(subcategory) {
        console.log(`--- Selecting subcategory: ${subcategory} ---`);
        
        document.querySelectorAll('.sub-tab-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeSubTabButton = document.querySelector(`.sub-tab-btn[data-subcategory="${subcategory}"]`);
        if (activeSubTabButton) {
            activeSubTabButton.closest('.sub-tab-item').classList.add('active');
        }
        
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
            if (cat === 'Special' || !cat) return; // MODIFIED: Skip 'Special' category
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            admin.dom.category.appendChild(option);
        });

        admin.dom.parentCategory.innerHTML = '<option value="">Select main category...</option>';
        admin.state.allCategories.forEach(cat => {
            if (cat === 'Special' || !cat) return; // MODIFIED: Skip 'Special' category
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
            admin.dom.parentCategory.appendChild(option);
        });
        console.log('✅ Category dropdowns populated.');
    };

    // --- Inline Edit Functions ---
    admin.startInlineEditCategory = function(categoryName) {
        console.log(`Starting inline edit for category: ${categoryName}`);
        
        const tabButton = document.querySelector(`.main-tab-btn[data-category="${categoryName}"]`);
        const tabItem = tabButton ? tabButton.closest('.main-tab-item') : null;
        
        if (!tabButton || !tabItem) return;
        
        const currentText = tabButton.textContent;
        
        const editHtml = `
            <div class="inline-edit-container">
                <input type="text" class="form-control" value="${currentText}">
                <div class="tab-actions">
                    <button class="inline-edit-action-btn save-btn" title="Save"><i class="bi bi-check-lg"></i></button>
                    <button class="inline-edit-action-btn cancel-btn" title="Cancel"><i class="bi bi-x-lg"></i></button>
                </div>
            </div>
        `;
        
        tabItem.innerHTML = editHtml;
        
        const input = tabItem.querySelector('input');
        const saveBtn = tabItem.querySelector('.save-btn');
        const cancelBtn = tabItem.querySelector('.cancel-btn');
        
        input.focus();
        input.select();
        
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
            const response = await fetch(`${admin.API_URL}/admin/categories/${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName.trim(), 
                    type: 'category'
                })
            });
            
            if (response.ok) {
                const index = admin.state.allCategories.indexOf(oldName);
                if (index !== -1) {
                    admin.state.allCategories[index] = newName.trim();
                }
                
                if (admin.state.activeMainCategory === oldName) {
                    admin.state.activeMainCategory = newName.trim();
                }
                
                if (admin.state.subcategoriesByCategory[oldName]) {
                    admin.state.subcategoriesByCategory[newName.trim()] = admin.state.subcategoriesByCategory[oldName];
                    delete admin.state.subcategoriesByCategory[oldName];
                }
                
                admin.state.products.forEach(product => {
                    if (product.category === oldName) {
                        product.category = newName.trim();
                    }
                });
                
                admin.renderMainTabs();
                if (admin.state.activeMainCategory) {
                    admin.renderContentArea();
                }
                
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
        const tabItem = document.querySelector(`.main-tab-item:has(.inline-edit-container)`);
        if (!tabItem) return;

        const originalHtml = `
            <button class="main-tab-btn ${admin.state.activeMainCategory === categoryName ? 'active' : ''}" data-category="${categoryName}">${originalText}</button>
            <div class="tab-actions">
                <button class="edit-tab-btn" data-category="${categoryName}" title="Edit Category"><i class="bi bi-pencil"></i></button>
                <button class="delete-tab-btn" data-category="${categoryName}" title="Delete Category"><i class="bi bi-trash"></i></button>
            </div>
        `;
        
        tabItem.innerHTML = originalHtml;
        
        const newTabButton = tabItem.querySelector('.main-tab-btn');
        const newEditBtn = tabItem.querySelector('.edit-tab-btn');
        const newDeleteBtn = tabItem.querySelector('.delete-tab-btn');

        newTabButton.addEventListener('click', () => admin.selectMainCategory(categoryName));
        newEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            admin.startInlineEditCategory(categoryName);
        });
        newDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            admin.confirmDeleteCategory(categoryName);
        });
    };
    
    // Subcategory inline edit functions
    admin.startInlineEditSubcategory = function(parentCategory, subcategoryName) {
        console.log(`Starting inline edit for subcategory: ${subcategoryName} in category: ${parentCategory}`);
        
        const tabButton = document.querySelector(`.sub-tab-btn[data-subcategory="${subcategoryName}"]`);
        const tabItem = tabButton ? tabButton.closest('.sub-tab-item') : null;
        
        if (!tabButton || !tabItem) return;
        
        const currentText = tabButton.textContent;
        
        const editHtml = `
            <div class="inline-edit-container">
                <input type="text" class="form-control" value="${currentText}">
                <div class="tab-actions">
                    <button class="inline-edit-action-btn save-btn" title="Save"><i class="bi bi-check-lg"></i></button>
                    <button class="inline-edit-action-btn cancel-btn" title="Cancel"><i class="bi bi-x-lg"></i></button>
                </div>
            </div>
        `;
        
        tabItem.innerHTML = editHtml;
        
        const input = tabItem.querySelector('input');
        const saveBtn = tabItem.querySelector('.save-btn');
        const cancelBtn = tabItem.querySelector('.cancel-btn');
        
        input.focus();
        input.select();
        
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
            const response = await fetch(`${admin.API_URL}/admin/subcategories/${encodeURIComponent(oldName)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName.trim(), 
                    type: 'subcategory',
                    parentCategory: parentCategory
                })
            });
            
            if (response.ok) {
                if (admin.state.subcategoriesByCategory[parentCategory]) {
                    const index = admin.state.subcategoriesByCategory[parentCategory].indexOf(oldName);
                    if (index !== -1) {
                        admin.state.subcategoriesByCategory[parentCategory][index] = newName.trim();
                    }
                }
                
                if (admin.state.activeSubCategory === oldName) {
                    admin.state.activeSubCategory = newName.trim();
                }
                
                admin.state.products.forEach(product => {
                    if (product.sub_category === oldName) {
                        product.sub_category = newName.trim();
                    }
                });
                
                admin.renderContentArea();
                
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
        const tabItem = document.querySelector(`.sub-tab-item:has(.inline-edit-container)`);
        if (!tabItem) return;

        const originalHtml = `
            <button class="sub-tab-btn ${admin.state.activeSubCategory === subcategoryName ? 'active' : ''}" data-subcategory="${subcategoryName}">${originalText}</button>
            <div class="tab-actions">
                <button class="edit-tab-btn" data-subcategory="${subcategoryName}" title="Edit Subcategory"><i class="bi bi-pencil"></i></button>
                <button class="delete-tab-btn" data-subcategory="${subcategoryName}" title="Delete Subcategory"><i class="bi bi-trash"></i></button>
            </div>
        `;
        
        tabItem.innerHTML = originalHtml;
        
        const newTabButton = tabItem.querySelector('.sub-tab-btn');
        const newEditBtn = tabItem.querySelector('.edit-tab-btn');
        const newDeleteBtn = tabItem.querySelector('.delete-tab-btn');

        newTabButton.addEventListener('click', () => admin.selectSubCategory(subcategoryName));
        newEditBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            admin.startInlineEditSubcategory(admin.state.activeMainCategory, subcategoryName);
        });
        newDeleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            admin.confirmDeleteSubcategory(admin.state.activeMainCategory, subcategoryName);
        });
    };

    // --- Notification Function ---
    admin.showNotification = function(message, type = 'info') {
        const notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        let iconClass = 'bi-info-circle';
        if (type === 'success') {
            iconClass = 'bi-check-circle';
        } else if (type === 'error') {
            iconClass = 'bi-exclamation-circle';
        }
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="bi ${iconClass}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <button class="notification-ok-btn">OK</button>
            </div>
        `;
        
        notificationContainer.appendChild(notification);
        document.body.appendChild(notificationContainer);
        
        const okBtn = notification.querySelector('.notification-ok-btn');
        okBtn.addEventListener('click', () => {
            hideNotification(notificationContainer);
        });
        
        setTimeout(() => {
            hideNotification(notificationContainer);
        }, 3000);
        
        function hideNotification(element) {
            element.style.opacity = '0';
            element.style.transform = 'translateX(100%)';
            element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            setTimeout(() => {
                if (document.body.contains(element)) {
                    document.body.removeChild(element);
                }
            }, 300);
        }
        
        setTimeout(() => {
            notificationContainer.style.opacity = '1';
            notificationContainer.style.transform = 'translateX(0)';
        }, 10);
    };

    // --- Custom Confirmation Modal Functions ---
    admin.showConfirmDialog = function(message, onConfirm, options = {}) {
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmMessage');
        const confirmOkBtn = document.getElementById('confirmOkBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        const confirmModalLabel = document.getElementById('confirmModalLabel');
        
        confirmMessage.textContent = message;
        
        if (options.title) {
            confirmModalLabel.textContent = options.title;
        } else {
            confirmModalLabel.textContent = 'Confirm Action';
        }
        
        if (options.okText) {
            confirmOkBtn.textContent = options.okText;
        } else {
            confirmOkBtn.textContent = 'Delete';
        }
        
        if (options.okClass) {
            confirmOkBtn.className = `btn ${options.okClass}`;
        } else {
            confirmOkBtn.className = 'btn btn-danger';
        }
        
        const modal = new bootstrap.Modal(confirmModal);
        
        const handleConfirm = function() {
            modal.hide();
            onConfirm();
            confirmOkBtn.removeEventListener('click', handleConfirm);
            confirmCancelBtn.removeEventListener('click', handleCancel);
        };
        
        const handleCancel = function() {
            modal.hide();
            confirmOkBtn.removeEventListener('click', handleConfirm);
            confirmCancelBtn.removeEventListener('click', handleCancel);
        };
        
        confirmOkBtn.addEventListener('click', handleConfirm);
        confirmCancelBtn.addEventListener('click', handleCancel);
        
        modal.show();
    };

    // --- Modal Management Functions ---
    admin.addMainCategory = function() {
        const existingModal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = null;
        admin.state.currentEditingType = 'category';
        admin.dom.categoryModalLabel.innerText = 'Add new category';
        admin.dom.categoryForm.reset();
        admin.dom.categoryType.value = 'category';
        admin.dom.mainCategoryFields.style.display = 'block';
        admin.dom.parentCategoryDiv.style.display = 'none';
        admin.dom.deleteCategoryBtn.style.display = 'none';
        
        const modal = new bootstrap.Modal(admin.dom.categoryModal);
        modal.show();
    };

    admin.addSubcategory = function(parentCategory) {
        const existingModal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
        if (existingModal) existingModal.dispose();

        admin.state.currentEditingId = null;
        admin.state.currentEditingType = 'subcategory';
        admin.dom.categoryModalLabel.innerText = 'Add new subcategory';
        admin.dom.categoryForm.reset();
        admin.dom.categoryType.value = 'subcategory';
        admin.dom.mainCategoryFields.style.display = 'none';
        admin.dom.parentCategoryDiv.style.display = 'block';
        admin.populateCategoryDropdowns();
        
        if (parentCategory) {
            admin.dom.parentCategory.value = parentCategory;
        }
        
        admin.dom.deleteCategoryBtn.style.display = 'none';
        
        const modal = new bootstrap.Modal(admin.dom.categoryModal);
        modal.show();
    };

    admin.editCategory = function(categoryName) {
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
        admin.showConfirmDialog(
            `Are you sure you want to delete category "${categoryName}"? This will also delete all subcategories and products in this category.`,
            () => admin.deleteCategory(categoryName),
            { title: 'Delete Category', okText: 'Delete', okClass: 'btn-danger' }
        );
    };

    admin.confirmDeleteSubcategory = function(parentCategory, subcategoryName) {
        admin.showConfirmDialog(
            `Are you sure you want to delete subcategory "${subcategoryName}"? This will also delete all products in this subcategory.`,
            () => admin.deleteSubcategory(parentCategory, subcategoryName),
            { title: 'Delete Subcategory', okText: 'Delete', okClass: 'btn-danger' }
        );
    };

    admin.saveCategory = async function() {
        const categoryNameValue = admin.dom.categoryName.value.trim();
        const categoryTypeValue = admin.dom.categoryType.value;
        const parentCategoryValue = admin.dom.parentCategory.value;
        const categoryImageValue = admin.dom.categoryImage.value.trim();
        const categoryDescriptionValue = admin.dom.categoryDescription.value.trim();
        
        if (!categoryNameValue) {
            admin.showNotification('Category name cannot be empty.', 'error');
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
                const modal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
                if (modal) {
                    modal.hide();
                    modal.dispose();
                }
                
                admin.showNotification(`${categoryTypeValue === 'category' ? 'Category' : 'Subcategory'} "${categoryNameValue}" has been successfully ${admin.state.currentEditingId ? 'updated' : 'added'}.`, 'success');
                
                await admin.fetchCategoriesAndSubcategories();
                admin.renderMainTabs();
                
                if (!admin.state.currentEditingId && categoryTypeValue === 'category') {
                    admin.selectMainCategory(categoryNameValue);
                }
                
                if (admin.state.activeMainCategory) admin.renderContentArea();
                
                try { await fetch(`${admin.API_URL}/notify-category-update`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'refresh' }) }); } catch (e) { console.error('Notify error', e); }
            } else {
                console.error(`!!! ERROR ${admin.state.currentEditingId ? 'updating' : 'saving'} ${categoryTypeValue} !!!`, data.message);
                admin.showNotification(data.message || `Error ${admin.state.currentEditingId ? 'updating' : 'adding'} ${categoryTypeValue}!`, 'error');
            }
        } catch (error) {
            console.error('!!! ERROR in saveCategory !!!', error.message);
            admin.showNotification('Error communicating with server!', 'error');
        }
    };

    admin.deleteCategory = async function(categoryName = null) {
        const categoryToDelete = categoryName || admin.state.currentEditingId;
        if (!categoryToDelete) return;

        let categoryToSelect = null;
        const wasActive = admin.state.activeMainCategory === categoryToDelete;
        if (wasActive) {
            const deletedIndex = admin.state.allCategories.indexOf(categoryToDelete);
            const remainingCategories = admin.state.allCategories.filter(cat => cat !== categoryToDelete);
            
            if (deletedIndex > 0 && remainingCategories.length > 0) {
                categoryToSelect = admin.state.allCategories[deletedIndex - 1];
            } else if (deletedIndex === 0 && remainingCategories.length > 0) {
                categoryToSelect = remainingCategories[0];
            }
        }

        console.log(`--- Deleting category "${categoryToDelete}" ---`);
        
        try {
            const response = await fetch(`${admin.API_URL}/admin/categories/${encodeURIComponent(categoryToDelete)}`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                admin.state.allCategories = admin.state.allCategories.filter(cat => cat !== categoryToDelete);
                delete admin.state.subcategoriesByCategory[categoryToDelete];
                admin.state.products = admin.state.products.filter(p => p.category !== categoryToDelete);

                if (wasActive) {
                    admin.state.activeMainCategory = categoryToSelect;
                    admin.state.activeSubCategory = null;
                }

                admin.renderMainTabs();
                
                if (categoryToSelect) {
                    admin.selectMainCategory(categoryToSelect);
                } else if (wasActive) {
                    admin.dom.contentArea.innerHTML = '<div class="text-center text-muted p-4">Please select a category.</div>';
                }
                
                admin.showNotification(`Category "${categoryToDelete}" and all its data have been deleted.`, 'success');
                
            } else if (response.status === 404) {
                admin.state.allCategories = admin.state.allCategories.filter(cat => cat !== categoryToDelete);
                delete admin.state.subcategoriesByCategory[categoryToDelete];
                admin.state.products = admin.state.products.filter(p => p.category !== categoryToDelete);
                
                if (admin.state.activeMainCategory === categoryToDelete) {
                    admin.state.activeMainCategory = null;
                    admin.state.activeSubCategory = null;
                    admin.dom.contentArea.innerHTML = '<div class="text-center text-muted p-4">Please select a category.</div>';
                }
                
                admin.renderMainTabs();
                admin.showNotification(`Category "${categoryToDelete}" was already deleted.`, 'info');
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
            const response = await fetch(`${admin.API_URL}/admin/subcategories/${encodeURIComponent(subcategoryToDelete)}`, { 
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ parentCategory: parentCategory }) 
            });
            
            if (response.ok) {
                const modal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
                if (modal) {
                    modal.hide();
                    modal.dispose();
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

    // --- Event Listeners for the Add Buttons ---
    document.addEventListener('DOMContentLoaded', function() {
        const addMainTabBtn = document.getElementById('addMainTabBtn');
        if (addMainTabBtn) {
            addMainTabBtn.addEventListener('click', admin.addMainCategory);
        }

        const addSubTabBtn = document.getElementById('addSubTabBtn');
        if (addSubTabBtn) {
            addSubTabBtn.addEventListener('click', () => admin.addSubcategory(admin.state.activeMainCategory));
        }
    });

})(window.SimoonAdmin);