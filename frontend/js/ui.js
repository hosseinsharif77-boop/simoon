// ================================= JAVASCRIPT FILE =================================
// File: js/ui.js
// Description: UI update functions and event handlers for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= IMPORTS =================================
import { elements, state, config, IMAGE_BASE_PATH } from './config.js';
import { categoryData, specialsAlbumData } from './data.js';
import { formatPrice, debounce, normalizeImagePath } from './utils.js';
import { renderProducts } from './menu.js';
import { 
    uiLogger, 
    navLogger, 
    logNavigationEvent,
    logDetailedMenuState,
    createPerformanceMonitor,
    menuLogger
} from './logger.js';
// ========================== END OF IMPORTS ==========================

// ================================= STATE MANAGEMENT =================================
// Flags to prevent redundant operations and re-initializations
let isRenderingMenu = false;
let carouselInitialized = false;
// ========================== END OF STATE MANAGEMENT ==========================

// ================================= UI UPDATE FUNCTIONS =================================
/**
 * Updates the order sidebar UI, including item count, list of items, and total price.
 */
export const updateOrderUI = () => {
    const totalItems = state.order.reduce((sum, item) => sum + item.quantity, 0);
    elements.menuOrderCount.textContent = totalItems;
    elements.menuOrderCount.classList.toggle('hidden', totalItems === 0);
    elements.orderItemsContainer.innerHTML = state.order.length === 0 ? 
        `<p class="text-center text-gray-500 mt-10">You haven't ordered anything yet.</p>` : 
        state.order.map(item => `
            <div class="flex items-center justify-between mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div class="flex items-center gap-3">
                    <img src="${normalizeImagePath(item.image)}" alt="${item.name}" class="w-16 h-16 object-cover rounded-full">
                    <div>
                        <h4 class="font-semibold">${item.name}</h4>
                        <p class="text-sm text-gray-400">${formatPrice(item.price)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="window.changeQuantity(${item.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600">
                        <i class="fas fa-minus text-xs"></i>
                    </button>
                    <span class="w-8 text-center font-semibold">${item.quantity}</span>
                    <button onclick="window.changeQuantity(${item.id}, 1)" class="w-7 h-7 bg-amber-600 rounded-full text-white hover:bg-amber-700">
                        <i class="fas fa-plus text-xs"></i>
                    </button>
                    <button onclick="window.removeFromOrder(${item.id})" class="mr-2 text-red-500 hover:text-red-400">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    elements.orderTotal.textContent = formatPrice(state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0));
    
    uiLogger.debug('Order UI updated', {
        totalItems,
        orderLength: state.order.length
    });
};

/**
 * Updates the favorites section in the user panel.
 */
export const updateFavoritesUI = () => {
    elements.favoritesContainer.innerHTML = state.favorites.length === 0 ? 
        `<p class="col-span-2 text-center text-gray-500 text-sm">No favorites yet.</p>` : 
        state.favorites.map(item => `
            <div class="bg-gray-800 p-2 rounded-lg border border-gray-700 text-center">
                <img src="${normalizeImagePath(item.image)}" alt="${item.name}" class="w-full h-20 object-cover rounded-md mb-1">
                <h5 class="text-xs font-semibold truncate">${item.name}</h5>
            </div>
        `).join('');
    
    uiLogger.debug('Favorites UI updated', {
        favoritesCount: state.favorites.length
    });
};

// ================================= LOGGING HELPERS =================================
/**
 * Logs detailed state of a DOM element for debugging.
 * @param {HTMLElement} element - The element to log.
 * @param {string} label - A descriptive label for the log entry.
 */
export const logElementState = (element, label) => {
    if (!element) {
        console.warn(`logElementState: Element not found for label "${label}"`);
        return;
    }

    console.group(`🔍 Element State Log: ${label}`);
    console.log('Element:', element);
    console.log('Classes:', element.className);
    
    const computedStyle = window.getComputedStyle(element);
    console.log('Computed Styles:', {
        opacity: computedStyle.opacity,
        visibility: computedStyle.visibility,
        transform: computedStyle.transform,
        transition: computedStyle.transition,
        display: computedStyle.display,
        position: computedStyle.position,
        top: computedStyle.top,
        left: computedStyle.left,
    });

    const rect = element.getBoundingClientRect();
    console.log('Bounding Rect (Position & Size):', {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
    });
    console.groupEnd();
};
// ========================== END OF LOGGING HELPERS ==========================

// ================================= CORE NAVIGATION & RENDERING LOGIC =================================
/**
 * Displays a specific page and hides others. Updates navigation states.
 * @param {string} pageId - The ID of page to show (e.g., 'home', 'menu').
 * @param {string} [newCategory] - The new main category to switch to (optional).
 */
export const showPage = async (pageId, newCategory) => {
    // Prevent redundant menu rendering
    if (isRenderingMenu && pageId === 'menu') {
        console.log('Menu rendering already in progress, skipping...');
        return;
    }
    
    isRenderingMenu = true;
    
    const monitor = createPerformanceMonitor('showPage');
    uiLogger.section(`Displaying Page: ${pageId}`);
    
    const oldPage = state.currentPage;
    const oldCategory = state.currentMainCategory;
    
    // Core page switching logic
    const body = document.body;
    body.classList.toggle('menu-page-active', pageId === 'menu');
    elements.pageSections.forEach(section => section.classList.toggle('active', section.id === `${pageId}-page`));
    elements.navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
    elements.mobileBottomNavItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageId));

    state.currentPage = pageId;
    
    // Show/hide order button based on page
    elements.menuOrderBtn.classList.toggle('hidden', pageId !== 'menu');
    
    if (pageId === 'menu') {
        // Ensure order button is visible with proper dimensions
        elements.menuOrderBtn.style.display = 'flex';
        elements.menuOrderBtn.style.visibility = 'visible';
        elements.menuOrderBtn.style.width = '56px';
        elements.menuOrderBtn.style.height = '56px';
        
        // Handle category change
        if (newCategory && newCategory !== state.currentMainCategory) {
            // فقط حالت دسته بندی را به روز کن، بدون لودینگ
            state.currentMainCategory = newCategory;
            state.currentSubCategory = ''; 
            uiLogger.debug('Category changed', {
                oldCategory,
                newCategory,
                resetSubcategory: true
            });
        }

        // Update navigation wrapper
        updateNavigationWrapper(state.currentMainCategory);

        // Show/hide appropriate sections based on category
        const categoryDisplaySection = document.querySelector('.category-display-section');
        const specialsCarouselSection = document.getElementById('specials-carousel-section');
        
        if (state.currentMainCategory === 'specials') {
            categoryDisplaySection?.classList.add('hidden');
            specialsCarouselSection?.classList.remove('hidden');
            elements.subcategoryNav.classList.add('hidden');
        } else {
            categoryDisplaySection?.classList.remove('hidden');
            specialsCarouselSection?.classList.add('hidden');
            elements.subcategoryNav.classList.remove('hidden');
        }
        
        // Highlight active category button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mainCategory === state.currentMainCategory);
        });

        // Force browser to render changes
        elements.navigationWrapper.offsetHeight;

        // Fetch data in background
        await Promise.all([
            updateMainCategoryNav(),
            updateSubCategoryNav()
        ]);
        
        // Update category display and render products
        updateCategoryDisplay();
        renderProducts();
        
        // Ensure order button is visible after timeout
        setTimeout(() => {
            if (elements.menuOrderBtn) {
                elements.menuOrderBtn.style.display = 'flex';
                elements.menuOrderBtn.style.visibility = 'visible';
                elements.menuOrderBtn.style.width = '56px';
                elements.menuOrderBtn.style.height = '56px';
            }
        }, 100);
    }
    
    monitor.end({
        from: oldPage,
        to: pageId,
        categoryChanged: oldCategory !== state.currentMainCategory
    });
    
    uiLogger.endSection();
    logDetailedMenuState('After showPage');
    isRenderingMenu = false;
};

/**
 * Updates UI for order type selection (dine-in, delivery, pickup).
 * Shows/hides relevant input fields.
 */
export const updateOrderTypeUI = () => {
    const selectedOrderType = document.querySelector('input[name="order-type"]:checked').value;
    elements.tableInfoContainer.classList.toggle('hidden', selectedOrderType !== 'dine-in');
    elements.deliveryAddressContainer.classList.toggle('hidden', selectedOrderType !== 'delivery');
    
    if (selectedOrderType === 'dine-in') {
        if (state.isFromQRCode && state.currentTableNumber) {
            elements.tableNumberInput.value = state.currentTableNumber;
            elements.tableNumberInput.readOnly = true;
        } else {
            elements.tableNumberInput.value = '';
            elements.tableNumberInput.readOnly = false;
        }
    }
    
    uiLogger.debug('Order type UI updated', {
        selectedOrderType,
        isFromQRCode: state.isFromQRCode,
        tableNumber: state.currentTableNumber
    });
};

/**
 * Updates main category navigation bar by adding custom categories from server.
 */
export const updateMainCategoryNav = async () => {
    const monitor = createPerformanceMonitor('updateMainCategoryNav');
    navLogger.section('Updating Main Category Navigation');
    
    try {
        // Fetch custom categories from server
        const response = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        
        if (!response.ok) {
            throw new Error('Error fetching custom categories');
        }
        
        const customCategories = await response.json();
        
        // Filter main categories (not subcategories)
        const customMainCategories = customCategories
            .filter(item => item.type === 'category')
            .map(item => item.name);
        
        navLogger.debug('Custom main categories found', { 
            categories: customMainCategories 
        });
        
        // Get main category navigation
        const mainCategoryNav = document.querySelector('#menu-nav nav');
        
        if (!mainCategoryNav) {
            navLogger.error('Main category navigation not found');
            return;
        }
        
        // Get existing buttons to prevent duplicates
        const existingButtons = Array.from(mainCategoryNav.querySelectorAll('.category-btn'));
        const existingCategories = existingButtons.map(btn => btn.dataset.mainCategory);
        
        // Create a document fragment for performance optimization
        const fragment = document.createDocumentFragment();
        
        // Add custom categories to navigation
        customMainCategories.forEach(category => {
            // Check if this category already exists
            if (!existingCategories.includes(category)) {
                const button = document.createElement('button');
                button.className = 'category-btn';
                button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                button.dataset.mainCategory = category;
                // Set a default image for custom categories
                button.dataset.categoryImage = 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=600';
                
                // Add click event to new button
                button.addEventListener('click', () => {
                    const category = button.dataset.mainCategory;
                    logNavigationEvent(`Category Button (${state.currentMainCategory})`, `Category Button (${category})`, { 
                        triggeredBy: 'categoryBtn',
                        category: category 
                    });
                    showPage('menu', category);
                });
                
                fragment.appendChild(button);
            }
        });
        
        // Add new buttons to navigation
        mainCategoryNav.appendChild(fragment);
        
        // Update category buttons elements
        elements.categoryBtns = document.querySelectorAll('.category-btn');

        // Set default state if needed
        if (state.currentPage === 'home' && !state.currentMainCategory) {
            state.currentMainCategory = 'specials';
            state.currentSubCategory = '';
        }

        // Set active button based on state
        elements.categoryBtns.forEach(btn => {
            const isActive = btn.dataset.mainCategory === state.currentMainCategory;
            btn.classList.toggle('active', isActive);
        });

        monitor.end({
            categoriesCount: customMainCategories.length
        });
        
        navLogger.endSection();
    } catch (error) {
        navLogger.error('Error updating main categories', error);
        monitor.end({ error: true });
    }
};

/**
 * Updates the sub-category navigation bar based on the selected main category.
 * It dynamically creates buttons for each sub-category found within the main category.
 */
export const updateSubCategoryNav = async () => {
    const monitor = createPerformanceMonitor('updateSubCategoryNav');
    navLogger.section('Updating Subcategory Navigation');
    navLogger.debug('Current main category', { category: state.currentMainCategory });
    
    const subCategoryNav = elements.subcategoryNav.querySelector('nav');

    // Extract subcategories from products
    const subcategoriesFromProducts = [...new Set(
        window.allMenuItems
            .filter(item => item.category === state.currentMainCategory && item.sub_category)
            .map(item => item.sub_category)
    )];

    try {
        // Fetch custom subcategories from server
        const response = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        
        if (!response.ok) {
            throw new Error('Error fetching custom subcategories');
        }
        
        const customCategories = await response.json();
        const customSubcategories = customCategories
            .filter(item => item.type === 'subcategory' && item.parent_category === state.currentMainCategory)
            .map(item => item.name);

        // Merge subcategories and remove duplicates
        const allSubcategories = [...new Set([...subcategoriesFromProducts, ...customSubcategories])];
        navLogger.debug('Subcategories found', { 
            category: state.currentMainCategory,
            subcategories: allSubcategories 
        });

        // If no subcategories, hide nav
        if (allSubcategories.length === 0 || state.currentMainCategory === 'specials') {
            elements.subcategoryNav.classList.add('hidden');
            state.currentSubCategory = ''; // Clear state if no subcategories
            renderProducts(); // Re-render to show only main products
            
            monitor.end({
                category: state.currentMainCategory,
                subcategoriesCount: 0
            });
            
            navLogger.endSection();
            return;
        }

        // If subcategories exist, show nav
        elements.subcategoryNav.classList.remove('hidden');

        // Create all buttons in a document fragment to prevent flickering
        const fragment = document.createDocumentFragment();
        allSubcategories.forEach(sub => {
            const button = document.createElement('button');
            button.className = 'subcategory-btn';
            button.textContent = sub.charAt(0).toUpperCase() + sub.slice(1);
            button.dataset.subCategory = sub;
            
            // Add click event to new button
            button.addEventListener('click', () => {
                const subCategory = button.dataset.subCategory;
                logNavigationEvent(`Subcategory (${state.currentSubCategory})`, `Subcategory (${subCategory})`, { 
                    triggeredBy: 'subcategoryBtn',
                    subCategory: subCategory 
                });
                
                // Update state and re-render products
                state.currentSubCategory = subCategory;
                setActiveSubcategoryButton(subCategory);
                renderProducts();
                updateCategoryDisplay();
            });
            
            fragment.appendChild(button);
        });

        // Replace old content with new content (atomic operation)
        subCategoryNav.innerHTML = '';
        subCategoryNav.appendChild(fragment);

        // Set active subcategory
        const firstSubcategory = allSubcategories[0];
        if (firstSubcategory && (!state.currentSubCategory || !allSubcategories.includes(state.currentSubCategory))) {
            state.currentSubCategory = firstSubcategory;
            setActiveSubcategoryButton(firstSubcategory);
        } else if (state.currentSubCategory) {
            setActiveSubcategoryButton(state.currentSubCategory);
        }

        navLogger.debug('Active subcategory button set', { 
            subcategory: state.currentSubCategory 
        });
        
        // Re-render products after setting state
        renderProducts(); 
        updateCategoryDisplay(); // Ensure complete synchronization
        
        monitor.end({
            category: state.currentMainCategory,
            subcategoriesCount: allSubcategories.length,
            activeSubcategory: state.currentSubCategory
        });
        
        navLogger.endSection();
        logDetailedMenuState('After updateSubCategoryNav');
    } catch (error) {
        navLogger.error('Error updating subcategories', error);
        
        // On error, continue with product subcategories only
        if (subcategoriesFromProducts.length > 0) {
            elements.subcategoryNav.classList.remove('hidden'); // Show nav
            
            // Use document fragment to prevent flickering
            const fragment = document.createDocumentFragment();
            subcategoriesFromProducts.forEach(sub => {
                const button = document.createElement('button');
                button.className = 'subcategory-btn';
                button.textContent = sub.charAt(0).toUpperCase() + sub.slice(1);
                button.dataset.subCategory = sub;
                
                // Add click event to new button
                button.addEventListener('click', () => {
                    const subCategory = button.dataset.subCategory;
                    logNavigationEvent(`Subcategory (${state.currentSubCategory})`, `Subcategory (${subCategory})`, { 
                        triggeredBy: 'subcategoryBtn',
                        subCategory: subCategory 
                    });
                    
                    // Update state and re-render products
                    state.currentSubCategory = subCategory;
                    setActiveSubcategoryButton(subCategory);
                    renderProducts();
                    updateCategoryDisplay();
                });
                
                fragment.appendChild(button);
            });

            subCategoryNav.innerHTML = '';
            subCategoryNav.appendChild(fragment);

            // Update state and UI
            const firstSubcategory = subcategoriesFromProducts[0];
            if (firstSubcategory && (!state.currentSubCategory || !subcategoriesFromProducts.includes(state.currentSubCategory))) {
                state.currentSubCategory = firstSubcategory;
                setActiveSubcategoryButton(firstSubcategory);
            } else if (state.currentSubCategory) {
                setActiveSubcategoryButton(state.currentSubCategory);
            }
            
            renderProducts(); // Re-render for empty state
            
            monitor.end({
                category: state.currentMainCategory,
                subcategoriesCount: subcategoriesFromProducts.length,
                activeSubcategory: state.currentSubCategory,
                fallbackMode: true
            });
        } else {
            elements.subcategoryNav.classList.add('hidden'); // Hide nav
            state.currentSubCategory = '';
            renderProducts(); // Re-render for empty state
            
            monitor.end({
                category: state.currentMainCategory,
                subcategoriesCount: 0,
                fallbackMode: true
            });
        }
        
        navLogger.endSection();
    }
};

/**
 * Sets active state for a sub-category button.
 * @param {string} subcategoryName - The name of sub-category to activate.
 */
export const setActiveSubcategoryButton = (subcategoryName) => {
    navLogger.debug('Setting active subcategory button', { subcategoryName });
    
    // Remove active class from all buttons
    document.querySelectorAll('.subcategory-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to the specified button
    if (subcategoryName) { // Check for null or empty values
        const activeBtn = document.querySelector(`.subcategory-btn[data-sub-category="${subcategoryName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            navLogger.debug('Subcategory button activated', { subcategoryName });
        } else {
            navLogger.warn('Subcategory button not found', { subcategoryName });
        }
    }
};

