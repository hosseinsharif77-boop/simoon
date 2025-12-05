// ================================= IMPORTS =================================
import { elements, config, IMAGE_BASE_PATH } from './config.js';
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
import { stateManager } from './stateManager.js';
// ========================== END OF IMPORTS ==========================

// ================================= STATE MANAGEMENT =================================
let isRenderingMenu = false;
let carouselInitialized = false;
// ========================== END OF STATE MANAGEMENT ==========================

// ================================= UI UPDATE FUNCTIONS =================================
export const updateOrderUI = () => {
    const state = stateManager.getState();
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

export const updateFavoritesUI = () => {
    const state = stateManager.getState();
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
export const showPage = async (pageId, newCategory) => {
    console.log('===== SHOW PAGE START =====');
    console.log('Page ID:', pageId);
    console.log('New Category:', newCategory);
    
    if (isRenderingMenu && pageId === 'menu') {
        console.log('Menu rendering already in progress, skipping...');
        return;
    }
    
    isRenderingMenu = true;
    
    const monitor = createPerformanceMonitor('showPage');
    uiLogger.section(`Displaying Page: ${pageId}`);
    
    const state = stateManager.getState();
    console.log('Current State:', state);
    
    const oldPage = state.currentPage;
    const oldCategory = state.currentMainCategory;
    
    const body = document.body;
    body.classList.toggle('menu-page-active', pageId === 'menu');
    elements.pageSections.forEach(section => section.classList.toggle('active', section.id === `${pageId}-page`));
    elements.navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
    elements.mobileBottomNavItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageId));

    stateManager.setState({ currentPage: pageId });
    
    elements.menuOrderBtn.classList.toggle('hidden', pageId !== 'menu');
    
    if (pageId === 'menu') {
        console.log('===== MENU PAGE LOGIC START =====');
        elements.menuOrderBtn.style.display = 'flex';
        elements.menuOrderBtn.style.visibility = 'visible';
        elements.menuOrderBtn.style.width = '56px';
        elements.menuOrderBtn.style.height = '56px';
        
        if (newCategory && newCategory !== state.currentMainCategory) {
            stateManager.setState({ 
                currentMainCategory: newCategory,
                currentSubCategory: '' 
            });
            console.log('Category changed:', {
                oldCategory,
                newCategory,
                resetSubcategory: true
            });
        }

        // === شروع بخش اصلاح شده: نمایش اسپینر همیشه ===
        // همیشه اسپینر را قبل از رندر کردن نمایش بده
        const menuGrid = document.getElementById('menu-grid');
        if (menuGrid) {
            menuGrid.innerHTML = `
                <div class="flex justify-center items-center col-span-full py-12">
                    <div class="product-spinner"></div>
                </div>
            `;
        }
        // === پایان بخش اصلاح شده ===

        updateNavigationWrapper(stateManager.getState().currentMainCategory);

        // Always show subcategory nav
        elements.subcategoryNav.classList.remove('hidden');
        console.log('Subcategory nav forced to show');

        const categoryDisplaySection = document.querySelector('.category-display-section');
        const specialsCarouselSection = document.getElementById('specials-carousel-section');
        
        console.log('===== CAROUSEL VISIBILITY LOGIC =====');
        console.log('Category Display Section:', categoryDisplaySection);
        console.log('Specials Carousel Section:', specialsCarouselSection);
        
        const currentState = stateManager.getState();
        console.log('Current Main Category:', currentState.currentMainCategory);
        
        // اصلاح: کاروسل فقط در تب Special (با حرف بزرگ) نمایش داده بشه
        if (currentState.currentMainCategory === 'Special') {
            console.log('Hiding category display, showing specials carousel');
            categoryDisplaySection?.classList.add('hidden');
            specialsCarouselSection?.classList.remove('hidden');
            specialsCarouselSection.style.minHeight = '300px';
            
            // Initialize carousel if not already done
            if (!specialsCarouselSection.hasAttribute('data-initialized')) {
                console.log('Initializing specials carousel...');
                initSpecialsCarousel();
                specialsCarouselSection.setAttribute('data-initialized', 'true');
            }
        } else {
            console.log('Showing category display, hiding specials carousel');
            categoryDisplaySection?.classList.remove('hidden');
            specialsCarouselSection?.classList.add('hidden');
            specialsCarouselSection.style.minHeight = '0';
            
            // Clear carousel content
            const track = specialsCarouselSection?.querySelector('.specials-carousel-track');
            const indicators = specialsCarouselSection?.querySelector('.specials-carousel-indicators');
            if (track) track.innerHTML = '';
            if (indicators) indicators.innerHTML = '';
            specialsCarouselSection?.removeAttribute('data-initialized');
        }
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mainCategory === currentState.currentMainCategory);
        });

        elements.navigationWrapper.offsetHeight;

        await Promise.all([
            updateMainCategoryNav(),
            updateSubCategoryNav()
        ]);
        
        updateCategoryDisplay();
        renderProducts();
        
        setTimeout(() => {
            if (elements.menuOrderBtn) {
                elements.menuOrderBtn.style.display = 'flex';
                elements.menuOrderBtn.style.visibility = 'visible';
                elements.menuOrderBtn.style.width = '56px';
                elements.menuOrderBtn.style.height = '56px';
            }
        }, 100);
        
        console.log('===== MENU PAGE LOGIC END =====');
    }
    
    monitor.end({
        from: oldPage,
        to: pageId,
        categoryChanged: oldCategory !== stateManager.getState().currentMainCategory
    });
    
    uiLogger.endSection();
    logDetailedMenuState('After showPage');
    isRenderingMenu = false;
    console.log('===== SHOW PAGE END =====');
};

