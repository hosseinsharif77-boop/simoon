// ================================= JAVASCRIPT FILE =================================
// File: js/ui.js
// Description: UI update functions and event handlers for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= IMPORTS =================================
import { elements, state, config } from './config.js';
import { categoryData, specialsAlbumData } from './data.js';
import { formatPrice, debounce } from './utils.js';
import { renderProducts } from './menu.js';
// ========================== END OF IMPORTS ==========================

// ================================= UI UPDATE FUNCTIONS =================================
/**
 * Updates the order sidebar UI, including the item count, list of items, and total price.
 */
export const updateOrderUI = () => {
    const totalItems = state.order.reduce((sum, item) => sum + item.quantity, 0);
    elements.menuOrderCount.textContent = totalItems;
    elements.menuOrderCount.classList.toggle('hidden', totalItems === 0);
    elements.orderItemsContainer.innerHTML = state.order.length === 0 ? `<p class="text-center text-gray-500 mt-10">You haven't ordered anything yet.</p>` : state.order.map(item => `
        <div class="flex items-center justify-between mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
            <div class="flex items-center gap-3">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-full">
                <div><h4 class="font-semibold">${item.name}</h4><p class="text-sm text-gray-400">${formatPrice(item.price)}</p></div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="window.changeQuantity(${item.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600"><i class="fas fa-minus text-xs"></i></button>
                <span class="w-8 text-center font-semibold">${item.quantity}</span>
                <button onclick="window.changeQuantity(${item.id}, 1)" class="w-7 h-7 bg-amber-600 rounded-full text-white hover:bg-amber-700"><i class="fas fa-plus text-xs"></i></button>
                <button onclick="window.removeFromOrder(${item.id})" class="mr-2 text-red-500 hover:text-red-400"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
    elements.orderTotal.textContent = formatPrice(state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0));
};

/**
 * Updates the favorites section in the user panel.
 */
export const updateFavoritesUI = () => {
    elements.favoritesContainer.innerHTML = state.favorites.length === 0 ? `<p class="col-span-2 text-center text-gray-500 text-sm">No favorites yet.</p>` : state.favorites.map(item => `
        <div class="bg-gray-800 p-2 rounded-lg border border-gray-700 text-center">
            <img src="${item.image}" alt="${item.name}" class="w-full h-20 object-cover rounded-md mb-1">
            <h5 class="text-xs font-semibold truncate">${item.name}</h5>
        </div>
    `).join('');
};

/**
 * Displays a specific page and hides others. Updates navigation states.
 * @param {string} pageId - The ID of the page to show (e.g., 'home', 'menu').
 * @param {string} [newCategory] - The new main category to switch to (optional).
 */
export const showPage = (pageId, newCategory) => {
    console.log(`\n\n===== 📄 [UI] نمایش صفحه: ${pageId} =====`);
    if (newCategory) {
        console.log(`📂 [UI] دسته جدید مشخص شده: ${newCategory}`);
    }

    const body = document.body;
    body.classList.toggle('menu-page-active', pageId === 'menu');
    elements.pageSections.forEach(section => section.classList.toggle('active', section.id === `${pageId}-page`));
    elements.navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
    elements.mobileBottomNavItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageId));

    state.currentPage = pageId;
    elements.menuOrderBtn.classList.toggle('hidden', pageId !== 'menu');

    if (pageId === 'menu') {
        // اگر یک دسته جدید مشخص شده، آن را به عنوان دسته فعلی تنظیم کن
        if (newCategory) {
            state.currentMainCategory = newCategory;
            state.currentSubCategory = ''; // ریست کردن زیردسته با تغییر دسته اصلی
            console.log(`🔄 [UI] دسته اصلی و زیردسته به‌روز شد: ${state.currentMainCategory}, ${state.currentSubCategory}`);
        } 
        // اگر صفحه منو بدون دسته مشخص باز شد و هیچ دسته‌ای فعلی نیست،
        // اولین دسته موجود را به عنوان پیش‌فرض انتخاب کن
        else if (!state.currentMainCategory) {
            const firstCategoryBtn = elements.categoryBtns[0];
            if (firstCategoryBtn) {
                state.currentMainCategory = firstCategoryBtn.dataset.mainCategory;
                state.currentSubCategory = ''; // ریست کردن زیردسته
                console.log(`🔄 [UI] هیچ دسته‌ای انتخاب نشده بود، پیش‌فرض تنظیم شد روی: ${state.currentMainCategory}`);
            }
        }

        // ابتدا کلاس active دکمه اصلی را بر اساس state جدید تنظیم کن
        elements.categoryBtns.forEach(btn => {
            const isActive = btn.dataset.mainCategory === state.currentMainCategory;
            btn.classList.toggle('active', isActive);
        });

        // حالا که وضعیت صحیح است، UI را آپدیت کن
        updateNavigationWrapper();
        updateSubCategoryNav();
        updateCategoryDisplay();
        renderProducts();
    }
    
    logDetailedMenuState('showPage - End');
    closeUserPanel();
    console.log(`===== 📄 [UI] پایان نمایش صفحه: ${pageId} =====\n\n`);
};

/**
 * Updates the UI for the order type selection (dine-in, delivery, pickup).
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
};

/**
 * Updates the sub-category navigation bar based on the selected main category.
 * It dynamically creates buttons for each sub-category found within the main category.
 * THIS IS THE MODIFIED FUNCTION
 */
export const updateSubCategoryNav = () => {
    console.log('\n\n===== 🧭 [UI] شروع به‌روزرسانی ناوبری زیردسته‌ها =====');
    console.log('📂 [UI] دسته اصلی فعلی:', state.currentMainCategory);
    
    const subCategoryNav = elements.subcategoryNav.querySelector('nav');
    subCategoryNav.innerHTML = '';

    // ۱. استخراج زیرمجموعه‌ها از محصولات
    const subcategoriesFromProducts = [...new Set(
        window.allMenuItems
            .filter(item => item.mainCategory === state.currentMainCategory && item.subCategory)
            .map(item => item.subCategory)
    )];

    // ۲. دریافت زیرمجموعه‌های سفارشی از سرور
    fetch(`${API_BASE_URL}/admin/custom-categories`)
        .then(response => {
            if (!response.ok) {
                throw new Error('خطا در دریافت زیرمجموعه‌های سفارشی');
            }
            return response.json();
        })
        .then(customCategories => {
            const customSubcategories = customCategories
                .filter(item => item.type === 'subcategory' && item.parent_category === state.currentMainCategory)
                .map(item => item.name);

            // ۳. ادغام زیرمجموعه‌ها و حذف موارد تکراری
            const allSubcategories = [...new Set([...subcategoriesFromProducts, ...customSubcategories])];
            console.log('🔍 [UI] زیرمجموعه‌های یافت شده برای "' + state.currentMainCategory + '":', allSubcategories);

            if (allSubcategories.length === 0) {
                subCategoryNav.innerHTML = '<p class="text-sm text-gray-500">زیرمجموعه‌ای یافت نشد.</p>';
                return;
            }

            // ۴. رندر کردن دکمه‌های زیرمجموعه
            allSubcategories.forEach(sub => {
                const button = document.createElement('button');
                button.className = 'subcategory-btn';
                button.textContent = sub.charAt(0).toUpperCase() + sub.slice(1);
                button.dataset.subCategory = sub;
                subCategoryNav.appendChild(button);
            });

            // ۵. تنظیم زیرمجموعه فعال
            const firstSubcategory = allSubcategories[0];
            if (firstSubcategory && (!state.currentSubCategory || !allSubcategories.includes(state.currentSubCategory))) {
                state.currentSubCategory = firstSubcategory;
                setActiveSubcategoryButton(firstSubcategory);
            } else if (state.currentSubCategory) {
                setActiveSubcategoryButton(state.currentSubCategory);
            }

            console.log('✅ [UI] دکمه زیردسته فعال برای "' + state.currentSubCategory + '" تنظیم شد.');
            console.log('===== 🧭 [UI] پایان به‌روزرسانی ناوبری زیردسته‌ها =====\n\n');
            logDetailedMenuState('updateSubCategoryNav - End');
        })
        .catch(error => {
            console.error('خطا در به‌روزرسانی زیرمجموعه‌ها:', error);
            // در صورت خطا، فقط با زیرمجموعه‌های محصولات ادامه بده
            if (subcategoriesFromProducts.length > 0) {
                subcategoriesFromProducts.forEach(sub => {
                    const button = document.createElement('button');
                    button.className = 'subcategory-btn';
                    button.textContent = sub.charAt(0).toUpperCase() + sub.slice(1);
                    button.dataset.subCategory = sub;
                    subCategoryNav.appendChild(button);
                });
            } else {
                subCategoryNav.innerHTML = '<p class="text-sm text-gray-500">زیرمجموعه‌ای یافت نشد.</p>';
            }
        });
};

/**
 * Updates the product card controls (+/- buttons) based on the order state.
 * @param {number|null} productId - The ID of a specific product to update, or null to update all.
 */
export const updateProductCardControls = (productId = null) => {
    const controls = productId ? document.querySelector(`.add-to-order-controls[data-product-id="${productId}"]`) : null;
    const item = productId ? state.order.find(i => i.id === productId) : null;
    if (controls) {
        controls.innerHTML = item ? `<button onclick="window.changeQuantity(${item.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600"><i class="fas fa-minus text-xs"></i></button><span class="w-8 text-center font-semibold">${item.quantity}</span><button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-7 h-7 rounded-full transition-colors"><i class="fas fa-plus text-xs"></i></button>` : `<button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors"><i class="fas fa-plus text-sm"></i></button>`;
    } else {
        document.querySelectorAll('.add-to-order-controls').forEach(control => {
            const id = parseInt(control.dataset.productId, 10);
            const itemInOrder = state.order.find(i => i.id === id);
            control.innerHTML = itemInOrder ? `<button onclick="window.changeQuantity(${itemInOrder.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600"><i class="fas fa-minus text-xs"></i></button><span class="w-8 text-center font-semibold">${itemInOrder.quantity}</span><button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-7 h-7 rounded-full transition-colors"><i class="fas fa-plus text-xs"></i></button>` : `<button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors"><i class="fas fa-plus text-sm"></i></button>`;
        });
    }
};

/**
 * Updates the navigation wrapper's background image on mobile views.
 * THIS IS THE CRITICAL FUNCTION FOR THE MOBILE BACKGROUND IMAGE.
 */
export const updateNavigationWrapper = () => {
    console.log(`--- updateNavigationWrapper called ---`);
    const navigationWrapper = elements.navigationWrapper;
    const categoryDisplaySection = document.querySelector('.category-display-section');
    const activeCategoryBtn = document.querySelector('.category-btn.active');

    console.log('Active Category Button:', activeCategoryBtn);

    if (!activeCategoryBtn || !navigationWrapper) {
        console.log(`Exiting updateNavigationWrapper: active button or wrapper not found.`);
        return;
    }

    const category = activeCategoryBtn.dataset.mainCategory;
    const imageUrl = activeCategoryBtn.dataset.categoryImage;
    const isMobile = window.innerWidth <= config.mobileBreakpoint;

    console.log(`Category: ${category}, Image URL: ${imageUrl}, Is Mobile: ${isMobile}`);

    // ابتدا کلاس‌ها را حذف می‌کنیم تا حالت قبلی پاک شود
    navigationWrapper.classList.remove('mobile-image-bg');
    if(categoryDisplaySection) {
        categoryDisplaySection.classList.remove('hide-category-display');
    }

    // اگر در موبایل بودیم و دسته ویژه‌ها نبود، پس‌زمینه را تنظیم می‌کنیم
    if (isMobile && category !== 'specials') {
        if (imageUrl) {
            // تنظیم متغیر CSS برای استفاده در فایل استایل
            navigationWrapper.style.setProperty('--category-bg-image', `url(${imageUrl})`);
            navigationWrapper.classList.add('mobile-image-bg');
            console.log('Mobile background image SET.');
        }
        if(categoryDisplaySection) {
            categoryDisplaySection.classList.add('hide-category-display');
        }
    } else {
        // اگر در دسکتاپ هستیم یا دسته ویژه‌ها است، مطمئن می‌شویم که پس‌زمینه و دیو نمایش داده نشوند
        navigationWrapper.style.removeProperty('--category-bg-image');
        console.log('Mobile background image REMOVED.');
    }
};

/**
 * Updates the main category display section (title, image, description, carousel).
 */
export const updateCategoryDisplay = () => {
    console.log(`--- updateCategoryDisplay called for: ${state.currentMainCategory} ---`);
    const mainCategoryName = state.currentMainCategory.charAt(0).toUpperCase() + state.currentMainCategory.slice(1).replace('-', ' ');
    const subCategoryName = state.currentSubCategory.charAt(0).toUpperCase() + state.currentSubCategory.slice(1).replace('-', ' ');

    if (state.currentMainCategory.toLowerCase() === 'specials' && categoryData.specials) {
        elements.categoryPromptText.textContent = categoryData.specials.text;
        elements.categoryPromptText.classList.add('cc');
        console.log('Updating display for SPECIALS.');
        // مدیریت تصویر پس‌زمینه برای موبایل در specials
        if (window.innerWidth <= config.mobileBreakpoint) {
            elements.navWrapper.style.removeProperty('--category-bg-image');
            elements.navWrapper.classList.remove('mobile-image-bg');
            console.log('SPECIALS: Mobile background image REMOVED directly.');
        }
    } else {
        elements.categoryPromptText.textContent = '';
        elements.categoryPromptText.classList.remove('cc');
        console.log('Updating display for a standard category.');
    }
};

/**
 * A detailed logging function to debug the menu state.
 * Logs the current main/sub-category, active buttons, and background status.
 * This version queries the DOM directly for robustness.
 */
export const logDetailedMenuState = (caller = 'Unknown') => {
    console.log(`\n\n===== DETAILED MENU STATE (from: ${caller}) =====`);
    console.log('1. State Variables:');
    console.log(`   - currentMainCategory: "${state.currentMainCategory}"`);
    console.log(`   - currentSubCategory: "${state.currentSubCategory}"`);

    console.log('\n2. DOM Elements Status:');
    
    // به جای استفاده از elements، مستقیماً از DOM کوئری بگیر
    const activeMainBtn = document.querySelector('.category-btn.active');
    const activeSubBtn = document.querySelector('.subcategory-btn.active');
    const navigationWrapper = document.querySelector('.navigation-wrapper');

    console.log('   - Active Main Category Button:', activeMainBtn);
    if (activeMainBtn) {
        console.log(`     - data-main-category: "${activeMainBtn.dataset.mainCategory}"`);
        console.log(`     - data-category-image: "${activeMainBtn.dataset.categoryImage}"`);
    }
    
    console.log('   - Active Sub-Category Button:', activeSubBtn);
    if (activeSubBtn) {
        console.log(`     - data-sub-category: "${activeSubBtn.dataset.subCategory}"`);
    }

    if (navigationWrapper) {
        console.log(`   - Navigation Wrapper has 'mobile-image-bg' class:`, navigationWrapper.classList.contains('mobile-image-bg'));
        console.log(`   - Navigation Wrapper '--category-bg-image' style:`, getComputedStyle(navigationWrapper).getPropertyValue('--category-bg-image'));
    } else {
        console.log('   - Navigation Wrapper: NOT FOUND');
    }
    
    console.log('================================================\n\n');
};
// ========================== END OF UI UPDATE FUNCTIONS ==========================

// ================================= UI EVENT HANDLERS =================================
/**
 * Closes the user panel sidebar with a fade-out effect.
 */
export const closeUserPanel = () => {
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
    elements.orderOverlay.classList.remove('opacity-100');
    elements.orderOverlay.classList.add('opacity-0');
    setTimeout(() => {
        elements.orderSidebar.classList.remove('open');
        elements.orderOverlay.classList.add('hidden');
    }, 300);
};

/**
 * Toggles a product's favorite status and updates the UI.
 * @param {number} productId - The ID of the product to toggle.
 */
export const toggleFavorite = (productId) => {
    const product = window.allMenuItems.find(p => p.id === productId);
    if (!product) return;
    const index = state.favorites.findIndex(fav => fav.id === productId);
    if (index > -1) state.favorites.splice(index, 1);
    else state.favorites.push(product);
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
    state.currentSpecialsSlide = targetIndex !== null ? targetIndex : (state.currentSpecialsSlide + 1) % slides.length;
    slides.forEach((slide, index) => slide.classList.toggle('active', index === state.currentSpecialsSlide));
    indicators.forEach((dot, index) => dot.classList.toggle('active', index === state.currentSpecialsSlide));
    resetSpecialsCarouselInterval();
};

/**
 * Initializes the specials carousel by setting up click listeners for indicators and starting the auto-play interval.
 */
export const initSpecialsCarousel = () => {
    document.querySelectorAll('.indicator').forEach(dot => {
        dot.addEventListener('click', () => updateSpecialsCarousel(parseInt(dot.dataset.slideTo, 10)));
    });
    startSpecialsCarouselInterval();
};

/**
 * Starts the auto-play interval for the specials carousel.
 */
export const startSpecialsCarouselInterval = () => {
    clearInterval(state.specialsCarouselInterval);
    state.specialsCarouselInterval = setInterval(() => updateSpecialsCarousel(), config.specialsCarouselIntervalTime);
};

/**
 * Resets the auto-play interval for the specials carousel, typically after user interaction.
 */
export const resetSpecialsCarouselInterval = () => {
    clearInterval(state.specialsCarouselInterval);
    startSpecialsCarouselInterval();
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
    }
};
// ========================== END OF CAROUSEL & EFFECTS FUNCTIONS ==========================
// ============================== END OF JAVASCRIPT FILE ==============================