/**
 * Updates product card controls (+/- buttons) based on order state.
 * @param {number|null} productId - The ID of a specific product to update, or null to update all.
 */
export const updateProductCardControls = (productId = null) => {
    const updateSingleControl = (control, id) => {
        const item = state.order.find(i => i.id === id);
        
        if (item) {
            control.innerHTML = `
                <button onclick="window.changeQuantity(${item.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 transition-colors">
                    <i class="fas fa-minus text-xs"></i>
                </button>
                <span class="w-8 text-center font-semibold text-white">${item.quantity}</span>
                <button onclick="window.changeQuantity(${item.id}, 1)" class="w-7 h-7 bg-amber-600 rounded-full text-white hover:bg-amber-700 transition-colors">
                    <i class="fas fa-plus text-xs"></i>
                </button>
            `;
        } else {
            control.innerHTML = `
                <button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors" data-product-id="${id}">
                    <i class="fas fa-plus text-sm"></i>
                </button>
            `;
            
            // Add event listener with proper scope
            const addBtn = control.querySelector('.add-btn');
            if (addBtn) {
                // Remove any existing listeners
                addBtn.replaceWith(addBtn.cloneNode(true));
                const newAddBtn = control.querySelector('.add-btn');
                
                newAddBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    // Call addToOrder from menu.js
                    import('./menu.js').then(menuModule => {
                        menuModule.addToOrder(e, id);
                    });
                });
            }
        }
    };
    
    if (productId) {
        const control = document.querySelector(`.add-to-order-controls[data-product-id="${productId}"]`);
        
        if (control) {
            updateSingleControl(control, productId);
            uiLogger.debug('Product card controls updated for specific product', {
                productId,
                inOrder: !!state.order.find(i => i.id === productId)
            });
        }
    } else {
        const allControls = document.querySelectorAll('.add-to-order-controls');
        
        allControls.forEach(control => {
            const id = parseInt(control.dataset.productId, 10);
            updateSingleControl(control, id);
        });
        
        uiLogger.debug('All product card controls updated');
    }
};

