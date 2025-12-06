/**
 * Simoon Cafe Admin Panel - Category Management (Updated for ID-based logic)
 */
(function(admin) {
    'use strict';

    admin.fetchCategoriesAndSubcategories = async function() {
        console.log('\n\n===== 📁 [ADMIN] Starting category extraction =====');
        
        try {
            console.log('📡 Requesting custom categories from server...');
            const customResponse = await fetch(`${admin.API_URL}/admin/custom-categories`);
            
            if (!customResponse.ok) {
                const errorText = await customResponse.text();
                throw new Error(`Server Error: ${customResponse.status} ${customResponse.statusText}. Response: ${errorText}`);
            }
            
            const customData = await customResponse.json();
            console.log('✅ Custom categories received:', customData);

            const mainCategories = customData.filter(item => item.type === 'category' && item.name != null);
            const subcategories = customData.filter(item => item.type === 'subcategory' && item.name != null && item.parent_category_name != null);

            // !!! بخش کلیدی: state را با آبجکت‌های کامل {id, name} بازنویسی کنید
            admin.state.allCategories = mainCategories.map(cat => ({ id: cat.id, name: cat.name }));
            
            admin.state.subcategoriesByCategory = {};
            subcategories.forEach(item => {
                // کلید باید ID دسته‌بندی والد باشد، نه نام آن
                if (!admin.state.subcategoriesByCategory[item.parent_category_id]) {
                    admin.state.subcategoriesByCategory[item.parent_category_id] = [];
                }
                admin.state.subcategoriesByCategory[item.parent_category_id].push({ 
                    id: item.id, 
                    name: item.name 
                });
            });

            // مرتب‌سازی زیردسته‌ها بر اساس نام
            for (const catId in admin.state.subcategoriesByCategory) {
                admin.state.subcategoriesByCategory[catId].sort((a, b) => a.name.localeCompare(b.name));
            }

            // اضافه کردن تب Special در صورت وجود محصول ویژه
            const hasSpecialProducts = admin.state.products.some(p => p.is_special === true);
            if (hasSpecialProducts && !admin.state.allCategories.some(cat => cat.name === 'Special')) {
                admin.state.allCategories.push({ id: 'special', name: 'Special' }); // Use a unique ID for 'Special'
            } else if (!hasSpecialProducts) {
                admin.state.allCategories = admin.state.allCategories.filter(cat => cat.name !== 'Special');
            }
            
            console.log('✅ All main categories:', admin.state.allCategories);
            console.log('📊 Subcategory structure:', admin.state.subcategoriesByCategory);

            admin.populateCategoryDropdowns();
            admin.renderMainTabs();
            console.log('===== 📁 [ADMIN] Category extraction complete =====\n\n');
        } catch (error) {
            console.error('!!! ERROR in fetchCategoriesAndSubcategories !!!', error.message);
            admin.showNotification('Error fetching categories! See console for details.', 'error');
        }
    };

    admin.renderMainTabs = function() {
        console.log('--- Rendering main tabs ribbon ---');
        const mainTabsRibbon = document.getElementById('mainTabsRibbon');
        mainTabsRibbon.innerHTML = '';
        
        admin.state.allCategories.forEach((categoryObj) => {
            if (!categoryObj || !categoryObj.name) {
                console.warn('Skipping undefined category in renderMainTabs');
                return;
            }
            const { id, name } = categoryObj;

            const tabItem = document.createElement('div');
            tabItem.className = `main-tab-item ${name === admin.state.activeMainCategory ? 'active' : ''}`;
            
            if (name === 'Special') {
                tabItem.classList.add('special-tab');
            }
            
            const tabButton = document.createElement('button');
            tabButton.className = `main-tab-btn`;
            tabButton.setAttribute('data-category-id', id); // استفاده از id
            tabButton.setAttribute('data-category-name', name); // نام را هم برای نمایش نگه داریم
            
            if (name === 'Special') {
                tabButton.innerHTML = '<i class="bi bi-star-fill"></i> Special';
            } else {
                tabButton.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            }
            
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'tab-actions';

            if (name !== 'Special') {
                const editButton = document.createElement('button');
                editButton.className = 'edit-tab-btn';
                editButton.setAttribute('data-category-id', id); // استفاده از id
                editButton.setAttribute('data-category-name', name); // استفاده از name
                editButton.innerHTML = `<i class="bi bi-pencil"></i>`;
                editButton.title = 'Edit Category';

                const deleteButton = document.createElement('button');
                deleteButton.className = 'delete-tab-btn';
                deleteButton.setAttribute('data-category-id', id); // استفاده از id
                deleteButton.setAttribute('data-category-name', name); // استفاده از name
                deleteButton.innerHTML = `<i class="bi bi-trash"></i>`;
                deleteButton.title = 'Delete Category';

                actionsContainer.appendChild(editButton);
                actionsContainer.appendChild(deleteButton);
            }
            
            tabItem.appendChild(tabButton);
            tabItem.appendChild(actionsContainer);
            mainTabsRibbon.appendChild(tabItem);
        });
        
        // --- بخش کلیدی: اضافه کردن event listeners به صورت یکجا و با استفاده از event delegation ---
        mainTabsRibbon.addEventListener('click', function(e) {
            const target = e.target;
            const mainTabBtn = target.closest('.main-tab-btn');
            const editTabBtn = target.closest('.edit-tab-btn');
            const deleteTabBtn = target.closest('.delete-tab-btn');

            if (mainTabBtn) {
                const categoryName = mainTabBtn.getAttribute('data-category-name');
                admin.selectMainCategory(categoryName);
            } else if (editTabBtn) {
                e.stopPropagation();
                const categoryName = editTabBtn.getAttribute('data-category-name');
                admin.startInlineEditCategory(categoryName);
            } else if (deleteTabBtn) {
                e.stopPropagation();
                const categoryName = deleteTabBtn.getAttribute('data-category-name');
                admin.confirmDeleteCategory(categoryName);
            }
        });
        
        console.log('✅ Main tabs ribbon rendered successfully.');
    };

    admin.selectMainCategory = function(categoryName) {
        console.log(`--- Selecting main category: ${categoryName} ---`);
        
        if (admin.state.activeMainCategory === categoryName) {
            console.log('Category already selected, skipping re-render');
            return;
        }
        
        document.querySelectorAll('.main-tab-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeTabButton = document.querySelector(`.main-tab-btn[data-category-name="${categoryName}"]`);
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
        
        admin.state.activeMainCategory = categoryName;
        admin.state.activeSubCategory = null;
        admin.renderContentArea();
    };

    admin.renderContentArea = function() {
        console.log('--- Rendering content area (sub-tabs and products) ---');
        
        if (!admin.state.activeMainCategory) {
            admin.dom.contentArea.innerHTML = '<div class="text-center text-muted p-4">Please select a category.</div>';
            const subTabsRibbon = document.getElementById('subTabsRibbon');
            if (subTabsRibbon) subTabsRibbon.innerHTML = '';
            return;
        }
        
        if (admin.state.activeMainCategory === 'Special') {
            admin.toggleSpecialCarouselManagement(true);
            admin.renderSpecialSlidesManagement();
            const subTabsRibbon = document.getElementById('subTabsRibbon');
            if (subTabsRibbon) subTabsRibbon.innerHTML = '';
            return; 
        } else {
            admin.toggleSpecialCarouselManagement(false);
        }

        // پیدا کردن ID دسته‌بندی فعال
        const activeCategoryObj = admin.state.allCategories.find(cat => cat.name === admin.state.activeMainCategory);
        const activeCategoryId = activeCategoryObj ? activeCategoryObj.id : null;
        
        const subcategories = admin.state.subcategoriesByCategory[activeCategoryId] || [];
        
        const subTabsRibbon = document.getElementById('subTabsRibbon');
        if (!subTabsRibbon) {
            console.error("!!! [ERROR] #subTabsRibbon not found in the DOM. Check your HTML structure.");
            return;
        }
        subTabsRibbon.innerHTML = '';
        
        subcategories.forEach((subcategoryObj) => {
            if (!subcategoryObj || !subcategoryObj.name) {
                console.warn('Skipping invalid subcategory in renderContentArea', subcategoryObj);
                return;
            }
            const { id, name } = subcategoryObj;

            const subTabItem = document.createElement('div');
            subTabItem.className = `sub-tab-item ${name === admin.state.activeSubCategory ? 'active' : ''}`;
            
            const subTabButton = document.createElement('button');
            subTabButton.className = `sub-tab-btn`;
            subTabButton.setAttribute('data-subcategory-id', id); // استفاده از id
            subTabButton.setAttribute('data-subcategory-name', name); // استفاده از name
            subTabButton.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'tab-actions';

            const editButton = document.createElement('button');
            editButton.className = 'edit-tab-btn';
            editButton.setAttribute('data-subcategory-id', id); // استفاده از id
            editButton.setAttribute('data-subcategory-name', name); // استفاده از name
            editButton.innerHTML = `<i class="bi bi-pencil"></i>`;
            editButton.title = 'Edit Subcategory';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-tab-btn';
            deleteButton.setAttribute('data-subcategory-id', id); // استفاده از id
            deleteButton.setAttribute('data-subcategory-name', name); // استفاده از name
            deleteButton.innerHTML = `<i class="bi bi-trash"></i>`;
            deleteButton.title = 'Delete Subcategory';

            actionsContainer.appendChild(editButton);
            actionsContainer.appendChild(deleteButton);
            
            subTabItem.appendChild(subTabButton);
            subTabItem.appendChild(actionsContainer);
            subTabsRibbon.appendChild(subTabItem);
        });
        
        const productsContainer = document.createElement('div');
        productsContainer.className = 'products-container';
        productsContainer.innerHTML = admin.renderProductsBySubCategory();
        
        admin.dom.contentArea.innerHTML = ''; 
        admin.dom.contentArea.appendChild(productsContainer);
        
        // --- بخش کلیدی: استفاده از event delegation برای sub-tabs و products ---
        subTabsRibbon.addEventListener('click', function(e) {
            const target = e.target;
            const subTabBtn = target.closest('.sub-tab-btn');
            const editSubTabBtn = target.closest('.sub-tab-item .edit-tab-btn');
            const deleteSubTabBtn = target.closest('.sub-tab-item .delete-tab-btn');

            if (subTabBtn) {
                const subcategoryName = subTabBtn.getAttribute('data-subcategory-name');
                admin.selectSubCategory(subcategoryName);
            } else if (editSubTabBtn) {
                e.stopPropagation();
                const subcategoryName = editSubTabBtn.getAttribute('data-subcategory-name');
                admin.startInlineEditSubcategory(admin.state.activeMainCategory, subcategoryName);
            } else if (deleteSubTabBtn) {
                e.stopPropagation();
                const subcategoryName = deleteSubTabBtn.getAttribute('data-subcategory-name');
                admin.confirmDeleteSubcategory(admin.state.activeMainCategory, subcategoryName);
            }
        });

        productsContainer.addEventListener('click', function(e) {
            const target = e.target;
            const productCard = target.closest('.product-card');
            const addProductCard = target.closest('.add-product-card');

            if (productCard) {
                admin.openEditProductModal(productCard.getAttribute('data-product-id'));
            } else if (addProductCard) {
                const categoryName = addProductCard.getAttribute('data-category-name');
                const subcategoryName = addProductCard.getAttribute('data-subcategory-name') || '';
                admin.openAddProductModal(categoryName, subcategoryName);
            }
        });
    };

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
                                    <span class="badge bg-secondary">${product.category_name || 'N/A'}</span>
                                    <span class="product-price">$${product.price}</span>
                                </div>
                                <div class="product-stock">
                                    <small class="text-muted">Stock: ${product.stock_quantity || 0}</small>
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

    admin.selectSubCategory = function(subcategoryName) {
        console.log(`--- Selecting subcategory: ${subcategoryName} ---`);
        
        if (admin.state.activeSubCategory === subcategoryName) {
            console.log('Subcategory already selected, skipping re-render');
            return;
        }
        
        document.querySelectorAll('.sub-tab-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeSubTabButton = document.querySelector(`.sub-tab-btn[data-subcategory-name="${subcategoryName}"]`);
        if (activeSubTabButton) {
            activeSubTabButton.closest('.sub-tab-item').classList.add('active');
        }
        
        admin.state.activeSubCategory = subcategoryName;
        
        // فقط productsContainer را به‌روز کنید
        const productsContainer = document.querySelector('.products-container');
        if (productsContainer) {
            productsContainer.innerHTML = admin.renderProductsBySubCategory();
        }
    };

    admin.renderProductsBySubCategory = function() {
        // پیدا کردن ID دسته‌بندی و زیردسته فعال
        const activeCategoryObj = admin.state.allCategories.find(cat => cat.name === admin.state.activeMainCategory);
        const activeCategoryId = activeCategoryObj ? activeCategoryObj.id : null;

        let activeSubcategoryId = null;
        if (admin.state.activeSubCategory) {
            const subcategories = admin.state.subcategoriesByCategory[activeCategoryId] || [];
            const activeSubObj = subcategories.find(sub => sub.name === admin.state.activeSubCategory);
            activeSubcategoryId = activeSubObj ? activeSubObj.id : null;
        }

        let categoryProducts = [];
        
        if (activeSubcategoryId) {
            categoryProducts = admin.state.products.filter(p => 
                p.category_id === activeCategoryId && p.sub_category_id === activeSubcategoryId
            );
        } else {
            categoryProducts = admin.state.products.filter(p => p.category_id === activeCategoryId);
        }
        
        console.log(`Found ${categoryProducts.length} products for category: ${admin.state.activeMainCategory}, subcategory: ${admin.state.activeSubCategory}`);
        
        let html = '<div class="row g-3">';
        
        html += `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="add-product-card" data-category-id="${activeCategoryId}" data-category-name="${admin.state.activeMainCategory}" data-subcategory-name="${admin.state.activeSubCategory || ''}">
                    <i class="bi bi-plus-circle-fill add-icon"></i>
                    <div class="add-text">Add new product</div>
                </div>
            </div>
        `;
        
        if (categoryProducts.length === 0) {
            html += '</div>';
            console.log('No products found, returning empty HTML');
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
                                <span class="badge bg-secondary">${product.sub_category_name || 'N/A'}</span>
                                <span class="product-price">$${product.price}</span>
                            </div>
                            <div class="product-stock">
                                <small class="text-muted">Stock: ${product.stock_quantity || 0}</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        console.log('Generated HTML for products:', html);
        return html;
    };

    admin.populateCategoryDropdowns = function() {
        console.log('--- Populating category dropdowns ---');
        admin.dom.category.innerHTML = '<option value="">Select...</option>';
        admin.state.allCategories.forEach(cat => {
            if (cat.name === 'Special' || !cat.name) return; // MODIFIED: Skip 'Special' category
            const option = document.createElement('option');
            option.value = cat.id; // value باید id باشد
            option.textContent = cat.name.charAt(0).toUpperCase() + cat.name.slice(1);
            admin.dom.category.appendChild(option);
        });

        admin.dom.parentCategory.innerHTML = '<option value="">Select main category...</option>';
        admin.state.allCategories.forEach(cat => {
            if (cat.name === 'Special' || !cat.name) return; // MODIFIED: Skip 'Special' category
            const option = document.createElement('option');
            option.value = cat.id; // value باید id باشد
            option.textContent = cat.name.charAt(0).toUpperCase() + cat.name.slice(1);
            admin.dom.parentCategory.appendChild(option);
        });
        console.log('✅ Category dropdowns populated.');
    };

    // --- Inline Edit Functions ---
    admin.startInlineEditCategory = function(categoryName) {
        console.log(`Starting inline edit for category: ${categoryName}`);
        
        const tabButton = document.querySelector(`.main-tab-btn[data-category-name="${categoryName}"]`);
        const tabItem = tabButton ? tabButton.closest('.main-tab-item') : null;
        
        if (!tabButton || !tabItem) return;
        
        const currentText = tabButton.textContent.trim();
        
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
                // به‌روزرسانی state محلی
                const index = admin.state.allCategories.findIndex(cat => cat.name === oldName);
                if (index !== -1) {
                    admin.state.allCategories[index].name = newName.trim();
                }
                
                if (admin.state.activeMainCategory === oldName) {
                    admin.state.activeMainCategory = newName.trim();
                }
                
                if (admin.state.subcategoriesByCategory[oldName]) {
                    // این بخش نیازی به تغییر ندارد چون کلیدها ID هستند
                    admin.state.subcategoriesByCategory[newName.trim()] = admin.state.subcategoriesByCategory[oldName];
                    delete admin.state.subcategoriesByCategory[oldName];
                }
                
                admin.state.products.forEach(product => {
                    // این بخش هم نیازی به تغییر ندارد چون ما با ID کار می‌کنیم
                    // و نام فقط برای نمایش است.
                    if (product.category_name === oldName) {
                        product.category_name = newName.trim();
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

        const categoryObj = admin.state.allCategories.find(cat => cat.name === categoryName);
        const id = categoryObj ? categoryObj.id : null;

        const originalHtml = `
            <button class="main-tab-btn ${admin.state.activeMainCategory === categoryName ? 'active' : ''}" data-category-id="${id}" data-category-name="${categoryName}">${originalText}</button>
            <div class="tab-actions">
                <button class="edit-tab-btn" data-category-id="${id}" data-category-name="${categoryName}" title="Edit Category"><i class="bi bi-pencil"></i></button>
                <button class="delete-tab-btn" data-category-id="${id}" data-category-name="${categoryName}" title="Delete Category"><i class="bi bi-trash"></i></button>
            </div>
        `;
        
        tabItem.innerHTML = originalHtml;
    };
    
    // Subcategory inline edit functions
    admin.startInlineEditSubcategory = function(parentCategory, subcategoryName) {
        console.log(`Starting inline edit for subcategory: ${subcategoryName} in category: ${parentCategory}`);
        
        const tabButton = document.querySelector(`.sub-tab-btn[data-subcategory-name="${subcategoryName}"]`);
        const tabItem = tabButton ? tabButton.closest('.sub-tab-item') : null;
        
        if (!tabButton || !tabItem) return;
        
        const currentText = tabButton.textContent.trim();
        
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
            // برای پیدا کردن ID، باید آبجکت را بر اساس نام پیدا کنید
            const parentCategoryObj = admin.state.allCategories.find(cat => cat.name === parentCategory);
            const subcategories = admin.state.subcategoriesByCategory[parentCategoryObj.id] || [];
            const subcategoryObj = subcategories.find(sub => sub.name === oldName);

            if (!subcategoryObj || !subcategoryObj.id) {
                admin.showNotification('Error: Could not find the ID of the subcategory to update.', 'error');
                return;
            }

            // حالا از ID برای ارسال درخواست PUT استفاده کنید
            const response = await fetch(`${admin.API_URL}/admin/subcategories/${subcategoryObj.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName.trim(), 
                    type: 'subcategory',
                    parent_category_id: parentCategoryObj.id
                })
            });
            
            if (response.ok) {
                // به‌روزرسانی state محلی
                const index = subcategories.findIndex(sub => sub.name === oldName);
                if (index !== -1) {
                    subcategories[index].name = newName.trim();
                }
                
                if (admin.state.activeSubCategory === oldName) {
                    admin.state.activeSubCategory = newName.trim();
                }
                
                admin.state.products.forEach(product => {
                    if (product.sub_category_name === oldName) {
                        product.sub_category_name = newName.trim();
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
        
        const subcategoryObj = Array.from(Object.values(admin.state.subcategoriesByCategory)).flat().find(sub => sub.name === subcategoryName);
        const id = subcategoryObj ? subcategoryObj.id : null;

        const originalHtml = `
            <button class="sub-tab-btn ${admin.state.activeSubCategory === subcategoryName ? 'active' : ''}" data-subcategory-id="${id}" data-subcategory-name="${subcategoryName}">${originalText}</button>
            <div class="tab-actions">
                <button class="edit-tab-btn" data-subcategory-id="${id}" data-subcategory-name="${subcategoryName}" title="Edit Subcategory"><i class="bi bi-pencil"></i></button>
                <button class="delete-tab-btn" data-subcategory-id="${id}" data-subcategory-name="${subcategoryName}" title="Delete Subcategory"><i class="bi bi-trash"></i></button>
            </div>
        `;
        
        tabItem.innerHTML = originalHtml;
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
        
        const newConfirmOkBtn = confirmOkBtn.cloneNode(true);
        const newConfirmCancelBtn = confirmCancelBtn.cloneNode(true);
        confirmOkBtn.parentNode.replaceChild(newConfirmOkBtn, confirmOkBtn);
        confirmCancelBtn.parentNode.replaceChild(newConfirmCancelBtn, confirmCancelBtn);
        
        confirmMessage.textContent = message;
        
        if (options.title) {
            confirmModalLabel.textContent = options.title;
        } else {
            confirmModalLabel.textContent = 'Confirm Action';
        }
        
        if (options.okText) {
            newConfirmOkBtn.textContent = options.okText;
        } else {
            newConfirmOkBtn.textContent = 'Delete';
        }
        
        if (options.okClass) {
            newConfirmOkBtn.className = `btn ${options.okClass}`;
        } else {
            newConfirmOkBtn.className = 'btn btn-danger';
        }
        
        const modal = new bootstrap.Modal(confirmModal);
        
        const handleConfirm = function() {
            modal.hide();
            onConfirm();
        };
        
        const handleCancel = function() {
            modal.hide();
        };
        
        newConfirmOkBtn.addEventListener('click', handleConfirm);
        newConfirmCancelBtn.addEventListener('click', handleCancel);
        
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
            const parentCategoryObj = admin.state.allCategories.find(cat => cat.name === parentCategory);
            if (parentCategoryObj) {
                admin.dom.parentCategory.value = parentCategoryObj.id;
            }
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
        
        const parentCategoryObj = admin.state.allCategories.find(cat => cat.name === parentCategory);
        if(parentCategoryObj) {
            admin.dom.parentCategory.value = parentCategoryObj.id;
        }

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
        console.log(`--- [DELETE] Confirming delete for subcategory: "${subcategoryName}" in category "${parentCategory}" ---`);
        
        const parentCategoryObj = admin.state.allCategories.find(cat => cat.name === parentCategory);
        if(!parentCategoryObj) {
            admin.showNotification('Parent category not found!', 'error');
            return;
        }
        const subcategories = admin.state.subcategoriesByCategory[parentCategoryObj.id] || [];
        const subcategoryToDelete = subcategories.find(sub => sub.name === subcategoryName);

        if (!subcategoryToDelete || !subcategoryToDelete.id) {
            admin.showNotification('Error: Could not find ID of the subcategory to delete.', 'error');
            console.error(`[DELETE] Subcategory ID not found for: "${subcategoryName}"`);
            return;
        }

        admin.showConfirmDialog(
            `Are you sure you want to delete subcategory "${subcategoryName}"? This will also delete all products in this subcategory.`,
            () => {
                admin.deleteSubcategory(parentCategory, subcategoryToDelete.id);
            },
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
            let url;
            let body;

            if (!admin.state.currentEditingId && categoryTypeValue === 'subcategory') {
                console.log('--- [SAVE CATEGORY] Logic: Creating NEW SUBCATEGORY ---');
                
                const existingSubcategories = admin.state.subcategoriesByCategory[parentCategoryValue] || [];
                const isDuplicate = existingSubcategories.some(sub => sub.name.toLowerCase() === categoryNameValue.toLowerCase());
                
                if (isDuplicate) {
                    admin.showNotification(`Error: A subcategory with the name "${categoryNameValue}" already exists.`, 'error');
                    return;
                }
                
                url = `${admin.API_URL}/admin/subcategories`;
                body = { 
                    name: categoryNameValue,
                    parent_category_id: parentCategoryValue
                };
            } 
            else if (admin.state.currentEditingId && categoryTypeValue === 'subcategory') {
                console.log('--- [SAVE CATEGORY] Logic: EDITING EXISTING SUBCATEGORY ---');
                
                const parentCategoryObj = admin.state.allCategories.find(cat => cat.id === parentCategoryValue);
                const subcategories = admin.state.subcategoriesByCategory[parentCategoryValue] || [];
                const subcategoryObj = subcategories.find(sub => sub.name === admin.state.currentEditingId);

                if (!subcategoryObj || !subcategoryObj.id) {
                    admin.showNotification('Error: Could not find the ID of the subcategory to update.', 'error');
                    return;
                }

                const isDuplicate = subcategories.some(sub => 
                    sub.name.toLowerCase() === categoryNameValue.toLowerCase() && sub.name !== admin.state.currentEditingId
                );
                
                if (isDuplicate) {
                    admin.showNotification(`Error: A subcategory with the name "${categoryNameValue}" already exists.`, 'error');
                    return;
                }

                url = `${admin.API_URL}/admin/subcategories/${subcategoryObj.id}`;
                body = { 
                    name: categoryNameValue,
                    parent_category_id: parentCategoryValue
                };
            }
            else {
                console.log('--- [SAVE CATEGORY] Logic: Creating/Editing MAIN CATEGORY ---');
                url = admin.state.currentEditingId 
                    ? `${admin.API_URL}/admin/categories/${admin.state.currentEditingId}` 
                    : `${admin.API_URL}/admin/categories`;
                
                body = { 
                    name: categoryNameValue, 
                    type: categoryTypeValue, 
                    image: categoryImageValue, 
                    description: categoryDescriptionValue 
                };
            }
            
            const method = admin.state.currentEditingId ? 'PUT' : 'POST';
            response = await fetch(url, { 
                method: method, 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(body) 
            });

            const data = await response.json();

            if (response.ok) {
                const typeText = categoryTypeValue === 'category' ? 'Category' : 'Subcategory';
                const actionText = admin.state.currentEditingId ? 'updated' : 'added';
                admin.showNotification(`${typeText} "${categoryNameValue}" has been successfully ${actionText}.`, 'success');
                
                if (!admin.state.currentEditingId && categoryTypeValue === 'subcategory') {
                    if (!admin.state.subcategoriesByCategory[parentCategoryValue]) {
                        admin.state.subcategoriesByCategory[parentCategoryValue] = [];
                    }
                    admin.state.subcategoriesByCategory[parentCategoryValue].push(data);
                    admin.state.subcategoriesByCategory[parentCategoryValue].sort((a, b) => a.name.localeCompare(b.name));
                    admin.renderContentArea();
                } else {
                    admin.dom.categoryModal.addEventListener('hidden.bs.modal', async function () {
                        await admin.fetchCategoriesAndSubcategories();
                        admin.renderMainTabs();
                        
                        if (!admin.state.currentEditingId && categoryTypeValue === 'category') {
                            admin.selectMainCategory(categoryNameValue);
                        } 
                        else if (!admin.state.currentEditingId && categoryTypeValue === 'subcategory') {
                            const parentCategoryObj = admin.state.allCategories.find(cat => cat.id === parentCategoryValue);
                            if(parentCategoryObj) {
                                admin.selectMainCategory(parentCategoryObj.name);
                            }
                        }
                        
                        if (admin.state.activeMainCategory) admin.renderContentArea();
                        
                        try { 
                            await fetch(`${admin.API_URL}/notify-category-update`, { 
                                method: 'POST', 
                                headers: { 'Content-Type': 'application/json' }, 
                                body: JSON.stringify({ action: 'refresh' }) 
                            }); 
                        } catch (e) { 
                            console.error('Notify error', e); 
                        }
                    }, { once: true });
                }

                const modal = bootstrap.Modal.getInstance(admin.dom.categoryModal);
                if (modal) {
                    modal.hide();
                    admin.dom.categoryForm.reset();
                    admin.state.currentEditingId = null;
                    admin.state.currentEditingType = null;
                }
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

        try {
            const response = await fetch(`${admin.API_URL}/admin/categories/${encodeURIComponent(categoryToDelete)}`, { 
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                admin.showNotification(`Category "${categoryToDelete}" and all its data have been deleted.`, 'success');
                
                const deletedIndex = admin.state.allCategories.findIndex(cat => cat.name === categoryToDelete);
                admin.state.allCategories = admin.state.allCategories.filter(cat => cat.name !== categoryToDelete);
                delete admin.state.subcategoriesByCategory[categoryToDelete];
                admin.state.products = admin.state.products.filter(p => p.category_name !== categoryToDelete);

                let categoryToSelect = null;
                if (admin.state.activeMainCategory === categoryToDelete) {
                    admin.state.activeMainCategory = null;
                    admin.state.activeSubCategory = null;
                    if (admin.state.allCategories.length > 0) {
                        if (deletedIndex < admin.state.allCategories.length) {
                            categoryToSelect = admin.state.allCategories[deletedIndex].name;
                        } else {
                            categoryToSelect = admin.state.allCategories[deletedIndex - 1].name;
                        }
                    }
                }
                
                admin.renderMainTabs();
                if (categoryToSelect) {
                    admin.selectMainCategory(categoryToSelect);
                } else if (admin.state.activeMainCategory === null) {
                    admin.dom.contentArea.innerHTML = '<div class="text-center text-muted p-4">No categories available. Add a new one to get started.</div>';
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

    admin.deleteSubcategory = async function(parentCategory, subcategoryId) {
        const parentCategoryObj = admin.state.allCategories.find(cat => cat.name === parentCategory);
        if(!parentCategoryObj) {
            admin.showNotification('Parent category not found!', 'error');
            return;
        }

        try {
            const subcategories = admin.state.subcategoriesByCategory[parentCategoryObj.id] || [];
            const subcategoryExists = subcategories.some(sub => sub.id === subcategoryId);
            
            if (!subcategoryExists) {
                console.error(`Subcategory with ID ${subcategoryId} not found in local state`);
                admin.showNotification(`Subcategory not found in local state. Refreshing data...`, 'warning');
                await admin.fetchCategoriesAndSubcategories();
                return;
            }
            
            const response = await fetch(`${admin.API_URL}/admin/subcategories/${subcategoryId}`, { 
                method: 'DELETE', 
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                admin.showNotification(`Subcategory has been successfully deleted.`, 'success');
                
                admin.state.subcategoriesByCategory[parentCategoryObj.id] = subcategories.filter(sub => sub.id !== subcategoryId);
                admin.state.products = admin.state.products.filter(p => p.sub_category_id !== subcategoryId);

                if (admin.state.activeSubCategory && admin.state.subcategoriesByCategory[parentCategoryObj.id].some(sub => sub.name === admin.state.activeSubCategory)) {
                     admin.state.activeSubCategory = null;
                }
                
                admin.renderContentArea();
                
            } else {
                const errorData = await response.json();
                admin.showNotification(`Error deleting subcategory: ${errorData.message}`, 'error');
                
                if (response.status === 404) {
                    console.log('Subcategory not found on server. Refreshing data...');
                    await admin.fetchCategoriesAndSubcategories();
                }
            }
        } catch (error) {
            console.error('!!! ERROR in deleteSubcategory !!!', error.message);
            admin.showNotification('Error communicating with server!', 'error');
        }
    };

    // --- Event Listeners for Add Buttons ---
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