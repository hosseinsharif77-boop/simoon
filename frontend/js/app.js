// ================================= JAVASCRIPT FILE =================================
// File: js/app.js
// Description: Main entry point and event listener setup for Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= IMPORTS =================================
import { elements, state, config } from './config.js';
import { formatPrice, debounce, normalizeImagePath, setBackgroundImage, setImageSrc } from './utils.js';
import { 
    renderProducts, 
    addToOrder, 
    changeQuantity, 
    removeFromOrder, 
    showPaymentView, 
    showOrderReviewView, 
    confirmPayment 
} from './menu.js';
import {
    updateOrderUI,
    showPage,
    updateOrderTypeUI,
    updateSpecialsCarousel,
    initSpecialsCarousel,
    updateNavigationWrapper,
    updateCategoryDisplay,
    closeUserPanel,
    closeOrderSidebar,
    toggleFavorite,
    updateStickyNavPosition,
    updateSubCategoryNav,
    updateMainCategoryNav,
    refreshCategories
} from './ui.js';
import { fetchMenuItems, checkForMenuUpdates } from './api.js';
import { 
    apiLogger, 
    uiLogger, 
    menuLogger, 
    orderLogger, 
    navLogger, 
    perfLogger,
    logNavigationEvent,
    logComponentStates,
    logDetailedMenuState,
    createPerformanceMonitor
} from './logger.js';

let menuUpdateInterval = null;
// این متغیر سراسری را در اینجا تعریف می‌کنیم
window.allMenuItems = [];
// ========================== END OF IMPORTS ==========================

// ================================= IMAGE PROCESSING FUNCTIONS =================================
/**
 * Processes all images with data-src attribute and sets their src
 */
function processAllImages() {
    uiLogger.info('Processing all images with data-src attribute');
    
    // Find all images with data-src attribute
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
        const imageName = img.dataset.src;
        setImageSrc(img, imageName);
    });
    
    // Find all video sources with data-src attribute
    const videoSources = document.querySelectorAll('source[data-src]');
    videoSources.forEach(source => {
        const videoName = source.dataset.src;
        source.src = normalizeImagePath(videoName);
    });

    // --- این بخش را اضافه کنید ---
    // تمام عناصر ویدیو والد را پیدا کرده و متد load() را روی آن‌ها فراخوانی کنید
    const videos = document.querySelectorAll('video');
    videos.forEach(video => video.load());
    // --- پایان بخش اضافه شده ---
    
    uiLogger.info(`Processed ${images.length} images and ${videoSources.length} video sources`);
}

/**
 * Processes all elements with data-bg-image attribute and sets their background image
 */
function processAllBackgroundImages() {
    uiLogger.info('Processing all elements with data-bg-image attribute');
    
    // Find all elements with data-bg-image attribute
    const elements = document.querySelectorAll('[data-bg-image]');
    elements.forEach(element => {
        const imageName = element.dataset.bgImage;
        setBackgroundImage(element, imageName);
    });
    
    uiLogger.info(`Processed ${elements.length} background images`);
}

/**
 * Processes all category buttons with data-category-image-name attribute
 */
function processCategoryImages() {
    uiLogger.info('Processing all category buttons with data-category-image-name attribute');
    
    // Find all category buttons with data-category-image-name attribute
    const buttons = document.querySelectorAll('[data-category-image-name]');
    buttons.forEach(button => {
        const imageName = button.dataset.categoryImageName;
        const normalizedPath = normalizeImagePath(imageName);
        button.dataset.categoryImage = normalizedPath;
    });
    
    uiLogger.info(`Processed ${buttons.length} category button images`);
}
// ========================== END OF IMAGE PROCESSING FUNCTIONS ==========================