/**
 * Updates navigation wrapper's background image on mobile views.
 * @param {string} category - The category to set background for.
 */
/**
 * Updates navigation wrapper's background image on mobile views.
 * @param {string} category - The category to set background for.
 */
export const updateNavigationWrapper = (category) => {
    const navigationWrapper = elements.navigationWrapper;
    const categoryDisplaySection = document.querySelector('.category-display-section');

    if (!navigationWrapper) {
        console.error('[UI DEBUG] updateNavigationWrapper: navigationWrapper not found!');
        return;
    }

    const isMobile = window.innerWidth <= config.mobileBreakpoint;
    
    // Add class to disable transition temporarily
    navigationWrapper.classList.add('no-transition');
    
    // Initially remove classes
    navigationWrapper.classList.remove('mobile-image-bg');
    if(categoryDisplaySection) {
        categoryDisplaySection.classList.remove('hide-category-display');
    }

    // If on mobile and not specials, set background
    if (isMobile && category !== 'specials') {
        // Find active category button
        const activeCategoryBtn = document.querySelector(`.category-btn[data-main-category="${category}"]`);
        let imageUrl = activeCategoryBtn ? activeCategoryBtn.dataset.categoryImage : null;

        // --- DEBUG LOG ---
        console.log(`[UI DEBUG] updateNavigationWrapper (Mobile): Raw imageUrl is "${imageUrl}"`);
        // --- END DEBUG LOG ---

        if (imageUrl) {
            const normalizedUrl = normalizeImagePath(imageUrl);

            // --- DEBUG LOG ---
            console.log(`[UI DEBUG] updateNavigationWrapper (Mobile): Setting CSS variable --category-bg-image to url(${normalizedUrl})`);
            // --- END DEBUG LOG ---

            navigationWrapper.style.setProperty('--category-bg-image', `url(${normalizedUrl})`);
            navigationWrapper.classList.add('mobile-image-bg');
        }
        if(categoryDisplaySection) {
            categoryDisplaySection.classList.add('hide-category-display');
        }
    } else {
        navigationWrapper.style.removeProperty('--category-bg-image');
        console.log('[UI DEBUG] updateNavigationWrapper: Removing mobile background image.');
    }
    
    // Remove no-transition class after applying changes
    requestAnimationFrame(() => {
        navigationWrapper.classList.remove('no-transition');
    });
};

