/**
 * Simoon Cafe Admin Panel - Products Table Management
 */
(function(admin) {
    'use strict';

    // State for products table management
    admin.productsTableState = {
        isTableView: false, // Default to grid view
        currentPage: 1,
        itemsPerPage: 10,
        totalPages: 1,
        totalItems: 0,
        searchTerm: '',
        sortField: 'name',
        sortDirection: 'asc',
        filterStock: 'all',
        selectedProducts: new Set(),
        allProducts: []
    };

    /**
     * Initialize products table functionality
     */
    admin.initProductsTable = function() {
        console.log('PRODUCTS-TABLE: Initializing products table functionality...');
        
        // Setup event listeners for the new toolbar
        admin.setupProductsTableEventListeners();
        
        console.log('PRODUCTS-TABLE: Products table functionality initialized.');
    };

    /**
     * Setup event listeners for the products table
     */
    admin.setupProductsTableEventListeners = function() {
        // Toggle view button
        const toggleViewBtn = document.getElementById('toggle-view-btn');
        if (toggleViewBtn) {
            toggleViewBtn.addEventListener('click', admin.toggleProductView);
        }
        
        // Search input
        const searchInput = document.getElementById('product-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                admin.productsTableState.searchTerm = this.value;
                admin.applyFiltersAndRender();
            });
        }
        
        // Clear search button
        const clearSearchBtn = document.getElementById('clear-search-btn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', function() {
                searchInput.value = '';
                admin.productsTableState.searchTerm = '';
                admin.applyFiltersAndRender();
            });
        }
        
        // Stock status filters
        document.querySelectorAll('.stock-filter').forEach(filter => {
            filter.addEventListener('click', function(e) {
                e.preventDefault();
                admin.productsTableState.filterStock = this.dataset.stock;
                admin.applyFiltersAndRender();
            });
        });
        
        // Sort options
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const sortData = this.dataset.sort.split('-');
                admin.productsTableState.sortField = sortData[0];
                admin.productsTableState.sortDirection = sortData[1];
                admin.applyFiltersAndRender();
            });
        });
        
        // Export button
        const exportBtn = document.getElementById('export-products-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', admin.exportProducts);
        }
        
        // Bulk action buttons
        document.querySelectorAll('.bulk-action').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.dataset.action;
                admin.handleBulkAction(action);
            });
        });
        
        // Select all / deselect all buttons
        const selectAllBtn = document.getElementById('select-all-btn');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', admin.selectAllCurrentPageProducts);
        }
        
        const deselectAllBtn = document.getElementById('deselect-all-btn');
        if (deselectAllBtn) {
            deselectAllBtn.addEventListener('click', admin.deselectAllProducts);
        }
    };

    /**
     * Toggle between grid and table view
     */
    admin.toggleProductView = function() {
        const toggleBtn = document.getElementById('toggle-view-btn');
        const gridView = document.getElementById('contentArea');
        const tableView = document.getElementById('products-table-container');
        
        admin.productsTableState.isTableView = !admin.productsTableState.isTableView;
        
        if (admin.productsTableState.isTableView) {
            gridView.style.display = 'none';
            tableView.style.display = 'block';
            toggleBtn.innerHTML = '<i class="bi bi-grid-3x3-gap"></i> Grid View';
            admin.renderProductsTable();
        } else {
            tableView.style.display = 'none';
            gridView.style.display = 'block';
            toggleBtn.innerHTML = '<i class="bi bi-list-ul"></i> Table View';
            admin.renderContentArea(); // Re-render the grid view
        }
    };

    /**
     * Apply filters, sorting, and then render the appropriate view
     */
    admin.applyFiltersAndRender = function() {
        if (admin.productsTableState.isTableView) {
            admin.renderProductsTable();
        } else {
            // For grid view, we need to re-render the content area with filters applied
            // This requires modifying the existing renderContentArea function
            admin.renderContentArea(); 
        }
    };

    /**
     * Get stock status based on quantity
     */
    admin.getStockStatus = function(quantity) {
        if (quantity <= 0) {
            return 'out-of-stock';
        } else if (quantity < 10) {
            return 'low-stock';
        } else {
            return 'in-stock';
        }
    };

    /**
     * Render products in table view
     */
    admin.renderProductsTable = function() {
        // Get filtered and sorted products for the current category/subcategory
        const categoryProducts = admin.getProductsForCurrentView();
        const filteredProducts = admin.getFilteredProducts(categoryProducts);
        const sortedProducts = admin.getSortedProducts(filteredProducts);
        
        // Pagination
        admin.productsTableState.totalItems = sortedProducts.length;
        admin.productsTableState.totalPages = Math.ceil(sortedProducts.length / admin.productsTableState.itemsPerPage);
        
        const startIndex = (admin.productsTableState.currentPage - 1) * admin.productsTableState.itemsPerPage;
        const endIndex = startIndex + admin.productsTableState.itemsPerPage;
        const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
        
        // Render table body
        const tableBody = document.getElementById('products-table-body');
        if (paginatedProducts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="empty-state">
                            <i class="bi bi-inbox display-4 text-muted"></i>
                            <p class="mt-2">No products found</p>
                            <p class="text-muted">Try adjusting your search or filter criteria</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = paginatedProducts.map(product => `
                <tr data-product-id="${product.id}">
                    <td>
                        <div class="form-check">
                            <input class="form-check-input product-checkbox" type="checkbox" value="${product.id}" ${admin.productsTableState.selectedProducts.has(product.id) ? 'checked' : ''}>
                        </div>
                    </td>
                    <td>
                        <img src="${product.image || 'https://picsum.photos/seed/product' + product.id + '/100/100.jpg'}" alt="${product.name}" class="product-thumbnail">
                    </td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>$${product.price}</td>
                    <td>${product.stock_quantity}</td>
                    <td>
                        <span class="badge ${admin.getStockStatusBadgeClass(product.stock_status)}">
                            ${admin.getStockStatusLabel(product.stock_status)}
                        </span>
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-sm btn-outline-primary edit-product-btn" data-product-id="${product.id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger delete-product-btn" data-product-id="${product.id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        
        // Render pagination
        admin.renderProductsPagination();
        
        // Update selected count
        admin.updateSelectedCount();
        
        // Add event listeners to new elements
        admin.attachTableEventListeners();
    };

    /**
     * Get products relevant to the current view (category/subcategory)
     */
    admin.getProductsForCurrentView = function() {
        let categoryProducts = [];
        
        if (admin.state.activeMainCategory === 'Special') {
            categoryProducts = admin.state.products.filter(p => p.is_special === true);
        } else if (admin.state.activeSubCategory) {
            categoryProducts = admin.state.products.filter(p => 
                p.category === admin.state.activeMainCategory && p.sub_category === admin.state.activeSubCategory
            );
        } else {
            categoryProducts = admin.state.products.filter(p => p.category === admin.state.activeMainCategory);
        }

        // Ensure stock_status is calculated
        return categoryProducts.map(p => ({
            ...p,
            stock_status: admin.getStockStatus(p.stock_quantity)
        }));
    };

    /**
     * Get filtered products based on current filters
     */
    admin.getFilteredProducts = function(products) {
        let filtered = [...products];
        
        // Apply search term filter
        if (admin.productsTableState.searchTerm) {
            const term = admin.productsTableState.searchTerm.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(term) ||
                product.category.toLowerCase().includes(term) ||
                (product.sub_category && product.sub_category.toLowerCase().includes(term))
            );
        }
        
        // Apply stock status filter
        if (admin.productsTableState.filterStock !== 'all') {
            filtered = filtered.filter(product => product.stock_status === admin.productsTableState.filterStock);
        }
        
        return filtered;
    };

    /**
     * Get sorted products based on current sort settings
     */
    admin.getSortedProducts = function(products) {
        const sorted = [...products];
        const field = admin.productsTableState.sortField;
        const direction = admin.productsTableState.sortDirection;
        
        sorted.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];
            
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (direction === 'asc') {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });
        
        return sorted;
    };

    /**
     * Get badge class for stock status
     */
    admin.getStockStatusBadgeClass = function(status) {
        switch (status) {
            case 'in-stock': return 'bg-success';
            case 'low-stock': return 'bg-warning';
            case 'out-of-stock': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    /**
     * Get label for stock status
     */
    admin.getStockStatusLabel = function(status) {
        switch (status) {
            case 'in-stock': return 'In Stock';
            case 'low-stock': return 'Low Stock';
            case 'out-of-stock': return 'Out of Stock';
            default: return 'Unknown';
        }
    };

    /**
     * Render pagination controls
     */
    admin.renderProductsPagination = function() {
        const pagination = document.getElementById('products-pagination');
        const currentPage = admin.productsTableState.currentPage;
        const totalPages = admin.productsTableState.totalPages;
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                </a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || 
                i === totalPages || 
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                paginationHTML += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                paginationHTML += `
                    <li class="page-item disabled">
                        <a class="page-link" href="#">...</a>
                    </li>
                `;
            }
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                </a>
            </li>
        `;
        
        pagination.innerHTML = paginationHTML;
    };

    /**
     * Attach event listeners to table elements
     */
    admin.attachTableEventListeners = function() {
        // Pagination
        document.getElementById('products-pagination').addEventListener('click', function(e) {
            e.preventDefault();
            if (e.target.classList.contains('page-link') && !e.target.parentElement.classList.contains('disabled')) {
                admin.productsTableState.currentPage = parseInt(e.target.dataset.page);
                admin.renderProductsTable();
            }
        });
        
        // Select all checkbox
        const selectAllCheckbox = document.getElementById('select-all-checkbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const checkboxes = document.querySelectorAll('.product-checkbox');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = this.checked;
                    const productId = parseInt(checkbox.value);
                    if (this.checked) {
                        admin.productsTableState.selectedProducts.add(productId);
                    } else {
                        admin.productsTableState.selectedProducts.delete(productId);
                    }
                });
                admin.updateSelectedCount();
            });
        }
        
        // Individual product checkboxes
        document.getElementById('products-table-body').addEventListener('change', function(e) {
            if (e.target.classList.contains('product-checkbox')) {
                const productId = parseInt(e.target.value);
                if (e.target.checked) {
                    admin.productsTableState.selectedProducts.add(productId);
                } else {
                    admin.productsTableState.selectedProducts.delete(productId);
                }
                admin.updateSelectedCount();
            }
        });
        
        // Edit product buttons
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                admin.openEditProductModal(productId);
            });
        });

        // Delete product buttons
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.dataset.productId;
                admin.confirmDeleteProduct(productId);
            });
        });
    };

    /**
     * Update selected count
     */
    admin.updateSelectedCount = function() {
        const count = admin.productsTableState.selectedProducts.size;
        const countElement = document.getElementById('selected-count');
        if (countElement) {
            countElement.textContent = count;
        }
        
        // Show/hide bulk actions bar
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        if (bulkActionsBar) {
            if (count > 0) {
                bulkActionsBar.style.display = 'flex';
            } else {
                bulkActionsBar.style.display = 'none';
            }
        }
    };

    /**
     * Select all products on the current page
     */
    admin.selectAllCurrentPageProducts = function() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            admin.productsTableState.selectedProducts.add(parseInt(checkbox.value));
        });
        admin.updateSelectedCount();
    };

    /**
     * Deselect all products
     */
    admin.deselectAllProducts = function() {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        admin.productsTableState.selectedProducts.clear();
        admin.updateSelectedCount();
    };

    /**
     * Handle bulk actions
     */
    admin.handleBulkAction = function(action) {
        const selectedIds = Array.from(admin.productsTableState.selectedProducts);
        
        if (selectedIds.length === 0) {
            admin.showNotification('No products selected', 'warning');
            return;
        }
        
        switch (action) {
            case 'edit':
                admin.openBulkEditModal(selectedIds);
                break;
            case 'in-stock':
                admin.updateBulkStockStatus(selectedIds, 'in-stock');
                break;
            case 'out-of-stock':
                admin.updateBulkStockStatus(selectedIds, 'out-of-stock');
                break;
            case 'delete':
                admin.confirmBulkDelete(selectedIds);
                break;
        }
    };

    /**
     * Open bulk edit modal
     */
    admin.openBulkEditModal = function(productIds) {
        console.log('PRODUCTS-TABLE: Opening bulk edit modal for', productIds.length, 'products');
        
        // Store the selected product IDs
        admin.bulkEditProductIds = productIds;
        
        // Populate category dropdown
        const categoryDropdown = document.getElementById('bulk-category');
        if (categoryDropdown) {
            categoryDropdown.innerHTML = '<option value="">Keep current</option>';
            admin.state.allCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                categoryDropdown.appendChild(option);
            });
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bulkEditModal'));
        modal.show();
    };

    /**
     * Update bulk stock status
     */
    admin.updateBulkStockStatus = async function(productIds, status) {
        try {
            // This is a simplified client-side update.
            // In a real application, you would send a request to the server.
            const newStockValue = status === 'out-of-stock' ? 0 : 10; // Example logic
            
            admin.showNotification(`Stock status updated for ${productIds.length} products`, 'success');
            
            // Update local state
            productIds.forEach(id => {
                const product = admin.state.products.find(p => p.id === id);
                if (product) {
                    product.stock_status = status;
                    product.stock_quantity = newStockValue;
                }
            });
            
            // Re-render the current view
            admin.applyFiltersAndRender();
            
        } catch (error) {
            console.error('Error updating bulk stock status:', error);
            admin.showNotification('Error updating stock status', 'error');
        }
    };

    /**
     * Confirm bulk delete
     */
    admin.confirmBulkDelete = function(productIds) {
        admin.showConfirmDialog(
            `Are you sure you want to delete ${productIds.length} products? This action cannot be undone.`,
            () => admin.bulkDeleteProducts(productIds),
            { title: 'Delete Products', okText: 'Delete', okClass: 'btn-danger' }
        );
    };

    /**
     * Bulk delete products
     */
    admin.bulkDeleteProducts = async function(productIds) {
        try {
            // This is a simplified client-side update.
            // In a real application, you would send a request to the server.
            admin.showNotification(`${productIds.length} products deleted successfully`, 'success');
            
            // Update local state
            admin.state.products = admin.state.products.filter(
                product => !productIds.includes(product.id)
            );
            
            // Clear selection
            admin.productsTableState.selectedProducts.clear();
            
            // Re-render the current view
            admin.applyFiltersAndRender();
            
        } catch (error) {
            console.error('Error bulk deleting products:', error);
            admin.showNotification('Error deleting products', 'error');
        }
    };

    /**
     * Export products
     */
    admin.exportProducts = function() {
        console.log('PRODUCTS-TABLE: Exporting products...');
        
        // Get filtered products for the current view
        const categoryProducts = admin.getProductsForCurrentView();
        const filteredProducts = admin.getFilteredProducts(categoryProducts);
        
        // Convert to CSV
        const csv = admin.convertToCSV(filteredProducts);
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        admin.showNotification('Products exported successfully', 'success');
    };

    /**
     * Convert products array to CSV
     */
    admin.convertToCSV = function(products) {
        // Define headers
        const headers = [
            'ID', 'Name', 'Category', 'Subcategory', 'Price', 'Stock Quantity', 'Stock Status', 'Image URL'
        ];
        
        // Define rows
        const rows = products.map(product => [
            product.id,
            product.name,
            product.category,
            product.sub_category || '',
            product.price,
            product.stock_quantity,
            admin.getStockStatusLabel(product.stock_status),
            product.image || ''
        ]);
        
        // Convert to CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    };

    /**
     * Save bulk edit changes
     */
    admin.saveBulkEdit = async function() {
        try {
            const category = document.getElementById('bulk-category').value;
            const subcategory = document.getElementById('bulk-subcategory').value;
            const priceChangeType = document.getElementById('bulk-price-change-type').value;
            const priceValue = document.getElementById('bulk-price-value').value;
            const stockStatus = document.getElementById('bulk-stock-status').value;
            
            const updateData = {
                productIds: admin.bulkEditProductIds
            };
            
            // Only include fields that are being changed
            if (category) updateData.category = category;
            if (subcategory) updateData.subcategory = subcategory;
            if (priceChangeType !== 'no-change') {
                updateData.priceChangeType = priceChangeType;
                updateData.priceValue = parseFloat(priceValue);
            }
            if (stockStatus !== 'no-change') updateData.stockStatus = stockStatus;
            
            // This is a simplified client-side update.
            // In a real application, you would send a request to the server.
            admin.showNotification('Products updated successfully', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('bulkEditModal'));
            if (modal) modal.hide();
            
            // Re-render the current view
            admin.applyFiltersAndRender();
            
        } catch (error) {
            console.error('Error saving bulk edit:', error);
            admin.showNotification('Error updating products', 'error');
        }
    };

})(window.SimoonAdmin);