function startMenuAutoUpdate() {
    if (menuUpdateInterval) {
        clearInterval(menuUpdateInterval);
    }

    perfLogger.info('Starting automatic menu updates every 30 seconds');

    // این تایمر را کامنت کنید تا هر 30 ثانیه رفرش نشود
    /*
    menuUpdateInterval = setInterval(async () => {
        apiLogger.debug('Checking for menu updates from server');
        
        // بررسی عادی به‌روزرسانی‌ها
        const hasUpdates = await checkForMenuUpdates();

        if (hasUpdates) {
            apiLogger.info('Menu update detected, refreshing...');
            try {
                window.allMenuItems = await fetchMenuItems();
                
                if (state.currentPage === 'menu') {
                    renderProducts();
                    updateSubCategoryNav();
                    updateCategoryDisplay();
                    showUpdateNotification('منو با موفقیت به‌روزرسانی شد.');
                }
            } catch (error) {
                apiLogger.error('Error updating menu after server update', error);
                showUpdateNotification('خطا در به‌روزرسانی منو.', 'error');
            }
        } else {
            apiLogger.debug('No new menu updates from server');
        }
    }, 30000); // 30000 میلی‌ثانیه = 30 ثانیه
    */
    
    // تابع پاک‌سازی برای جلوگیری از نشت حافظه
    window.stopMenuAutoUpdate = () => {
        clearInterval(menuUpdateInterval);
        perfLogger.info('Automatic menu updates stopped');
    };
}

function stopMenuAutoUpdate() {
    if (menuUpdateInterval) {
        clearInterval(menuUpdateInterval);
        menuUpdateInterval = null;
        perfLogger.info('Automatic menu updates stopped');
    }
}

// ================================= تابع جدید برای گرفتن داده‌ها =================================
async function fetchMenuData() {
    const monitor = createPerformanceMonitor('Initial App Load');
    
    perfLogger.section('Initial App Load and Data Fetch');
    
    try {
        perfLogger.info('Fetching data from server...');
        window.allMenuItems = await fetchMenuItems();
        perfLogger.info('Data received successfully', { itemCount: window.allMenuItems.length });
        
        // به‌روزرسانی دسته‌بندی‌ها پس از دریافت داده‌ها
        await updateMainCategoryNav();
        
        // Log component states after data fetch
        logComponentStates();
        
        initializeApp();
        // کامنت کردن شروع آپدیت خودکار
        // startMenuAutoUpdate();
        
        const duration = monitor.end({ itemCount: window.allMenuItems.length });
        perfLogger.endSection();
    } catch (error) {
        apiLogger.error('Error fetching initial data', error);
        document.body.innerHTML = `
            <div class="container text-center mt-5">
                <h1>خطا در بارگذاری منو</h1>
                <p>${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">تلاش مجدد</button>
            </div>
        `;
        perfLogger.endSection();
    }
}