/**
 * Updates the main category display section (title, image, description, carousel).
 */
export const updateCategoryDisplay = () => {
    navLogger.debug('Updating category display', {
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory
    });
    
    const mainCategoryName = state.currentMainCategory.charAt(0).toUpperCase() + state.currentMainCategory.slice(1).replace('-', ' ');
    const subCategoryName = state.currentSubCategory.charAt(0).toUpperCase() + state.currentSubCategory.slice(1).replace('-', ' ');

    // Update category title
    const categoryTitleEl = document.getElementById('category-title');
    if (categoryTitleEl) {
        categoryTitleEl.textContent = subCategoryName || mainCategoryName;
        categoryTitleEl.style.color = '#fbbf24';
    }

    // Update category image
    const categoryImageEl = document.getElementById('category-image');
    const activeCategoryBtn = document.querySelector('.category-btn.active');
    if (categoryImageEl && activeCategoryBtn) {
        // مسیر تصویر را از دیتا ست آتریبیوت باتن بگیر
        let imageUrl = activeCategoryBtn.dataset.categoryImage || 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=600';
        
        // --- DEBUG LOG ---
        console.log(`[UI DEBUG] updateCategoryDisplay: Raw imageUrl from button is "${imageUrl}"`);
        // --- END DEBUG LOG ---

        // مسیر را نرمالایز کن
        const normalizedUrl = normalizeImagePath(imageUrl);

        // --- DEBUG LOG ---
        console.log(`[UI DEBUG] updateCategoryDisplay: Setting category image src to "${normalizedUrl}"`);
        // --- END DEBUG LOG ---
        
        categoryImageEl.src = normalizedUrl;
    }

    // Update category description
    const categoryDescriptionEl = document.getElementById('category-description');
    if (categoryDescriptionEl) {
        // Set description based on category and subcategory
        let description = `Choose from our delicious selection of ${mainCategoryName.toLowerCase()}`;
        if (state.currentSubCategory) {
            description = `Our ${subCategoryName.toLowerCase()} ${mainCategoryName.toLowerCase()} are made with the freshest ingredients.`;
        }
        categoryDescriptionEl.textContent = description;
    }

    // Handle specials carousel
    if (state.currentMainCategory.toLowerCase() === 'specials') {
        // Initialize carousel if not already initialized
        const specialsCarouselSection = document.getElementById('specials-carousel-section');
        if (specialsCarouselSection && !specialsCarouselSection.hasAttribute('data-initialized')) {
            initSpecialsCarousel();
            specialsCarouselSection.setAttribute('data-initialized', 'true');
        }
        
        if (elements.categoryPromptText) {
            elements.categoryPromptText.textContent = categoryData.specials ? categoryData.specials.text : 'Check out our special offers!';
            elements.categoryPromptText.classList.add('cc');
        }
        navLogger.debug('Updating display for SPECIALS');
    } else {
        if (elements.categoryPromptText) {
            elements.categoryPromptText.textContent = '';
            elements.categoryPromptText.classList.remove('cc');
        }
        navLogger.debug('Updating display for a standard category');
    }
};

