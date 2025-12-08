/**
 * Simoon Cafe Admin Panel - DOM Elements (Final Version)
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
    
    // --- NEW: Orders & Settings Sections ---
    admin.dom.ordersSection = document.getElementById('orders-section');
    admin.dom.settingsSection = document.getElementById('settings-section');
    // --- End NEW ---

    // --- Products Table Elements (unchanged) ---
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

    // --- NEW: Orders Section Elements ---
    admin.dom.ordersTabsRibbon = document.getElementById('ordersTabsRibbon');
    admin.dom.ordersContentArea = document.getElementById('ordersContentArea');
    admin.dom.orderSearchInput = document.getElementById('order-search-input');
    admin.dom.clearOrderSearchBtn = document.getElementById('clear-order-search-btn');
    admin.dom.exportOrdersBtn = document.getElementById('export-orders-btn');
    // --- End NEW ---

    // --- NEW: Settings Section Elements ---
    admin.dom.settingsNavLinks = document.querySelectorAll('.settings-nav-link');
    admin.dom.settingsContents = document.querySelectorAll('.settings-content');
    admin.dom.generalSettingsForm = document.getElementById('general-settings-form');
    admin.dom.paymentSettingsForm = document.getElementById('payment-settings-form');
    admin.dom.notificationsSettingsForm = document.getElementById('notifications-settings-form');
    admin.dom.enableStripeCheckbox = document.getElementById('enable-stripe');
    admin.dom.stripeSettingsDiv = document.getElementById('stripe-settings');
    admin.dom.usersTableBody = document.getElementById('users-table-body');
    admin.dom.addUserBtn = document.getElementById('add-user-btn');
    // --- End NEW ---

    // Modal Elements
    admin.dom.categoryModal = document.getElementById('categoryModal');
    admin.dom.productModal = document.getElementById('productModal');
    admin.dom.confirmModal = document.getElementById('confirmModal');
    admin.dom.bulkEditModal = document.getElementById('bulkEditModal');
    admin.dom.stockUpdateModal = document.getElementById('stockUpdateModal');
    admin.dom.addIngredientModal = document.getElementById('addIngredientModal');
    admin.dom.specialSlideModal = document.getElementById('specialSlideModal');

    // --- NEW: Orders & Settings Modals ---
    admin.dom.orderDetailsModal = document.getElementById('orderDetailsModal');
    admin.dom.orderDetailsModalBody = document.getElementById('orderDetailsModalBody');
    admin.dom.updateOrderStatusBtn = document.getElementById('updateOrderStatusBtn');
    // Note: userSettingsModal is used to avoid ID conflict
    admin.dom.userSettingsModal = document.getElementById('userSettingsModal');
    admin.dom.userSettingsForm = document.getElementById('userSettingsForm');
    // --- End NEW ---

    // --- Modal Forms (Updated with new IDs) ---
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