// ================================= تابع اصلی برای راه‌اندازی برنامه =================================
function initializeApp() {
    perfLogger.section('App Initialization');
    perfLogger.info('Initializing app with received data');

    // --- مرحله ۱: پردازش تصاویر ---
    processAllImages();
    processAllBackgroundImages();
    processCategoryImages();

    // --- مرحله ۲: اختصاص دهی عناصری که در config.js تعریف نشده‌اند ---
    elements.submitOrderBtn = document.getElementById('submit-order-btn');
    elements.confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    elements.cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    elements.paymentFormContainer = document.getElementById('payment-form-container');
    elements.orderReviewContainer = document.getElementById('order-review-container');

    // --- مرحله ۳: منطق انتخاب روش پرداخت ---
    const paymentMethodsGrid = document.querySelector('.payment-methods-grid');
    if (paymentMethodsGrid) {
        paymentMethodsGrid.addEventListener('click', (e) => {
            const box = e.target.closest('.payment-method-box');
            if (box) {
                const paymentMethod = box.dataset.paymentMethod;
                
                uiLogger.info('Payment method selected', { method: paymentMethod });
                
                // به‌روزرسانی کلاس‌های فعال
                paymentMethodsGrid.querySelectorAll('.payment-method-box').forEach(b => b.classList.remove('active'));
                box.classList.add('active');

                // به‌روزرسانی رادیو باتن مخفی برای منطق فرم
                const radioToCheck = document.querySelector(`input[name="payment-method"][value="${paymentMethod}"]`);
                if (radioToCheck) radioToCheck.checked = true;

                // مخفی کردن تمام جزئیات
                document.querySelectorAll('.payment-details').forEach(detail => {
                    detail.style.display = 'none';
                });

                // نمایش جزئیات روش انتخاب شده
                const selectedDetails = document.getElementById(`${paymentMethod}-details`);
                if (selectedDetails) {
                    selectedDetails.style.display = 'block';
                }
            }
        });
    }

    // --- مرحله ۴: تنظیم روش پرداخت پیش‌فرض ---
    const defaultPaymentMethod = state.isFromQRCode ? 'cash' : 'paypal';
    const defaultPaymentBox = document.querySelector(`[data-payment-method="${defaultPaymentMethod}"]`);
    if (defaultPaymentBox) {
        defaultPaymentBox.click(); // شبیه‌سازی کلیک برای اجرای منطق انتخاب
        uiLogger.info('Default payment method set', { method: defaultPaymentMethod });
    }

    // --- Attach functions to global window object ---
    window.changeQuantity = changeQuantity;
    window.removeFromOrder = removeFromOrder;

    // --- EVENT LISTENERS (استفاده از Event Delegation) ---
    document.body.addEventListener('click', (e) => {
        // بررسی کلیک روی دکمه‌های دسته‌بندی (هم قدیمی و هم جدید)
        if (e.target.classList.contains('category-btn') || e.target.closest('.category-btn')) {
            const categoryBtn = e.target.classList.contains('category-btn') ? e.target : e.target.closest('.category-btn');
            const category = categoryBtn.dataset.mainCategory;
            
            logNavigationEvent(`Category Button (${state.currentMainCategory})`, `Category Button (${category})`, { 
                triggeredBy: 'categoryBtn',
                category: category 
            });
            showPage('menu', category);
            return; // مهم: از ادامه اجرای تابع جلوگیری کن
        }
        
        if (e.target.closest('.add-btn')) {
            const controls = e.target.closest('.add-to-order-controls');
            const productId = parseInt(controls.dataset.productId, 10);
            orderLogger.info('Add to order button clicked', { productId });
            addToOrder(e, productId);
            return; // مهم: از ادامه اجرای تابع جلوگیری کن
        }
        if (e.target.closest('.favorite-btn')) {
            const favId = parseInt(e.target.closest('.favorite-btn').dataset.favId, 10);
            orderLogger.info('Favorite button clicked', { productId: favId });
            toggleFavorite(favId);
            return; // مهم: از ادامه اجرای تابع جلوگیری کن
        }
        if (e.target.hasAttribute('data-page')) {
            const page = e.target.getAttribute('data-page');
            logNavigationEvent(`Page (${state.currentPage})`, `Page (${page})`, { 
                triggeredBy: 'data-page attribute',
                element: e.target.tagName + (e.target.className ? '.' + e.target.className.split(' ').join('.') : '')
            });
            showPage(page);
            return; // مهم: از ادامه اجرای تابع جلوگیری کن
        }
    });

    elements.subcategoryNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('subcategory-btn')) {
            const subCategory = e.target.dataset.subCategory;
            logNavigationEvent(`Subcategory (${state.currentSubCategory})`, `Subcategory (${subCategory})`, { 
                triggeredBy: 'subcategoryBtn',
                subCategory: subCategory 
            });
            
            elements.subcategoryNav.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentSubCategory = subCategory;
            renderProducts();
            updateCategoryDisplay();
        }
    });

    elements.orderTypeRadios.forEach(radio => radio.addEventListener('change', updateOrderTypeUI));

    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            logNavigationEvent(`Navigation Link (${state.currentPage})`, `Navigation Link (${page})`, { 
                triggeredBy: 'navLink',
                linkText: link.textContent
            });
            showPage(page);
        });
    });

    elements.mobileBottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            logNavigationEvent(`Mobile Nav (${state.currentPage})`, `Mobile Nav (${page})`, { 
                triggeredBy: 'mobileBottomNav',
                linkText: item.textContent
            });
            showPage(page);
        });
    });

    const userPanelNavLinks = elements.userPanelSidebar.querySelectorAll('a[data-page]');
    userPanelNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            logNavigationEvent(`User Panel (${state.currentPage})`, `User Panel (${page})`, { 
                triggeredBy: 'userPanelNav',
                linkText: link.textContent
            });
            showPage(page);
        });
    });

    // --- شروع کد جدید گالری رستوران ---
    const restaurantCarousel = document.getElementById('restaurant-carousel');
    const carouselPrevBtn = document.getElementById('carousel-prev');
    const carouselNextBtn = document.getElementById('carousel-next');

    if (restaurantCarousel && carouselPrevBtn && carouselNextBtn) {
        const slides = restaurantCarousel.querySelectorAll('.carousel-slide');
        const indicatorsContainer = document.createElement('div');
        indicatorsContainer.className = 'carousel-indicators';

        // --- منطق جدید برای مدیریت "نماها" (views) ---
        const totalViews = slides.length + 1; // 5 + 1 = 6
        let currentView = 0;
        let autoplayInterval;

        // ایجاد نشانگرها (نقاط) بر اساس تعداد عکس‌ها (5 تا)
        slides.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
            indicator.addEventListener('click', () => {
                const targetView = (index === 0) ? 0 : index + 1;
                uiLogger.info('Carousel indicator clicked', { 
                    from: currentView, 
                    to: targetView 
                });
                showView(targetView);
                startAutoplay();
            });
            indicatorsContainer.appendChild(indicator);
        });
        restaurantCarousel.parentElement.appendChild(indicatorsContainer);

        // تابع جدید برای نمایش یک "نما" (view) خاص
        function showView(viewIndex) {
            currentView = (viewIndex + totalViews) % totalViews;
            const offset = currentView * 100;
            restaurantCarousel.style.transform = `translateX(-${offset}%)`;

            let activeIndicatorIndex = 0;
            if (currentView === 0 || currentView === 1) {
                activeIndicatorIndex = 0;
            } else {
                activeIndicatorIndex = currentView - 1;
            }

            document.querySelectorAll('.indicator').forEach((dot, i) => {
                dot.classList.toggle('active', i === activeIndicatorIndex);
            });
            
            uiLogger.debug('Carousel view changed', { 
                currentView, 
                activeIndicatorIndex 
            });
        }

        // تابعی برای شروع انیمیشن خودکار
        function startAutoplay() {
            stopAutoplay();
            autoplayInterval = setInterval(() => {
                showView(currentView + 1);
            }, 4000);
        }

        // تابعی برای متوقف کردن انیمیشن خودکار
        function stopAutoplay() {
            if (autoplayInterval) {
                clearInterval(autoplayInterval);
            }
        }

        // --- رویدادهای کلیک برای دکمه‌ها ---
        carouselNextBtn.addEventListener('click', () => {
            uiLogger.info('Carousel next button clicked', { 
                from: currentView, 
                to: (currentView + 1) % totalViews 
            });
            showView(currentView + 1);
            startAutoplay();
        });

        carouselPrevBtn.addEventListener('click', () => {
            uiLogger.info('Carousel prev button clicked', { 
                from: currentView, 
                to: (currentView - 1 + totalViews) % totalViews 
            });
            showView(currentView - 1);
            startAutoplay();
        });

        // --- شروع کد جدید: قابلیت تاچ (swipe) ---
        let touchStartX = 0;
        let touchEndX = 0;
        const swipeThreshold = 50; // حداقل فاصله برای تشخیص سوایپ (به پیکسل)

        // تابعی برای مدیریت سوایپ
        function handleSwipe() {
            // اگر کاربر به چپ سوایپ کرده (انگشتش را به چپ کشیده)
            if (touchEndX < touchStartX - swipeThreshold) {
                uiLogger.info('Carousel swipe left detected', { 
                    from: currentView, 
                    to: (currentView + 1) % totalViews 
                });
                showView(currentView + 1); // برو به نما بعدی
            }
            // اگر کاربر به راست سوایپ کرده (انگشتش را به راست کشیده)
            if (touchEndX > touchStartX + swipeThreshold) {
                uiLogger.info('Carousel swipe right detected', { 
                    from: currentView, 
                    to: (currentView - 1 + totalViews) % totalViews 
                });
                showView(currentView - 1); // برو به نما قبلی
            }
            // در هر صورت، تایمر خودکار را ری‌استارت کن
            startAutoplay();
        }

        // اضافه کردن رویدادهای لمسی به ترک کاروسل
        restaurantCarousel.addEventListener('touchstart', (e) => {
            // موقعیت شروع لمس را ذخیره کن
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true }); // passive: true برای عملکرد بهتر در موبایل

        restaurantCarousel.addEventListener('touchend', (e) => {
            // موقعیت پایان لمس را ذخیره کن
            touchEndX = e.changedTouches[0].screenX;
            // تابع مدیریت سوایپ را فراخوانی کن
            handleSwipe();
        }, { passive: true });
        // --- پایان کد جدید: قابلیت تاچ (swipe) ---

        // رویدادهای هاور کردن ماوس برای کنترل انیمیشن خودکار
        restaurantCarousel.addEventListener('mouseenter', () => {
            uiLogger.debug('Carousel mouse enter, pausing autoplay');
            stopAutoplay();
        });
        restaurantCarousel.addEventListener('mouseleave', () => {
            uiLogger.debug('Carousel mouse leave, resuming autoplay');
            startAutoplay();
        });

        // --- مقداردهی اولیه ---
        showView(0); // نمایش اولین نما
        startAutoplay(); // شروع انیمیشن خودکار
        
        uiLogger.info('Carousel initialized', { 
            totalViews, 
            autoplayInterval: 4000 
        });
    }
    // --- پایان کد جدید گالری رستوران ---

    elements.hamburgerMenuBtn.addEventListener('click', () => {
        uiLogger.info('Hamburger menu button clicked');
        elements.userPanelSidebar.classList.add('open');
        elements.userPanelOverlay.classList.remove('hidden');
        setTimeout(() => {
            elements.userPanelOverlay.classList.remove('opacity-0');
            elements.userPanelOverlay.classList.add('opacity-100');
        }, 10);
    });
    
    elements.closeUserPanelBtn.addEventListener('click', closeUserPanel);
    elements.userPanelOverlay.addEventListener('click', closeUserPanel);

    elements.menuOrderBtn.addEventListener('click', () => {
        orderLogger.info('Order button clicked', {
            orderLength: state.order.length,
            currentStep: state.currentOrderStep
        });

        // اطمینان از اینکه ابتدا سبد خرید نمایش داده می‌شود
        showOrderReviewView();

        elements.orderSidebar.classList.add('open');
        elements.orderOverlay.classList.remove('hidden');
        setTimeout(() => {
            elements.orderOverlay.classList.remove('opacity-0');
            elements.orderOverlay.classList.add('opacity-100');
        }, 10);
    });
    
    elements.closeOrderBtn.addEventListener('click', closeOrderSidebar);
    elements.orderOverlay.addEventListener('click', closeOrderSidebar);

    // --- Payment Flow Event Listeners ---
    if (elements.submitOrderBtn) {
        elements.submitOrderBtn.addEventListener('click', () => {
            if (state.order.length > 0) {
                orderLogger.info('Submit order button clicked', {
                    orderLength: state.order.length,
                    totalAmount: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                });
                showPaymentView();
            } else {
                orderLogger.warn('Submit order clicked but order is empty');
                alert('Your order is empty.');
            }
        });
    }

    if (elements.cancelPaymentBtn) {
        elements.cancelPaymentBtn.addEventListener('click', () => {
            orderLogger.info('Cancel payment button clicked');
            showOrderReviewView();
        });
    }

    if (elements.confirmPaymentBtn) {
        elements.confirmPaymentBtn.addEventListener('click', () => {
            const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
            
            if (!selectedPaymentMethod) {
                orderLogger.warn('Confirm payment clicked but no payment method selected');
                alert('Please select a payment method.');
                return;
            }
            
            orderLogger.info('Confirm payment button clicked', {
                paymentMethod: selectedPaymentMethod.value,
                orderLength: state.order.length,
                totalAmount: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            });
            
            confirmPayment();
        });
    }

    // Window resize event
    window.addEventListener('resize', debounce(() => {
        uiLogger.debug('Window resized', {
            width: window.innerWidth,
            height: window.innerHeight
        });
        updateStickyNavPosition();
        updateNavigationWrapper();
    }, 250));

    // --- INITIALIZATION LOGIC ---
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
        state.currentTableNumber = tableFromUrl;
        state.isFromQRCode = true;
        uiLogger.info('QR code mode detected', { tableNumber: tableFromUrl });
        // این خط را حذف کنید چون منطق آن به showPage منتقل شد
        // state.currentMainCategory = 'specials'; 
        setTimeout(() => showPage('menu'), 100);
    }

    // این خط را اضافه کنید تا صفحه اصلی در ابتدا نمایش داده شود
    showPage('home'); 

    const header = elements.headerContainer;
    if (header) {
        const resizeObserver = new ResizeObserver(() => {
            uiLogger.debug('Header resized', {
                height: header.offsetHeight
            });
            updateStickyNavPosition();
        });
        resizeObserver.observe(header);
    }

    showPage('home');
    updateOrderTypeUI();
    setTimeout(updateStickyNavPosition, 100);

    // --- شروع کد دیباگ پیشرفته ---
    const reviewContainer = document.getElementById('order-review-container');
    const paymentContainer = document.getElementById('payment-form-container');

    if (reviewContainer && paymentContainer) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target;
                    const oldClasses = mutation.oldValue;
                    const newClasses = element.className;
                    
                    uiLogger.debug(`Class change in element: #${element.id}`, {
                        oldClasses,
                        newClasses
                    });
                }
            });
        });

        // تنظیم آبزرور برای مشاهده تغییرات در کلاس‌ها
        observer.observe(reviewContainer, { attributes: true, attributeOldValue: true });
        observer.observe(paymentContainer, { attributes: true, attributeOldValue: true });
        
        uiLogger.info('Mutation observer set up for order containers');
    }
    // --- پایان کد دیباگ پیشرفته ---
    
    document.getElementById('order-items').addEventListener('input', (e) => {
        if (e.target.classList.contains('order-item-note')) {
            const itemId = parseInt(e.target.closest('.order-item').dataset.itemId, 10);
            const item = state.order.find(i => i.id === itemId);
            if (item) {
                const oldNote = item.note;
                item.note = e.target.value;
                orderLogger.debug('Order item note updated', {
                    itemId,
                    oldNote,
                    newNote: item.note
                });
            }
        }
    });
    
    elements.orderTotalReview = document.getElementById('order-total-review');

    // اتصال به Server-Sent Events برای دریافت به‌روزرسانی‌های دسته‌بندی
    const eventSource = new EventSource(`${config.API_BASE_URL}/api/categories-updates`);

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.action === 'refresh') {
            console.log('📡 دریافت اطلاع‌رسانی برای به‌روزرسانی دسته‌بندی‌ها...');
            refreshCategories();
        }
    };

    eventSource.onerror = function(event) {
        console.error('!!! ERROR در اتصال به SSE !!!', event);
    };

    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-btn')) {
            const productCard = e.target.closest('.product-card-wrapper');
            const productId = productCard ? productCard.dataset.productId : 'not found';
            console.log('Add button clicked:', { productId, target: e.target });
        }
    });

    // در ابتدای فایل app.js یا پس از بارگذاری DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🛒 Menu order button element:', elements.menuOrderBtn);
        console.log('🛒 Menu order button rect:', elements.menuOrderBtn ? elements.menuOrderBtn.getBoundingClientRect() : 'Not found');
        console.log('🛒 Menu order button visibility:', elements.menuOrderBtn ? {
            offsetParent: elements.menuOrderBtn.offsetParent,
            offsetWidth: elements.menuOrderBtn.offsetWidth,
            offsetHeight: elements.menuOrderBtn.offsetHeight,
            display: window.getComputedStyle(elements.menuOrderBtn).display,
            visibility: window.getComputedStyle(elements.menuOrderBtn).visibility,
            classList: elements.menuOrderBtn.classList.toString()
        } : 'Not found');
    });

    // همچنین لاگ برای بررسی وضعیت دکمه سبد خرید در هر کلیک
    document.addEventListener('click', function(e) {
        if (e.target.closest('.add-btn')) {
            console.log('🛒 Menu order button before click:', {
                element: elements.menuOrderBtn,
                rect: elements.menuOrderBtn ? elements.menuOrderBtn.getBoundingClientRect() : 'Not found',
                classList: elements.menuOrderBtn ? elements.menuOrderBtn.classList.toString() : 'Not found',
                display: elements.menuOrderBtn ? window.getComputedStyle(elements.menuOrderBtn).display : 'Not found',
                visibility: elements.menuOrderBtn ? window.getComputedStyle(elements.menuOrderBtn).visibility : 'Not found'
            });
        }
    });

    // Log component states after initialization
    logComponentStates();
    
    perfLogger.endSection();
    // تنظیم دسته‌بندی special به عنوان پیش‌فرض برای صفحه لندینگ
}

// ================================= نقطه شروع برنامه =================================
// فقط این یک خط را به عنوان نقطه شروع اصلی قرار می‌دهیم
document.addEventListener('DOMContentLoaded', fetchMenuData);

// برای جلوگیری از درخواست‌های بی‌موقع وقتی تب غیرفعال است
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        perfLogger.debug('Page hidden, stopping menu updates');
        stopMenuAutoUpdate();
    } else {
        perfLogger.debug('Page visible, starting menu updates');
        // کامنت کردن شروع مجدد آپدیت خودکار
        // startMenuAutoUpdate();
    }
});

// ============================== END OF JAVASCRIPT FILE ==============================