/**
 * Refreshes the main categories and subcategories from the server.
 */
export const refreshCategories = async () => {
    try {
        const response = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        
        if (!response.ok) {
            throw new Error('Error fetching custom categories');
        }
        
        const customCategories = await response.json();
        
        // Update main categories
        await updateMainCategoryNav();
        
        // Update subcategories
        await updateSubCategoryNav();
        
        // If on menu page, re-render products
        if (state.currentPage === 'menu') {
            renderProducts();
        }
    } catch (error) {
        console.error('Error updating categories:', error.message);
    }
};
// ========================== END OF UI UPDATE FUNCTIONS ==========================

// ================================= UI EVENT HANDLERS =================================
/**
 * Closes the user panel sidebar with a fade-out effect.
 */
export const closeUserPanel = () => {
    uiLogger.debug('Closing user panel');
    
    elements.userPanelOverlay.classList.remove('opacity-100');
    elements.userPanelOverlay.classList.add('opacity-0');
    setTimeout(() => {
        elements.userPanelSidebar.classList.remove('open');
        elements.userPanelOverlay.classList.add('hidden');
    }, 300);
};

/**
 * Closes the order sidebar with a fade-out effect.
 */
export const closeOrderSidebar = () => {
    uiLogger.debug('Closing order sidebar');
    
    elements.orderOverlay.classList.remove('opacity-100');
    elements.orderOverlay.classList.add('opacity-0');
    setTimeout(() => {
        elements.orderSidebar.classList.remove('open');
        elements.orderOverlay.classList.add('hidden');
    }, 300);
};