export const updateOrderTypeUI = () => {
    const selectedOrderType = document.querySelector('input[name="order-type"]:checked').value;
    elements.tableInfoContainer.classList.toggle('hidden', selectedOrderType !== 'dine-in');
    elements.deliveryAddressContainer.classList.toggle('hidden', selectedOrderType !== 'delivery');
    
    const state = stateManager.getState();
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

export const updateMainCategoryNav = async () => {
    console.log('===== UPDATE MAIN CATEGORY NAV START =====');
    const monitor = createPerformanceMonitor('updateMainCategoryNav');
    navLogger.section('Updating Main Category Navigation');
    
    try {
        console.log('Fetching custom categories...');
        const response = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        if (!response.ok) throw new Error('Error fetching custom categories');
        const customCategories = await response.json();
        console.log('Custom categories received:', customCategories);
        
        const customMainCategories = customCategories
            .filter(item => item.type === 'category')
            .map(item => item.name);
        
        console.log('Custom main categories found:', { categories: customMainCategories });
        
        const hasSpecialProducts = window.allMenuItems && window.allMenuItems.some(item => item.is_special === true);
        console.log('Has special products:', hasSpecialProducts);
        
        if (hasSpecialProducts && !customMainCategories.includes('Special')) {
            customMainCategories.push('Special');
            console.log('Added Special category because special products exist');
        }
        
        const mainCategoryNav = document.querySelector('#menu-nav nav');
        if (!mainCategoryNav) {
            navLogger.error('Main category navigation not found');
            return;
        }
        
        const existingButtons = Array.from(mainCategoryNav.querySelectorAll('.category-btn'));
        const existingCategories = existingButtons.map(btn => btn.dataset.mainCategory);
        console.log('Existing category buttons:', existingCategories);
        
        const fragment = document.createDocumentFragment();
        
        customMainCategories.forEach(category => {
            if (!existingCategories.includes(category)) {
                console.log('Creating button for category:', category);
                const button = document.createElement('button');
                button.className = 'category-btn';
                
                if (category === 'Special') {
                    button.innerHTML = '<i class="bi bi-star-fill"></i> Special';
                    button.classList.add('special-tab');
                } else {
                    button.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                }
                
                button.dataset.mainCategory = category; 
                
                if (category === 'Special') {
                    button.dataset.categoryImage = 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600';
                } else {
                    button.dataset.categoryImage = 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=600';
                }
                
                button.addEventListener('click', () => {
                    const state = stateManager.getState();
                    logNavigationEvent(`Category Button (${state.currentMainCategory})`, `Category Button (${category})`, { 
                        triggeredBy: 'categoryBtn',
                        category: category 
                    });
                    showPage('menu', category);
                });
                
                fragment.appendChild(button);
            }
        });
        
        mainCategoryNav.appendChild(fragment);
        elements.categoryBtns = document.querySelectorAll('.category-btn');

        const currentState = stateManager.getState();
        if (currentState.currentPage === 'home' && !currentState.currentMainCategory) {
            stateManager.setState({ 
                currentMainCategory: 'all',
                currentSubCategory: ''
            });
        }

        elements.categoryBtns.forEach(btn => {
            const isActive = btn.dataset.mainCategory === currentState.currentMainCategory;
            btn.classList.toggle('active', isActive);
        });

        monitor.end({ categoriesCount: customMainCategories.length });
        navLogger.endSection();
    } catch (error) {
        navLogger.error('Error updating main categories', error);
        monitor.end({ error: true });
    }
    console.log('===== UPDATE MAIN CATEGORY NAV END =====');
};


export const logSubNavHeights = (context) => {
    const subNav = document.querySelector('.subcategory-nav');
    if (!subNav) {
        console.warn(`[SUB-NAV-LOG] Subcategory nav not found for context: ${context}`);
        return;
    }

    const computedStyle = window.getComputedStyle(subNav);
    const height = parseFloat(computedStyle.height);
    const minHeight = parseFloat(computedStyle.minHeight);

    console.group(`📏 [SUB-NAV-LOG] Height Analysis for: ${context}`);
    console.log('Element:', subNav);
    console.log('Current Computed Height (px):', height);
    console.log('Min-Height (px):', minHeight);
    console.log('Height - MinHeight (px):', height - minHeight);
    console.log('Classes:', subNav.className);
    console.log('Padding Top:', computedStyle.paddingTop);
    console.log('Padding Bottom:', computedStyle.paddingBottom);
    console.log('Border Top:', computedStyle.borderTopWidth);
    console.log('Border Bottom:', computedStyle.borderBottomWidth);
    console.groupEnd();
};

export const updateSubCategoryNav = async () => {
    console.log('===== UPDATE SUBCATEGORY NAV START =====');
    const monitor = createPerformanceMonitor('updateSubCategoryNav');
    navLogger.section('Updating Subcategory Navigation');
    
    const state = stateManager.getState();
    console.log('Current state:', state);
    console.log('Current main category:', { category: state.currentMainCategory });
    
    const subCategoryNav = elements.subcategoryNav.querySelector('nav');
    console.log('Subcategory nav element:', subCategoryNav);
    console.log('Subcategory nav element classes:', subCategoryNav?.className);
    console.log('Subcategory nav element innerHTML:', subCategoryNav?.innerHTML);
    
    // اصلاح: همیشه نوار زیرشاخه رو نمایش بده
    elements.subcategoryNav.classList.remove('hidden');
    console.log('Subcategory nav visibility forced to show');
    
    // اصلاح: اگر تب all یا Special باشه، ناو رو خالی کن اما نمایش بده و پیام مناسب نمایش بده
    if (state.currentMainCategory === 'all' || state.currentMainCategory === 'Special') {
        console.log('Emptying subcategory nav for all/Special tab');
        
        // به جای خالی کردن کامل، یک نوار خالی با ارتفاع مناسب ایجاد می‌کنیم
        subCategoryNav.innerHTML = '<div class="subcategory-empty-placeholder"></div>';
        
        stateManager.setState({ currentSubCategory: '' });
        console.log('Subcategory nav emptied and state reset');
        console.log('===== UPDATE SUBCATEGORY NAV END =====');
        return;
    }
    
    try {
        console.log('Fetching custom categories...');
        const response = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        if (!response.ok) throw new Error('Error fetching custom subcategories');
        const customCategories = await response.json();
        console.log('Custom categories received:', customCategories);
        
        const subcategoriesFromProducts = [...new Set(
            window.allMenuItems
                .filter(item => item.mainCategory === state.currentMainCategory && item.subCategory)
                .map(item => item.subCategory)
        )];
        
        console.log('Subcategories from products:', subcategoriesFromProducts);
        
        let customSubcategories = [];
        
        if (state.currentMainCategory === 'all') {
            customSubcategories = customCategories
                .filter(item => item.type === 'subcategory')
                .map(item => item.name);
        } else {
            const mainCategory = customCategories.find(cat => cat.name === state.currentMainCategory && cat.type === 'category');
            const mainCategoryId = mainCategory ? mainCategory.id : null;
            
            customSubcategories = customCategories
                .filter(item => item.type === 'subcategory' && item.parent_category_id === mainCategoryId)
                .map(item => item.name);
        }

        const allSubcategories = [...new Set([...subcategoriesFromProducts, ...customSubcategories])];
        console.log('All subcategories combined:', allSubcategories);

        const fragment = document.createDocumentFragment();
        
        if (allSubcategories.length > 0) {
            console.log('Creating subcategory buttons...');
            allSubcategories.forEach(sub => {
                const button = document.createElement('button');
                button.className = 'subcategory-btn';
                button.textContent = sub.charAt(0).toUpperCase() + sub.slice(1);
                button.dataset.subCategory = sub;
                
                button.addEventListener('click', () => {
                    console.log('Subcategory button clicked:', sub);
                    stateManager.setState({ currentSubCategory: sub });
                    setActiveSubcategoryButton(sub);
                    renderProducts();
                    updateCategoryDisplay();
                });
                
                fragment.appendChild(button);
            });

            subCategoryNav.innerHTML = '';
            subCategoryNav.appendChild(fragment);
            console.log('Subcategory buttons added to nav');

            const firstSubcategory = allSubcategories[0];
            if (firstSubcategory && (!state.currentSubCategory || !allSubcategories.includes(state.currentSubCategory))) {
                stateManager.setState({ currentSubCategory: firstSubcategory });
                setActiveSubcategoryButton(firstSubcategory);
            } else if (state.currentSubCategory) {
                setActiveSubcategoryButton(state.currentSubCategory);
            }
        } else {
            console.log('No subcategories found, clearing nav');
            subCategoryNav.innerHTML = '';
            stateManager.setState({ currentSubCategory: '' });
        }
        
        renderProducts();
        updateCategoryDisplay();
        
        monitor.end({
            category: state.currentMainCategory,
            subcategoriesCount: allSubcategories.length,
            activeSubcategory: state.currentSubCategory
        });
        
        navLogger.endSection();
        logDetailedMenuState('After updateSubCategoryNav');
    } catch (error) {
        console.error('Error in updateSubCategoryNav:', error);
        navLogger.error('Error updating subcategories', error);
    }

    requestAnimationFrame(() => {
        logSubNavHeights('After updateSubCategoryNav');
    });
    
    console.log('===== UPDATE SUBCATEGORY NAV END =====');
};

// اصلاح ۴: توابع برای مدیریت loading spinner
function showSubcategoryLoading() {
    const subCategoryNav = elements.subcategoryNav.querySelector('nav');
    if (subCategoryNav) {
        subCategoryNav.innerHTML = `
            <div class="flex justify-center items-center py-4">
                <div class="subcategory-spinner"></div>
            </div>
        `;
    }
}

function hideSubcategoryLoading() {
    // این تابع در updateSubCategoryNav فراخوانی می‌شود
    // و محتوای ناو با دکمه‌های واقعی جایگزین می‌شود
}

const renderFilteredProducts = () => {
    const monitor = createPerformanceMonitor('renderFilteredProducts');
    
    menuLogger.section('Render Filtered Products');
    
    requestAnimationFrame(() => {
        menuLogger.debug('Current state for rendering', {
            totalItems: window.allMenuItems.length,
            filteredItemsCount: filteredMenuItems.length
        });
        
        const fragment = document.createDocumentFragment();
        
        if (filteredMenuItems.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state text-center py-12 col-span-full';
            emptyMessage.innerHTML = `<p class="text-gray-500">No products found for "<span class="font-semibold">${document.getElementById('product-search').value}</span>"</p>`;
            fragment.appendChild(emptyMessage);
        } else {
            filteredMenuItems.forEach((item, index) => {
                const productCard = createProductCard(item, index);
                fragment.appendChild(productCard);
            });
        }
        
        const menuGrid = document.getElementById('menu-grid');
        menuGrid.innerHTML = '';
        menuGrid.appendChild(fragment);
        
        menuLogger.debug('Filtered products rendered', {
            filteredItemsCount: filteredMenuItems.length
        });
        
        attachProductEventListeners();
        updateProductCardControls();
        
        monitor.end({ totalItems: window.allMenuItems.length, filteredItems: filteredMenuItems.length });
        menuLogger.endSection();
    });
};

export const setActiveSubcategoryButton = (subcategoryName) => {
    navLogger.debug('Setting active subcategory button', { subcategoryName });
    
    document.querySelectorAll('.subcategory-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (subcategoryName) {
        const activeBtn = document.querySelector(`.subcategory-btn[data-sub-category="${subcategoryName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
            navLogger.debug('Subcategory button activated', { subcategoryName });
        } else {
            navLogger.warn('Subcategory button not found', { subcategoryName });
        }
    }
};

export const updateProductCardControls = (productId = null) => {
    const state = stateManager.getState();
    
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
            
            const addBtn = control.querySelector('.add-btn');
            if (addBtn) {
                addBtn.replaceWith(addBtn.cloneNode(true));
                const newAddBtn = control.querySelector('.add-btn');
                
                newAddBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
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

export const updateNavigationWrapper = (category) => {
    console.log('===== UPDATE NAVIGATION WRAPPER START =====');
    console.log('Category for wrapper:', category);
    
    const navigationWrapper = elements.navigationWrapper;
    const categoryDisplaySection = document.querySelector('.category-display-section');

    if (!navigationWrapper) {
        console.error('[UI DEBUG] updateNavigationWrapper: navigationWrapper not found!');
        return;
    }

    const isMobile = window.innerWidth <= config.mobileBreakpoint;
    console.log('Is mobile:', isMobile);
    
    navigationWrapper.classList.add('no-transition');
    
    navigationWrapper.classList.remove('mobile-image-bg');
    if(categoryDisplaySection) {
        categoryDisplaySection.classList.remove('hide-category-display');
    }

    if (isMobile && category !== 'Special') {
        const activeCategoryBtn = document.querySelector(`.category-btn[data-main-category="${category}"]`);
        let imageUrl = activeCategoryBtn ? activeCategoryBtn.dataset.categoryImage : null;

        console.log(`[UI DEBUG] updateNavigationWrapper (Mobile): Raw imageUrl is "${imageUrl}"`);

        if (imageUrl) {
            const normalizedUrl = normalizeImagePath(imageUrl);

            console.log(`[UI DEBUG] updateNavigationWrapper (Mobile): Setting CSS variable --category-bg-image to url(${normalizedUrl})`);

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
    
    requestAnimationFrame(() => {
        navigationWrapper.classList.remove('no-transition');
    });
    
    console.log('===== UPDATE NAVIGATION WRAPPER END =====');
};

export const updateCategoryDisplay = () => {
    console.log('===== UPDATE CATEGORY DISPLAY START =====');
    const state = stateManager.getState();
    console.log('Current state:', state);
    navLogger.debug('Updating category display', {
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory
    });
    
    const categoryImageContainer = document.querySelector('.category-image-container');
    console.log('Category image container:', categoryImageContainer);
    console.log('Category image container classes:', categoryImageContainer?.className);
    
    // اصلاح: مخفی کردن عکس دسته‌بندی در تب all و Special با انیمیشن مناسب
    if (state.currentMainCategory === 'all' || state.currentMainCategory === 'Special') {
        console.log('Hiding category image for all/Specials tab');
        
        if (categoryImageContainer) {
            // اضافه کردن کلاس hidden بلافاصله برای جلوگیری از نمایش اولیه
            categoryImageContainer.classList.add('hidden');
            categoryImageContainer.classList.remove('fade-out', 'fade-in');
            
            // اگر دیو از قبل نمایش داده شده باشد، انیمیشن محو شدن را اجرا کن
            if (!categoryImageContainer.classList.contains('hidden')) {
                categoryImageContainer.classList.remove('hidden');
                categoryImageContainer.classList.add('fade-out');
                
                setTimeout(() => {
                    categoryImageContainer.classList.add('hidden');
                    categoryImageContainer.classList.remove('fade-out');
                }, 300);
            }
        }
    } else {
        console.log('Showing category image for regular tab');
        
        if (categoryImageContainer) {
            // حذف کلاس hidden و انیمیشن‌ها
            categoryImageContainer.classList.remove('hidden', 'fade-out');
            
            // اضافه کردن کلاس fade-in برای انیمیشن ظاهر شدن
            categoryImageContainer.classList.add('fade-in');
            
            // بعد از اتمام انیمیشن، کلاس fade-in را حذف می‌کنیم
            setTimeout(() => {
                categoryImageContainer.classList.remove('fade-in');
            }, 300);
        }
    }
    
    // بقیه کد بدون تغییر باقی می‌ماند...
    const mainCategoryName = state.currentMainCategory.charAt(0).toUpperCase() + state.currentMainCategory.slice(1).replace('-', ' ');
    const subCategoryName = state.currentSubCategory ? state.currentSubCategory.charAt(0).toUpperCase() + state.currentSubCategory.slice(1).replace('-', ' ') : '';

    const categoryTitleEl = document.getElementById('category-title');
    console.log('Category title element:', categoryTitleEl);
    console.log('Category title element innerHTML:', categoryTitleEl?.innerHTML);
    
    if (categoryTitleEl) {
        if (state.currentMainCategory === 'Special') {
            categoryTitleEl.innerHTML = '<i class="bi bi-star-fill"></i> Special Offers';
        } else {
            categoryTitleEl.textContent = subCategoryName || mainCategoryName;
        }
        categoryTitleEl.style.color = '#fbbf24';
    }

    const categoryImageEl = document.getElementById('category-image');
    const activeCategoryBtn = document.querySelector('.category-btn.active');
    console.log('Category image element:', categoryImageEl);
    console.log('Active category button:', activeCategoryBtn);
    
    if (categoryImageEl && activeCategoryBtn) {
        let imageUrl = activeCategoryBtn.dataset.categoryImage || 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=600';
        console.log('Image URL:', imageUrl);
        
        const normalizedUrl = normalizeImagePath(imageUrl);
        categoryImageEl.src = normalizedUrl;
    }

    const categoryDescriptionEl = document.getElementById('category-description');
    if (categoryDescriptionEl) {
        let description = '';
        
        if (state.currentMainCategory === 'Special') {
            description = 'Check out our special offers and limited-time deals!';
        } else if (state.currentSubCategory) {
            description = `Our ${subCategoryName.toLowerCase()} ${mainCategoryName.toLowerCase()} are made with freshest ingredients.`;
        } else {
            description = `Choose from our delicious selection of ${mainCategoryName.toLowerCase()}`;
        }
        
        categoryDescriptionEl.textContent = description;
    }

    const categorySmokeContainer = document.getElementById('category-smoke-container');
    if (categorySmokeContainer) {
        if (state.currentMainCategory === 'Special' || state.currentMainCategory === 'all') {
            categorySmokeContainer.classList.add('hidden');
        } else {
            categorySmokeContainer.classList.remove('hidden');
        }
    }

    console.log('Category display updated successfully');
    console.log('===== UPDATE CATEGORY DISPLAY END =====');
};

export const refreshCategories = async () => {
    try {
        const response = await fetch(`${config.API_BASE_URL}/api/admin/custom-categories`);
        
        if (!response.ok) {
            throw new Error('Error fetching custom categories');
        }
        
        const customCategories = await response.json();
        
        await updateMainCategoryNav();
        await updateSubCategoryNav();
        
        const state = stateManager.getState();
        if (state.currentPage === 'menu') {
            renderProducts();
        }
    } catch (error) {
        console.error('Error updating categories:', error.message);
    }
};
// ========================== END OF UI UPDATE FUNCTIONS ==========================

// ================================= UI EVENT HANDLERS =================================
export const closeUserPanel = () => {
    uiLogger.debug('Closing user panel');
    
    elements.userPanelOverlay.classList.remove('opacity-100');
    elements.userPanelOverlay.classList.add('opacity-0');
    setTimeout(() => {
        elements.userPanelSidebar.classList.remove('open');
        elements.userPanelOverlay.classList.add('hidden');
    }, 300);
};

export const closeOrderSidebar = () => {
    uiLogger.debug('Closing order sidebar');
    
    elements.orderOverlay.classList.remove('opacity-100');
    elements.orderOverlay.classList.add('opacity-0');
    setTimeout(() => {
        elements.orderSidebar.classList.remove('open');
        elements.orderOverlay.classList.add('hidden');
    }, 300);
};

export const toggleFavorite = (productId) => {
    const product = window.allMenuItems.find(p => p.id === productId);
    if (!product) {
        uiLogger.error('Product not found when toggling favorite', { productId });
        return;
    }
    
    const state = stateManager.getState();
    const index = state.favorites.findIndex(fav => fav.id === productId);
    let updatedFavorites;
    
    if (index > -1) {
        updatedFavorites = state.favorites.filter(fav => fav.id !== productId);
        uiLogger.debug('Product removed from favorites', { productId, productName: product.name });
    } else {
        updatedFavorites = [...state.favorites, product];
        uiLogger.debug('Product added to favorites', { productId, productName: product.name });
    }
    
    stateManager.setState({ favorites: updatedFavorites });
    updateFavoritesUI();
    renderProducts();
};
// ========================== END OF UI EVENT HANDLERS ==========================

// ================================= CAROUSEL & EFFECTS FUNCTIONS =================================
export const updateSpecialsCarousel = (targetIndex = null) => {
    const slides = document.querySelectorAll('.specials-carousel-track .category-carousel-slide');
    const indicators = document.querySelectorAll('.indicator');
    if (slides.length === 0) return;
    
    const state = stateManager.getState();
    const oldSlide = state.currentSpecialsSlide;
    const newSlide = targetIndex !== null ? targetIndex : (state.currentSpecialsSlide + 1) % slides.length;
    
    stateManager.setState({ currentSpecialsSlide: newSlide });
    
    slides.forEach((slide, index) => slide.classList.toggle('active', index === newSlide));
    indicators.forEach((dot, index) => dot.classList.toggle('active', index === newSlide));
    
    uiLogger.debug('Specials carousel updated', {
        from: oldSlide,
        to: newSlide,
        totalSlides: slides.length
    });
    
    resetSpecialsCarouselInterval();
};

// در ui.js
export const initSpecialsCarousel = async () => {
    console.log('===== INIT SPECIALS CAROUSEL START =====');
    uiLogger.section('Initializing Specials Carousel');
    
    const specialsCarouselTrack = document.querySelector('.specials-carousel-track');
    if (!specialsCarouselTrack) {
        uiLogger.error('Specials carousel track (.specials-carousel-track) not found in DOM!');
        return;
    }
    
    if (carouselInitialized) {
        uiLogger.info('Specials carousel already initialized, skipping.');
        return;
    }

    // به جای فیلتر کردن محصولات، اسلایدها را از API جدید واکشی می‌کنیم
    try {
        const response = await fetch(`${config.API_BASE_URL}/admin/special-slides`);
        if (!response.ok) throw new Error(`Server Error: ${response.status}`);
        
        const specialSlides = await response.json();
        console.log('Special slides received from server:', specialSlides);

        if (specialSlides.length === 0) {
            uiLogger.warn('No special slides found. Hiding carousel section.');
            const specialsSection = document.getElementById('specials-carousel-section');
            if (specialsSection) {
                specialsSection.classList.add('hidden');
                specialsSection.style.minHeight = '0';
            }
            return;
        }
        
        // ساخت اسلایدها بر اساس داده‌های جدید
        const slidesHtml = specialSlides.map((slide, index) => {
            const imageUrl = normalizeImagePath(slide.image_url);
            console.log(`Creating slide for item: ${slide.title}, image src: ${imageUrl}`);
            
            return `
                <div class="specials-carousel-slide ${index === 0 ? 'active' : ''}" data-slide-id="${index}">
                    <div class="special-item-card">
                        <img src="${imageUrl}" alt="${slide.title}" class="special-item-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="special-item-placeholder" style="display:none; align-items:center; justify-content:center; background:#374151; color:#9CA3AF; padding:20px; border-radius:8px;">
                            Image not found
                        </div>
                        <div class="special-item-info">
                            <h3 class="special-item-name">${slide.title}</h3>
                            <p class="special-item-description">${slide.description}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log('Generated HTML for carousel slides (first 500 chars):', slidesHtml.substring(0, 500));

        specialsCarouselTrack.innerHTML = slidesHtml;
        
        // ساخت ایندیکیتورها برای کاروسل
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'specials-carousel-indicators';
        
        specialSlides.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
            indicator.dataset.slideTo = index;
            indicator.addEventListener('click', () => {
                uiLogger.info('Specials carousel indicator clicked', { 
                    from: stateManager.getState().currentSpecialsSlide, 
                    to: index 
                });
                updateSpecialsCarousel(index);
                startSpecialsCarouselInterval();
            });
            indicatorsContainer.appendChild(indicator);
        });
        
        const specialsContainer = document.querySelector('.specials-carousel-container');
        if (specialsContainer) {
            const existingIndicators = specialsContainer.querySelector('.specials-carousel-indicators');
            if (!existingIndicators) {
                specialsContainer.appendChild(indicatorsContainer);
            }
        }
        
        stateManager.setState({ currentSpecialsSlide: 0 });
        
        startSpecialsCarouselInterval();
        
        carouselInitialized = true;
        uiLogger.info('Specials carousel initialized successfully.');
        uiLogger.endSection();
        console.log('===== INIT SPECIALS CAROUSEL END =====');
    } catch (error) {
        console.error('Error initializing specials carousel:', error);
        uiLogger.error('Error initializing specials carousel', error);
    }
};

