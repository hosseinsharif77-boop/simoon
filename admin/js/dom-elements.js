/**
 * Simoon Cafe Admin Panel - DOM Elements
 */
(function(admin) {
    'use strict';

    if (!admin.dom) {
        admin.dom = {};
    }

    // Main Layout Elements
    admin.dom.mainTabs = document.getElementById('mainTabs');
    admin.dom.contentArea = document.getElementById('contentArea');

    // Section Title
    admin.dom.sectionTitle = document.getElementById('section-title');

    // Sections
    admin.dom.categoriesSection = document.getElementById('categories-section');
    admin.dom.inventorySection = document.getElementById('inventory-section');

    // --- NEW: Products Table Elements ---
    admin.dom.productsTableContainer = document.getElementById('products-table-container');
    admin.dom.productsTable = document.getElementById('products-table');
    admin.dom.productsTableBody = document.getElementById('products-table-body');
    admin.dom.productsPagination = document.getElementById('products-pagination');
    admin.dom.productSearchInput = document.getElementById('product-search-input');
    admin.dom.clearSearchBtn = document.getElementById('clear-search-btn');
    admin.dom.bulkActionsBar = document.getElementById('bulk-actions-bar');
    admin.dom.selectedCount = document.getElementById('selected-count');
    admin.dom.selectAllBtn = document.getElementById('select-all-btn');
    admin.dom.deselectAllBtn = document.getElementById('deselect-all-btn');
    admin.dom.selectAllCheckbox = document.getElementById('select-all-checkbox');
    admin.dom.exportProductsBtn = document.getElementById('export-products-btn');
    admin.dom.toggleViewBtn = document.getElementById('toggle-view-btn');

    // Bulk Edit Modal Elements
    admin.dom.bulkEditModal = document.getElementById('bulkEditModal');
    admin.dom.bulkEditForm = document.getElementById('bulkEditForm');
    admin.dom.bulkCategory = document.getElementById('bulk-category');
    admin.dom.bulkSubcategory = document.getElementById('bulk-subcategory');
    admin.dom.bulkPriceChangeType = document.getElementById('bulk-price-change-type');
    admin.dom.bulkPriceValue = document.getElementById('bulk-price-value');
    admin.dom.bulkStockStatus = document.getElementById('bulk-stock-status');
    admin.dom.saveBulkEditBtn = document.getElementById('saveBulkEditBtn');

    // Modal Elements
    admin.dom.categoryModal = document.getElementById('categoryModal');
    admin.dom.productModal = document.getElementById('productModal');
    admin.dom.categoryForm = document.getElementById('categoryForm');
    admin.dom.productForm = document.getElementById('productForm');
    admin.dom.ingredientsContainer = document.getElementById('ingredientsContainer');
    
    // دکمه افزودن ماده اولیه در مودال محصول
    admin.dom.addProductIngredientBtn = document.getElementById('addIngredientBtn');

    admin.dom.mainCategoryFields = document.getElementById('mainCategoryFields');
    admin.dom.uploadImageBtn = document.getElementById('uploadImageBtn');
    admin.dom.categoryImageUpload = document.getElementById('categoryImageUpload');
    admin.dom.productImageUpload = document.getElementById('imageUpload');

    // Category Modal Elements
    admin.dom.categoryModalLabel = document.getElementById('categoryModalLabel');
    admin.dom.categoryId = document.getElementById('categoryId');
    admin.dom.categoryType = document.getElementById('categoryType');
    admin.dom.categoryName = document.getElementById('categoryName');
    admin.dom.parentCategory = document.getElementById('parentCategory');
    admin.dom.parentCategoryDiv = document.getElementById('parentCategoryDiv');
    admin.dom.categoryImage = document.getElementById('categoryImage');
    admin.dom.categoryDescription = document.getElementById('categoryDescription');
    admin.dom.deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
    admin.dom.saveCategoryBtn = document.getElementById('saveCategoryBtn');

    // Product Modal Elements
    admin.dom.productModalLabel = document.getElementById('productModalLabel');
    admin.dom.productId = document.getElementById('productId');
    
    // Basic Info Tab
    admin.dom.name = document.getElementById('name');
    admin.dom.price = document.getElementById('price');
    admin.dom.description = document.getElementById('description');

    // Media Tab
    admin.dom.imageUpload = document.getElementById('imageUpload');
    admin.dom.image = document.getElementById('image');
    admin.dom.productUploadImageBtn = document.getElementById('productUploadImageBtn');

    // Inventory Tab
    admin.dom.category = document.getElementById('category');
    admin.dom.sub_category = document.getElementById('sub_category');
    admin.dom.stock_quantity = document.getElementById('stock_quantity');
    admin.dom.is_special = document.getElementById('is_special');
    
    // SEO Tab
    admin.dom.meta_title = document.getElementById('meta_title');
    admin.dom.meta_description = document.getElementById('meta_description');

    // Product Modal Buttons
    admin.dom.deleteProductBtn = document.getElementById('deleteProductBtn');
    admin.dom.saveProductBtn = document.getElementById('saveProductBtn');

    // Navigation Elements
    admin.dom.previewBtn = document.getElementById('previewBtn');
    admin.dom.logoutBtn = document.getElementById('logoutBtn');
    admin.dom.navLinks = document.querySelectorAll('.nav-link');
    admin.dom.mobileNavItems = document.querySelectorAll('.mobile-bottom-nav-item');

    // Inventory Modals
    admin.dom.stockUpdateModal = document.getElementById('stockUpdateModal');
    admin.dom.stockUpdateForm = document.getElementById('stockUpdateForm');
    admin.dom.confirmStockUpdateBtn = document.getElementById('confirmStockUpdateBtn');

    admin.dom.addIngredientModal = document.getElementById('addIngredientModal');
    admin.dom.addIngredientForm = document.getElementById('addIngredientForm');
    admin.dom.confirmAddIngredientBtn = document.getElementById('confirmAddIngredientBtn');

    // دکمه افزودن ماده اولیه در بخش Inventory
    admin.dom.addInventoryIngredientBtn = document.getElementById('add-ingredient-btn');

})(window.SimoonAdmin);