/**
 * Toggles a product's favorite status and updates the UI.
 * @param {number} productId - The ID of product to toggle.
 */
export const toggleFavorite = (productId) => {
    const product = window.allMenuItems.find(p => p.id === productId);
    if (!product) {
        uiLogger.error('Product not found when toggling favorite', { productId });
        return;
    }
    
    const index = state.favorites.findIndex(fav => fav.id === productId);
    if (index > -1) {
        state.favorites.splice(index, 1);
        uiLogger.debug('Product removed from favorites', { productId, productName: product.name });
    } else {
        state.favorites.push(product);
        uiLogger.debug('Product added to favorites', { productId, productName: product.name });
    }
    
    updateFavoritesUI();
    renderProducts(); // Re-render to update the heart icon
};
// ========================== END OF UI EVENT HANDLERS ==========================

// ================================= CAROUSEL & EFFECTS FUNCTIONS =================================
/**
 * Updates the specials carousel to a specific slide or the next one.
 * @param {number|null} targetIndex - The index of the slide to show. If null, shows the next slide.
 */
export const updateSpecialsCarousel = (targetIndex = null) => {
    const slides = document.querySelectorAll('.specials-carousel-track .category-carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    if (slides.length === 0) return;
    
    const oldSlide = state.currentSpecialsSlide;
    state.currentSpecialsSlide = targetIndex !== null ? targetIndex : (state.currentSpecialsSlide + 1) % slides.length;
    
    slides.forEach((slide, index) => slide.classList.toggle('active', index === state.currentSpecialsSlide));
    indicators.forEach((dot, index) => dot.classList.toggle('active', index === state.currentSpecialsSlide));
    
    uiLogger.debug('Specials carousel updated', {
        from: oldSlide,
        to: state.currentSpecialsSlide,
        totalSlides: slides.length
    });
    
    resetSpecialsCarouselInterval();
};

/**
 * Initializes the specials carousel by setting up click listeners for indicators and starting the auto-play interval.
 */
export const initSpecialsCarousel = () => {
    // Check if carousel exists
    const specialsCarouselTrack = document.querySelector('.specials-carousel-track');
    if (!specialsCarouselTrack) {
        uiLogger.warn('Specials carousel track not found');
        return;
    }
    
    // Prevent re-initialization
    if (carouselInitialized) {
        return;
    }
    carouselInitialized = true;
    
    // Create slides using specialsAlbumData
    specialsCarouselTrack.innerHTML = specialsAlbumData.map((item, index) => `
        <div class="category-carousel-slide ${index === 0 ? 'active' : ''}" data-slide-id="${index}">
            <div class="carousel-slide-info">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
            </div>
        </div>
    `).join('');
    
    // Set background image for each slide
    const slides = document.querySelectorAll('.category-carousel-slide');
    slides.forEach((slide, index) => {
        const imageUrl = specialsAlbumData[index].imageUrl;
        slide.style.backgroundImage = `url(${imageUrl})`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
    });
    
    // Create indicators
    const indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'carousel-indicators';
    
    specialsAlbumData.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
        indicator.dataset.slideTo = index;
        indicator.addEventListener('click', () => {
            uiLogger.info('Specials carousel indicator clicked', { 
                from: state.currentSpecialsSlide, 
                to: index 
            });
            updateSpecialsCarousel(index);
            startSpecialsCarouselInterval();
        });
        indicatorsContainer.appendChild(indicator);
    });
    
    // Add indicators to carousel container
    const specialsContainer = document.querySelector('.specials-carousel-container');
    if (specialsContainer) {
        // Check if indicators already exist
        const existingIndicators = specialsContainer.querySelector('.carousel-indicators');
        if (!existingIndicators) {
            specialsContainer.appendChild(indicatorsContainer);
        }
    }
    
    // Set initial active slide
    state.currentSpecialsSlide = 0;
    
    // Start auto-play animation
    startSpecialsCarouselInterval();
    
    uiLogger.info('Specials carousel initialized', {
        totalSlides: slides.length,
        intervalTime: config.specialsCarouselIntervalTime
    });
};

