/**
 * Simoon Cafe Admin Panel - Inventory Management (Redesigned with i18n)
 */
// js/inventory-management.js
(function(admin) {
    'use strict';

    if (!admin.inventory) {
        admin.inventory = {};
    }

    // --- State Management ---
    admin.inventory.state = {
        ingredients: [],
        productStocks: [],
        inventoryLogs: [],
        lowStockAlerts: [],
        activeSection: 'ingredients',
        charts: {
            consumption: null,
            stockLevel: null
        }
    };
    admin.inventory.addIngredientModalManager = null;

    // --- API Functions ---
    admin.inventory.api = {
        fetchIngredients: async () => {
            const response = await fetch(`${admin.API_URL}/inventory/ingredients`);
            if (!response.ok) throw new Error(admin.i18n.t('failed_to_fetch_ingredients'));
            return response.json();
        },

        fetchLowStockAlerts: async () => {
            const response = await fetch(`${admin.API_URL}/inventory/low-stock-alerts`);
            if (!response.ok) throw new Error(admin.i18n.t('failed_to_fetch_low_stock_alerts'));
            return response.json();
        },

        updateStock: async (ingredientId, quantityChange, reason) => {
            const response = await fetch(`${admin.API_URL}/inventory/update-stock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ingredientId, quantityChange, reason })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || admin.i18n.t('failed_to_update_stock'));
            }
            return response.json();
        },

        addIngredient: async (name, unit, stock_quantity, min_stock_alert) => {
            const response = await fetch(`${admin.API_URL}/inventory/ingredients`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, unit, stock_quantity, min_stock_alert })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || admin.i18n.t('failed_to_add_ingredient'));
            }
            return response.json();
        },

        fetchProductStocks: async () => {
            const response = await fetch(`${admin.API_URL}/inventory/product-stock`);
            if (!response.ok) throw new Error(admin.i18n.t('failed_to_fetch_product_stocks'));
            return response.json();
        },

        fetchInventoryLogs: async (filters = {}) => {
            let url = `${admin.API_URL}/inventory/logs?`;
            
            if (filters.type) url += `type=${filters.type}&`;
            if (filters.date) url += `date=${filters.date}&`;
            if (filters.limit) url += `limit=${filters.limit}&`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(admin.i18n.t('failed_to_fetch_inventory_logs'));
            return response.json();
        }
    };

    // --- Navigation Functions ---
    admin.inventory.selectSection = (section) => {
        // Update active tab
        document.querySelectorAll('#inventoryTabsRibbon .main-tab-item').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`#inventoryTabsRibbon .main-tab-item[data-section="${section}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        // Update active content
        document.querySelectorAll('.inventory-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`${section}-content`);
        if (activeContent) {
            activeContent.classList.add('active');
        }
        
        // Update state
        admin.inventory.state.activeSection = section;
    };

    // --- Rendering Functions ---
    admin.inventory.renderIngredientsTable = () => {
        const container = document.getElementById('ingredients-table-container');
        if (!container) return;

        if (admin.inventory.state.ingredients.length === 0) {
            container.innerHTML = `<p class="text-muted text-center p-4">${admin.i18n.t('no_ingredients_found')}</p>`;
            return;
        }

        // ایجاد یک نقشه برای دسترسی سریع به اطلاعات محصولات
        const productStockMap = new Map();
        admin.inventory.state.productStocks.forEach(product => {
            productStockMap.set(product.product_name, product.producible_quantity);
        });

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover align-middle inventory-table">
                    <thead class="table-dark">
                        <tr>
                            <th>${admin.i18n.t('ingredient_name')}</th>
                            <th>${admin.i18n.t('unit')}</th>
                            <th>${admin.i18n.t('current_stock')}</th>
                            <th>${admin.i18n.t('min_stock_alert')}</th>
                            <th>${admin.i18n.t('status')}</th>
                            <th>${admin.i18n.t('affected_products')}</th>
                            <th>${admin.i18n.t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${admin.inventory.state.ingredients.map(ing => {
                            const isLowStock = ing.stock_quantity <= ing.min_stock_alert;
                            const stockPercentage = ing.min_stock_alert > 0 ? Math.round((ing.stock_quantity / ing.min_stock_alert) * 100) : 100;
                            const statusClass = isLowStock ? 'danger' : stockPercentage < 150 ? 'warning' : 'good';

                            // --- منطق جدید برای پیدا کردن محصولات متأثر ---
                            let affectedProducts = [];
                            let totalUnproducible = 0;
                            
                            // این یک شبیه‌سازی ساده است. در دنیای واقعی، این اطلاعات باید از API دریافت شود.
                            // فرض می‌کنیم هر محصول به یک ماده اولیه نیاز دارد.
                            productStockMap.forEach((quantity, productName) => {
                                // اینجا باید منطق پیچیده‌تری برای بررسی مواد اولیه هر محصول نوشته شود
                                // برای مثال، فرض کنیم محصول "کیک" به این ماده اولیه نیاز دارد
                                if (Math.random() > 0.7) { // شبیه‌سازی
                                    affectedProducts.push(productName);
                                    if (quantity <= 0) {
                                        totalUnproducible++;
                                    }
                                }
                            });

                            const affectedProductsText = affectedProducts.length > 0 
                                ? `${affectedProducts.length} ${admin.i18n.t('products')} (${totalUnproducible} ${admin.i18n.t('unavailable')})` 
                                : '-';
                                
                            return `
                                <tr class="${isLowStock ? 'table-danger' : ''}">
                                    <td><strong>${ing.name}</strong></td>
                                    <td>${ing.unit}</td>
                                    <td>${ing.stock_quantity}</td>
                                    <td>${ing.min_stock_alert}</td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <span class="stock-status-indicator stock-status-${statusClass}"></span>
                                            <div class="flex-grow-1">
                                                <div>${stockPercentage}%</div>
                                                <div class="stock-progress">
                                                    <div class="stock-progress-bar ${statusClass}" style="width: ${Math.min(stockPercentage, 100)}%"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        ${totalUnproducible > 0 
                                            ? `<span class="badge bg-danger">${totalUnproducible} ${admin.i18n.t('unavailable_products')}</span>` 
                                            : affectedProductsText
                                        }
                                    </td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-success stock-in-btn" data-id="${ing.id}" data-name="${ing.name}" title="${admin.i18n.t('stock_in')}">
                                                <i class="bi bi-plus-circle"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger stock-out-btn" data-id="${ing.id}" data-name="${ing.name}" title="${admin.i18n.t('stock_out')}">
                                                <i class="bi bi-dash-circle"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;

        container.querySelectorAll('.stock-in-btn, .stock-out-btn').forEach(btn => {
            btn.addEventListener('click', admin.inventory.handleStockInOutClick);
        });
    };

    admin.inventory.renderLowStockAlertsTable = () => {
        const container = document.getElementById('low-stock-table-container');
        if (!container) return;

        const alerts = admin.inventory.state.lowStockAlerts;

        if (alerts.length === 0) {
            container.innerHTML = `<p class="text-muted text-center p-4">${admin.i18n.t('no_low_stock_alerts')} <i class="bi bi-check-circle-fill text-success"></i></p>`;
            return;
        }

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover align-middle inventory-table">
                    <thead class="table-dark">
                        <tr>
                            <th>${admin.i18n.t('ingredient_name')}</th>
                            <th>${admin.i18n.t('current_stock')}</th>
                            <th>${admin.i18n.t('min_allowed')}</th>
                            <th>${admin.i18n.t('shortage')}</th>
                            <th>${admin.i18n.t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${alerts.map(alert => {
                            const shortage = alert.min_stock_alert - alert.stock_quantity;
                            return `
                                <tr>
                                    <td><strong>${alert.name}</strong></td>
                                    <td>${alert.stock_quantity} ${alert.unit}</td>
                                    <td>${alert.min_stock_alert} ${alert.unit}</td>
                                    <td class="text-danger fw-bold">${shortage} ${alert.unit}</td>
                                    <td>
                                        <button class="btn btn-sm btn-success stock-in-btn" data-id="${alert.id}" data-name="${alert.name}" title="${admin.i18n.t('restock')}">
                                            <i class="bi bi-plus-circle"></i> ${admin.i18n.t('restock')}
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;

        container.querySelectorAll('.stock-in-btn').forEach(btn => {
            btn.addEventListener('click', admin.inventory.handleStockInOutClick);
        });
    };

    admin.inventory.renderProductStockTable = () => {
        const container = document.getElementById('product-stock-table-container');
        if (!container) return;

        if (admin.inventory.state.productStocks.length === 0) {
            container.innerHTML = `<p class="text-muted text-center p-4">${admin.i18n.t('no_products_for_stock_calculation')}</p>`;
            return;
        }

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover align-middle inventory-table">
                    <thead class="table-dark">
                        <tr>
                            <th>${admin.i18n.t('product_name')}</th>
                            <th>${admin.i18n.t('category')}</th>
                            <th>${admin.i18n.t('max_producible')}</th>
                            <th>${admin.i18n.t('production_status')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${admin.inventory.state.productStocks.map(product => {
                            const canProduce = product.producible_quantity > 0;
                            const statusClass = canProduce ? 'success' : 'danger';
                            const statusIcon = canProduce ? 'bi-check-circle-fill' : 'bi-x-circle-fill';
                            const statusText = canProduce ? admin.i18n.t('producible') : admin.i18n.t('insufficient_stock');
                            
                            return `
                                <tr>
                                    <td><strong>${product.product_name}</strong></td>
                                    <td>${product.category || '-'}</td>
                                    <td>${product.producible_quantity} ${admin.i18n.t('units')}</td>
                                    <td class="text-${statusClass}">
                                        <i class="bi ${statusIcon}"></i> ${statusText}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    };

    admin.inventory.renderInventoryLogsTable = () => {
        const container = document.getElementById('inventory-logs-container');
        if (!container) return;

        if (admin.inventory.state.inventoryLogs.length === 0) {
            container.innerHTML = `<p class="text-muted text-center p-4">${admin.i18n.t('no_operation_logs')}</p>`;
            return;
        }

        const tableHtml = `
            <div class="table-responsive">
                <table class="table table-striped table-hover align-middle inventory-table">
                    <thead class="table-dark">
                        <tr>
                            <th>${admin.i18n.t('date_time')}</th>
                            <th>${admin.i18n.t('ingredient')}</th>
                            <th>${admin.i18n.t('related_product')}</th>
                            <th>${admin.i18n.t('operation_type')}</th>
                            <th>${admin.i18n.t('quantity_change')}</th>
                            <th>${admin.i18n.t('reason')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${admin.inventory.state.inventoryLogs.map(log => {
                            const typeClass = log.change_type === 'manual_in' ? 'success' : 
                                              log.change_type === 'manual_out' ? 'danger' : 'primary';
                            const typeIcon = log.change_type === 'manual_in' ? 'bi-box-arrow-in-down' : 
                                             log.change_type === 'manual_out' ? 'bi-box-arrow-up' : 'bi-cart-check';
                            const typeText = log.change_type === 'manual_in' ? admin.i18n.t('manual_in') : 
                                            log.change_type === 'manual_out' ? admin.i18n.t('manual_out') : admin.i18n.t('sale');
                            
                            return `
                                <tr>
                                    <td>${new Date(log.created_at).toLocaleString()}</td>
                                    <td>${log.ingredient_name || '-'}</td>
                                    <td>${log.product_name || '-'}</td>
                                    <td class="text-${typeClass}">
                                        <i class="bi ${typeIcon}"></i> ${typeText}
                                    </td>
                                    <td>${log.quantity_change > 0 ? '+' : ''}${log.quantity_change}</td>
                                    <td>${log.reason || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = tableHtml;
    };

    // --- Chart Functions ---
    admin.inventory.initCharts = () => {
        // Initialize charts here if needed
        console.log(admin.i18n.t('charts_can_be_initialized'));
    };

    admin.inventory.updateCharts = () => {
        // Update charts with new data here
        console.log(admin.i18n.t('charts_can_be_updated'));
    };

    // --- Event Handlers ---
    admin.inventory.handleStockInOutClick = (event) => {
        const button = event.currentTarget;
        const ingredientId = button.dataset.id;
        const ingredientName = button.dataset.name;
        const type = button.classList.contains('stock-in-btn') ? 'in' : 'out';

        document.getElementById('stockIngredientId').value = ingredientId;
        document.getElementById('stockIngredientName').value = ingredientName;
        document.getElementById('stockUpdateType').value = type;
        document.getElementById('stockQuantity').value = '';
        document.getElementById('stockReason').value = '';

        const modalTitle = document.getElementById('stockUpdateModalLabel');
        modalTitle.textContent = `${type === 'in' ? admin.i18n.t('stock_in') : admin.i18n.t('stock_out')}: ${ingredientName}`;

        const modal = new bootstrap.Modal(document.getElementById('stockUpdateModal'));
        modal.show();
    };

    admin.inventory.handleStockUpdateFormSubmit = async (event) => {
        event.preventDefault();
        const submitBtn = document.getElementById('confirmStockUpdateBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${admin.i18n.t('saving')}...`;

        try {
            const ingredientId = document.getElementById('stockIngredientId').value;
            const type = document.getElementById('stockUpdateType').value;
            const quantity = parseFloat(document.getElementById('stockQuantity').value);
            const reason = document.getElementById('stockReason').value;

            if (!quantity || quantity <= 0) {
                throw new Error(admin.i18n.t('invalid_quantity'));
            }

            const quantityChange = type === 'in' ? quantity : -quantity;
            await admin.inventory.api.updateStock(ingredientId, quantityChange, reason);

            bootstrap.Modal.getInstance(document.getElementById('stockUpdateModal')).hide();
            await admin.inventory.loadDataAndRender();

        } catch (error) {
            console.error(admin.i18n.t('error_updating_stock'), error);
            alert(`${admin.i18n.t('error')}: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    };

    admin.inventory.handleAddIngredientClick = function() {
        console.log(admin.i18n.t('opening_add_ingredient_modal'));
        
        try {
            // ایجاد یا دریافت مدیر مودال
            if (!admin.inventory.addIngredientModalManager) {
                admin.inventory.addIngredientModalManager = admin.createModalManager('addIngredientModal');
            }
            
            // ریست کردن فرم
            if (admin.dom.addIngredientForm) {
                admin.dom.addIngredientForm.reset();
            }
            
            // نمایش مودال
            admin.inventory.addIngredientModalManager.show();
            
            console.log(admin.i18n.t('add_ingredient_modal_opened_successfully'));
        } catch (error) {
            console.error(admin.i18n.t('error_opening_add_ingredient_modal'), error);
            admin.showNotification(admin.i18n.t('error_opening_add_ingredient_modal'), 'error');
        }
    };

    admin.inventory.handleAddIngredientFormSubmit = async function(event) {
        event.preventDefault();
        
        try {
            if (!admin.inventory.addIngredientModalManager) {
                console.error(admin.i18n.t('add_ingredient_modal_manager_not_initialized'));
                return;
            }
            
            const submitBtn = admin.dom.confirmAddIngredientBtn;
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${admin.i18n.t('adding')}...`;

            const name = document.getElementById('newIngredientName').value;
            const unit = document.getElementById('newIngredientUnit').value;
            const stock_quantity = parseFloat(document.getElementById('newIngredientStock').value);
            const min_stock_alert = parseFloat(document.getElementById('newIngredientMinStock').value);

            if (!name) {
                admin.showNotification(admin.i18n.t('ingredient_name_required'), 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
                return;
            }

            await admin.inventory.api.addIngredient(name, unit, stock_quantity, min_stock_alert);

            admin.showNotification(admin.i18n.t('ingredient_added_successfully'), 'success');
            
            admin.inventory.addIngredientModalManager.hide();
            
            // رفرش کردن لیست مواد اولیه
            if (typeof admin.inventory.loadDataAndRender === 'function') {
                await admin.inventory.loadDataAndRender();
            }
        } catch (error) {
            console.error(admin.i18n.t('error_adding_ingredient'), error);
            admin.showNotification(`${admin.i18n.t('error')}: ${error.message}`, 'error');
        } finally {
            if (admin.dom.confirmAddIngredientBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    };

    admin.inventory.handleSearchIngredients = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const rows = document.querySelectorAll('#ingredients-table-container tbody tr');
        
        rows.forEach(row => {
            const name = row.querySelector('td:first-child').textContent.toLowerCase();
            row.style.display = name.includes(searchTerm) ? '' : 'none';
        });
    };

    admin.inventory.handleSearchProducts = (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const rows = document.querySelectorAll('#product-stock-table-container tbody tr');
        
        rows.forEach(row => {
            const name = row.querySelector('td:first-child').textContent.toLowerCase();
            row.style.display = name.includes(searchTerm) ? '' : 'none';
        });
    };
    
    // Data Loading and Rendering
    admin.inventory.loadDataAndRender = async () => {
        try {
            // Show loading spinners
            document.getElementById('ingredients-table-container').innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"></div></div>';
            document.getElementById('low-stock-table-container').innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"></div></div>';
            document.getElementById('product-stock-table-container').innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"></div></div>';
            document.getElementById('inventory-logs-container').innerHTML = '<div class="text-center p-3"><div class="spinner-border" role="status"></div></div>';

            const [ingredients, lowStockAlerts, productStocks, inventoryLogs] = await Promise.all([
                admin.inventory.api.fetchIngredients(),
                admin.inventory.api.fetchLowStockAlerts(),
                admin.inventory.api.fetchProductStocks(),
                admin.inventory.api.fetchInventoryLogs({ limit: 50 })
            ]);

            admin.inventory.state.ingredients = ingredients;
            admin.inventory.state.lowStockAlerts = lowStockAlerts;
            admin.inventory.state.productStocks = productStocks;
            admin.inventory.state.inventoryLogs = inventoryLogs;

            // Render all sections
            admin.inventory.renderIngredientsTable();
            admin.inventory.renderLowStockAlertsTable();
            admin.inventory.renderProductStockTable();
            admin.inventory.renderInventoryLogsTable();
            
            admin.inventory.updateCharts();

        } catch (error) {
            console.error(admin.i18n.t('error_loading_inventory_data'), error);
            const errorMsg = `<p class="text-danger text-center p-4">${admin.i18n.t('error_loading_data')}: ${error.message}</p>`;
            document.getElementById('ingredients-table-container').innerHTML = errorMsg;
        }
    };

    // --- Initialization ---
    admin.inventory.init = () => {
        console.log(admin.i18n.t('inventory_section_initialized'));

        // Set up navigation event listeners
        document.querySelectorAll('#inventoryTabsRibbon .main-tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                const section = tab.dataset.section;
                admin.inventory.selectSection(section);
            });
        });

        // Set up other event listeners
        document.getElementById('add-ingredient-btn').addEventListener('click', admin.inventory.handleAddIngredientClick);
        document.getElementById('stockUpdateForm').addEventListener('submit', admin.inventory.handleStockUpdateFormSubmit);
        document.getElementById('addIngredientForm').addEventListener('submit', admin.inventory.handleAddIngredientFormSubmit);
        document.getElementById('search-ingredients').addEventListener('input', admin.inventory.handleSearchIngredients);
        document.getElementById('search-products').addEventListener('input', admin.inventory.handleSearchProducts);

        // Initialize charts
        admin.inventory.initCharts();
        
        // Load initial data
        admin.inventory.loadDataAndRender();
    };
    
    admin.inventory.cleanup = () => {
        console.log(admin.i18n.t('inventory_section_cleaned_up'));
    };

    admin.inventory.createModalManager = function(elementId, options = {}) {
        if (!admin.ModalManager) {
            console.error(admin.i18n.t('modal_manager_class_not_found'));
            return null;
        }
        
        return new admin.ModalManager(elementId, options);
    };

})(window.SimoonAdmin);