const updateSpecialsCarouselContent = () => {
    const specialItems = window.allMenuItems.filter(item => item.is_special === true);
    
    if (specialItems.length === 0) {
        document.getElementById('specials-carousel-section').classList.add('hidden');
        return;
    }
    
    const specialsCarouselTrack = document.querySelector('.specials-carousel-track');
    if (!specialsCarouselTrack) return;
    
    const state = stateManager.getState();
    const slidesHtml = specialItems.map((item, index) => {
        const imageUrl = normalizeImagePath(item.image);
        return `
            <div class="specials-carousel-slide ${index === state.currentSpecialsSlide ? 'active' : ''}" data-slide-id="${index}">
                <div class="special-item-card">
                    <img src="${imageUrl}" alt="${item.name}" class="special-item-image">
                    <div class="special-item-info">
                        <h3 class="special-item-name">${item.name}</h3>
                        <p class="special-item-price">$${formatPrice(item.price)}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    specialsCarouselTrack.innerHTML = slidesHtml;
    
    const indicatorsContainer = document.querySelector('.specials-carousel-indicators');
    if (indicatorsContainer) {
        const indicators = indicatorsContainer.querySelectorAll('.indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === state.currentSpecialsSlide);
        });
    }
};

export const startSpecialsCarouselInterval = () => {
    const state = stateManager.getState();
    clearInterval(state.specialsCarouselInterval);
    const intervalId = setInterval(() => updateSpecialsCarousel(), config.specialsCarouselIntervalTime);
    stateManager.setState({ specialsCarouselInterval: intervalId });
    
    uiLogger.debug('Specials carousel auto-play started', {
        intervalTime: config.specialsCarouselIntervalTime
    });
};

export const resetSpecialsCarouselInterval = () => {
    const state = stateManager.getState();
    clearInterval(state.specialsCarouselInterval);
    startSpecialsCarouselInterval();
    
    uiLogger.debug('Specials carousel interval reset');
};

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

export const startCategorySmoke = () => {
    const state = stateManager.getState();
    if (state.currentMainCategory === 'Special') return;
    
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
// ============================== END OF JAVASCRIPT FILE ==============================