/**
 * Starts the auto-play interval for the specials carousel.
 */
export const startSpecialsCarouselInterval = () => {
    clearInterval(state.specialsCarouselInterval);
    state.specialsCarouselInterval = setInterval(() => updateSpecialsCarousel(), config.specialsCarouselIntervalTime);
    
    uiLogger.debug('Specials carousel auto-play started', {
        intervalTime: config.specialsCarouselIntervalTime
    });
};

/**
 * Resets the auto-play interval for the specials carousel, typically after user interaction.
 */
export const resetSpecialsCarouselInterval = () => {
    clearInterval(state.specialsCarouselInterval);
    startSpecialsCarouselInterval();
    
    uiLogger.debug('Specials carousel interval reset');
};

/**
 * Dynamically sets the height of the specials carousel container based on the aspect ratio of the active slide image.
 */
export const setSpecialsCarouselHeight = () => {
    const specialsContainer = document.querySelector('.specials-carousel-container');
    const activeSlide = document.querySelector('.category-carousel-slide.active');
    if (!specialsContainer || !activeSlide) return;
    
    const imageUrl = activeSlide.style.backgroundImage.slice(5, -2);
    const img = new Image();
    img.onload = function() {
        const aspectRatio = this.naturalHeight / this.naturalWidth;
        const containerWidth = specialsContainer.offsetWidth;
        specialsContainer.style.height = `${containerWidth * aspectRatio}px`;
        
        uiLogger.debug('Specials carousel height set', {
            imageUrl,
            aspectRatio,
            containerWidth,
            calculatedHeight: containerWidth * aspectRatio
        });
    };
    img.src = imageUrl;
};

/**
 * Creates and animates smoke puff effects for the category display section.
 */
export const startCategorySmoke = () => {
    if (state.currentMainCategory === 'specials') return;
    
    const smokeContainer = document.getElementById('category-smoke-container');
    if (!smokeContainer) return;
    
    if (window.categorySmokeInterval) clearInterval(window.categorySmokeInterval);
    smokeContainer.innerHTML = '';
    
    function createSmokePuff() {
        const puff = document.createElement('div');
        puff.classList.add('smoke-puff');
        const randomOffset = (Math.random() - 0.5) * 40;
        puff.style.left = `calc(50% + ${randomOffset}px)`;
        const randomDuration = Math.random() * 2 + 3;
        puff.style.animationDuration = `${randomDuration}s`;
        const randomSize = Math.random() * 30 + 40;
        puff.style.width = `${randomSize}px`;
        puff.style.height = `${randomSize}px`;
        smokeContainer.appendChild(puff);
        puff.addEventListener('animationend', () => puff.remove());
    }
    
    for (let i = 0; i < 3; i++) setTimeout(createSmokePuff, i * 700);
    window.categorySmokeInterval = setInterval(createSmokePuff, 800);
    
    uiLogger.debug('Category smoke effect started');
};

/**
 * Updates the top position of the sticky navigation to be right below the header.
 */
export const updateStickyNavPosition = () => {
    const header = elements.headerContainer;
    const navigationWrapper = elements.navigationWrapper;
    const mainElement = document.querySelector('main');

    if (header && navigationWrapper && mainElement) {
        const headerHeight = header.offsetHeight;
        navigationWrapper.style.top = `${headerHeight}px`;
        mainElement.style.paddingTop = `${headerHeight}px`;
        
        uiLogger.debug('Sticky navigation position updated', {
            headerHeight
        });
    } else {
        uiLogger.warn('Could not update sticky navigation position: missing elements');
    }
};
// ========================== END OF CAROUSEL & EFFECTS FUNCTIONS ==========================

// ================================= PERFORMANCE ANALYSIS & RENDER CONTROL =================================
/**
 * Checks for any currently active animations or intervals on the page.
 * @returns {Object} An object containing details about active animations.
 */
const checkForActiveAnimations = () => {
    const activeAnimations = {
        intervals: [],
        timeouts: [],
        cssAnimations: [],
        flyingImages: 0,
    };

    // Check for active intervals (a bit tricky, but we can check known ones)
    if (state.specialsCarouselInterval) {
        activeAnimations.intervals.push('Specials Carousel');
    }
    if (window.categorySmokeInterval) {
        activeAnimations.intervals.push('Category Smoke');
    }

    // Check for elements with animation classes
    const animatedElements = document.querySelectorAll('[class*="animate"], [class*="transition"], .flying-image, .shake-animation');
    activeAnimations.cssAnimations = Array.from(animatedElements).map(el => ({
        element: el.tagName + (el.className ? '.' + el.className.split(' ').find(c => c.includes('animate') || c.includes('transition')) : ''),
        animationState: window.getComputedStyle(el).animationPlayState
    }));

    // Check for flying images
    const flyingImages = document.querySelectorAll('.flying-image');
    activeAnimations.flyingImages = flyingImages.length;

    return activeAnimations;
};

