// ================================= CONFIGURATION =================================
// File: js/config.js
// Description: Central configuration and DOM element caching for the Simoon Cafe application.
// ============================== END OF FILE HEADER ==============================

// مسیر پایه برای تصاویر Supabase
export const IMAGE_BASE_PATH = 'https://kgareesfljwsclqljqvr.supabase.co/storage/v1/object/public/images/';

// ================================= DOM ELEMENTS =================================
export const elements = {
    // Header and Navigation
    headerContainer: document.getElementById('header-container'),
    menuNav: document.getElementById('menu-nav'),
    menuGrid: document.getElementById('menu-grid'),
    categoryBtns: document.querySelectorAll('.category-btn'),
    subcategoryNav: document.getElementById('subcategory-nav'),
    navigationWrapper: document.querySelector('.navigation-wrapper'),
    categoryDisplayWrapper: document.getElementById('category-display-wrapper'),
    categoryPromptText: document.getElementById('category-prompt-text'),

    // Order Sidebar
    menuOrderBtn: document.getElementById('menu-order-btn'),
    menuOrderCount: document.getElementById('menu-order-count'),
    orderSidebar: document.getElementById('order-sidebar'),
    orderOverlay: document.getElementById('order-overlay'),
    closeOrderBtn: document.getElementById('close-order-btn'),
    orderItemsContainer: document.getElementById('order-items'),
    orderTotal: document.getElementById('order-total'),

    // Order Type
    orderTypeRadios: document.querySelectorAll('input[name="order-type"]'),
    tableNumberInput: document.getElementById('table-number'),
    tableInfoContainer: document.getElementById('table-info-container'),
    deliveryAddressContainer: document.getElementById('delivery-address-container'),
    deliveryAddressInput: document.getElementById('delivery-address'),

    // User Panel
    hamburgerMenuBtn: document.getElementById('hamburger-menu-btn'),
    userPanelSidebar: document.getElementById('user-panel-sidebar'),
    userPanelOverlay: document.getElementById('user-panel-overlay'),
    closeUserPanelBtn: document.getElementById('close-user-panel-btn'),
    favoritesContainer: document.getElementById('favorites-container'),

    // Page Navigation
    navLinks: document.querySelectorAll('.nav-link'),
    mobileBottomNavItems: document.querySelectorAll('.mobile-bottom-nav-item'),
    pageSections: document.querySelectorAll('.page-section'),

    // Carousel
    carouselTrack: document.getElementById('restaurant-carousel'),
    carouselPrev: document.getElementById('carousel-prev'),
    carouselNext: document.getElementById('carousel-next'),

    // Category Display
    categoryTitle: document.getElementById('category-title'),
    categoryImageContainer: document.querySelector('.category-image-container'),
    categoryDescription: document.getElementById('category-description'),
    
    // Search and carousel
    productSearch: document.getElementById('product-search'),
    clearSearchBtn: document.getElementById('clear-search'),
    searchContainer: document.getElementById('search-container'),
    specialsCarouselSection: document.getElementById('specials-carousel-section'),
};

// ================================= APPLICATION CONFIGURATION =================================
let API_BASE_URL;

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    API_BASE_URL = 'http://localhost:5000';
} else {
    API_BASE_URL = 'https://simoon.onrender.com';
}

export const config = {
    API_BASE_URL: API_BASE_URL,
    mainCarouselInterval: 5000,
    specialsCarouselIntervalTime: 4000,
    mobileBreakpoint: 768,
};
// ============================== END OF JAVASCRIPT FILE ==============================