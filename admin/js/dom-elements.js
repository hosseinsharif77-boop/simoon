/**
 * Simoon Cafe Admin Panel - DOM Elements
 */
(function(admin) {
    'use strict';

    // بررسی امنیتی: اگر admin.dom وجود نداشت، آن را بساز
    if (!admin.dom) {
        admin.dom = {};
    }

    // Main Layout Elements
    admin.dom.mainTabs = document.getElementById('mainTabs');
    admin.dom.contentArea = document.getElementById('contentArea');

    // Modal Elements
    admin.dom.categoryModal = document.getElementById('categoryModal');
    admin.dom.productModal = document.getElementById('productModal');
    admin.dom.categoryForm = document.getElementById('categoryForm');
    admin.dom.productForm = document.getElementById('productForm');
    admin.dom.ingredientsContainer = document.getElementById('ingredientsContainer');

    // --- NEW ELEMENTS ADDED ---
    admin.dom.mainCategoryFields = document.getElementById('mainCategoryFields');
    admin.dom.uploadImageBtn = document.getElementById('uploadImageBtn');
    admin.dom.categoryImageUpload = document.getElementById('categoryImageUpload');

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
    admin.dom.addIngredientBtn = document.getElementById('addIngredientBtn');

    // Navigation Elements
    admin.dom.previewBtn = document.getElementById('previewBtn');
    admin.dom.logoutBtn = document.getElementById('logoutBtn');
    admin.dom.navLinks = document.querySelectorAll('.nav-link');
    admin.dom.mobileNavItems = document.querySelectorAll('.mobile-bottom-nav-item');

})(window.SimoonAdmin);