/**
 * Analyzes, logs, and controls the entire page rendering process.
 * This function should be the primary entry point for navigation to get detailed insights.
 * @param {string} pageId - The ID of page to render (e.g., 'home', 'menu').
 * @param {string} [newCategory] - The new main category to switch to (optional).
 */
export const analyzeAndRenderPage = async (pageId, newCategory) => {
    const masterMonitor = createPerformanceMonitor(`FullPageRender: ${pageId}`);
    uiLogger.section(`===== STARTING ANALYSIS & RENDER FOR: ${pageId.toUpperCase()} =====`);

    // 1. Log Initial State
    const initialAnimations = checkForActiveAnimations();
    uiLogger.info('Initial State Check', {
        targetPage: pageId,
        currentPage: state.currentPage,
        currentCategory: state.currentMainCategory,
        activeAnimationsAtStart: initialAnimations
    });

    // 2. Start the core rendering process
    uiLogger.info('--- Core Page Switch ---');
    const pageSwitchMonitor = createPerformanceMonitor('Page Switch');
    
    const oldPage = state.currentPage;
    const oldCategory = state.currentMainCategory;

    // Perform the actual page switch
    const body = document.body;
    body.classList.toggle('menu-page-active', pageId === 'menu');
    elements.pageSections.forEach(section => section.classList.toggle('active', section.id === `${pageId}-page`));
    elements.navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
    elements.mobileBottomNavItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageId));
    state.currentPage = pageId;
    elements.menuOrderBtn.classList.toggle('hidden', pageId !== 'menu');

    pageSwitchMonitor.end({ from: oldPage, to: pageId });
    uiLogger.info('--- Core Page Switch Finished ---');

    // 3. If it's the menu page, run the complex rendering pipeline
    if (pageId === 'menu') {
        uiLogger.info('--- Starting Menu Page Rendering Pipeline ---');
        
        // Ensure order button is visible
        elements.menuOrderBtn.style.display = 'flex';
        elements.menuOrderBtn.style.visibility = 'visible';
        elements.menuOrderBtn.style.width = '56px';
        elements.menuOrderBtn.style.height = '56px';

        // Handle category change
        if (newCategory) {
            state.currentMainCategory = newCategory;
            state.currentSubCategory = '';
            uiLogger.info('Category Changed', { from: oldCategory, to: newCategory });
        }

        // A. Update Navigation Wrapper
        uiLogger.info('--- Step 1: Updating Navigation Wrapper ---');
        const navWrapperMonitor = createPerformanceMonitor('updateNavigationWrapper');
        updateNavigationWrapper(state.currentMainCategory);
        navWrapperMonitor.end();
        uiLogger.info('--- Step 1 Finished ---');

        // B. Update Main & Sub Category Navigation (in parallel)
        uiLogger.info('--- Step 2: Updating Category Navigation (Parallel) ---');
        const categoryNavMonitor = createPerformanceMonitor('updateMainCategoryNav');
        const subCategoryNavMonitor = createPerformanceMonitor('updateSubCategoryNav');
        await Promise.all([
            updateMainCategoryNav().finally(() => categoryNavMonitor.end()),
            updateSubCategoryNav().finally(() => subCategoryNavMonitor.end())
        ]);
        uiLogger.info('--- Step 2 Finished ---');

        // C. Update Category Display
        uiLogger.info('--- Step 3: Updating Category Display ---');
        const displayMonitor = createPerformanceMonitor('updateCategoryDisplay');
        updateCategoryDisplay();
        displayMonitor.end();
        uiLogger.info('--- Step 3 Finished ---');

        // D. Render Products (most intensive part)
        uiLogger.info('--- Step 4: Rendering Products (Most Intensive) ---');
        const productRenderMonitor = createPerformanceMonitor('renderProducts');
        renderProducts();
        productRenderMonitor.end();
        uiLogger.info('--- Step 4 Finished ---');

        uiLogger.info('--- Menu Page Rendering Pipeline Finished ---');
    }

    // 4. Log Final State and Performance Summary
    const finalAnimations = checkForActiveAnimations();
    uiLogger.info('Final State Check', {
        currentPage: state.currentPage,
        currentCategory: state.currentMainCategory,
        activeAnimationsAtEnd: finalAnimations
    });

    masterMonitor.end({
        page: pageId,
        category: state.currentMainCategory,
        animationDelta: {
            startedWith: initialAnimations.intervals.length,
            endedWith: finalAnimations.intervals.length
        }
    });
    
    uiLogger.section(`===== END ANALYSIS & RENDER FOR: ${pageId.toUpperCase()} =====`);
    logDetailedMenuState('After analyzeAndRenderPage');
};
// ========================== END OF PERFORMANCE ANALYSIS ==========================
// ============================== END OF JAVASCRIPT FILE ==============================