// ================================= JAVASCRIPT FILE =================================
// File: js/config.js
// Description: Central configuration, state management, and DOM element caching for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= STATE MANAGEMENT =================================
/**
 * @description A single object containing all the application's state variables.
 * This makes state management more predictable and easier to debug.
 * All state is mutable and should be modified directly (e.g., `state.currentPage = 'menu'`).
 */
export const state = {
    /** @type {Array<Object>} Stores items in the current user's order. */
    order: [],
    /** @type {Array<Object>} Stores user's favorite menu items. */
    favorites: [],
    /** @type {string} The currently selected main category (e.g., 'pizza', 'specials'). */
    currentMainCategory: '',
    /** @type {string} The currently selected sub-category (e.g., 'american', 'italian'). */
    currentSubCategory: 'american',
    /** @type {string} The identifier of the currently active page (e.g., 'home', 'menu'). */
    currentPage: 'home',
    /** @type {number} The current slide index for the main restaurant carousel. */
    currentSlide: 0,
    /** @type {number|null} The table number if ordering from a QR code. */
    currentTableNumber: null,
    /** @type {boolean} Flag to check if the user arrived via a QR code link. */
    isFromQRCode: false,
    /** @type {number} The current slide index for the specials carousel. */
    currentSpecialsSlide: 0,
    /** @type {number|null} Stores the interval ID for the specials carousel auto-play. */
    specialsCarouselInterval: null,
    /** @type {'review' | 'payment'} مرحله فعلی فرآیند سفارش در سایدبار */
    currentOrderStep: 'review',
};
// ========================== END OF STATE MANAGEMENT ==========================


// ================================= DOM ELEMENTS =================================
/**
 * @description Cached DOM elements.
 * Caching elements on initialization improves performance by avoiding repeated DOM queries.
 * All elements that are accessed frequently should be added here.
 */
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

    // Category Display (dynamic elements, might be null initially)
    categoryTitle: document.getElementById('category-title'),
    categoryImageContainer: document.querySelector('.category-image-container'),
    categoryDescription: document.getElementById('category-description'),
};
// ========================== END OF DOM ELEMENTS ==========================


// ================================= APPLICATION CONFIGURATION =================================
/**
 * @description Application-wide configuration constants.
 * Add any global settings, timeouts, or API endpoints here.
 */
export const config = {
    /** @type {number} Interval in milliseconds for the main carousel auto-play. */
    mainCarouselInterval: 5000,
    /** @type {number} Interval in milliseconds for the specials carousel auto-play. */
    specialsCarouselIntervalTime: 4000,
    /** @type {number} Breakpoint for mobile view in pixels. */
    mobileBreakpoint: 768,
};
// ========================== END OF APPLICATION CONFIGURATION ==========================