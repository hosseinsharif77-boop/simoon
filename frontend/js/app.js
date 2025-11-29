// ================================= JAVASCRIPT FILE =================================
// File: js/app.js
// Description: Main entry point and event listener setup for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= IMPORTS =================================
import { elements, state, config } from './config.js';
import { formatPrice, debounce } from './utils.js';
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
    updateSubCategoryNav
} from './ui.js';
import { fetchMenuItems, checkForMenuUpdates } from './api.js';
let menuUpdateInterval = null;
// این متغیر سراسری را در اینجا تعریف می‌کنیم
window.allMenuItems = [];
// ========================== END OF IMPORTS ==========================
function startMenuAutoUpdate() {
    if (menuUpdateInterval) {
        clearInterval(menuUpdateInterval);
    }

    console.log('🚀 [APP] شروع به‌روزرسانی خودکار منو هر 30 ثانیه.');

    // بررسی اطلاع‌رسانی از ادمین در هر 5 ثانیه
    const checkForAdminUpdates = setInterval(async () => {
        console.log('\n\n===== 📢 [APP] بررسی اطلاع‌رسانی از ادمین =====');
        const adminUpdate = localStorage.getItem('adminUpdate');
        if (adminUpdate) {
            console.log('📢 [APP] اطلاع‌رسانی از ادمین دریافت شد:', adminUpdate);
            localStorage.removeItem('adminUpdate');
            console.log('\n\n===== 📢 [APP] اطلاع‌رسانی از ادمین از طریق رویداد storage دریافت شد =====');
            console.log('📋 [APP] داده‌های دریافت شده:', e.newValue);
            
            try {
                const notification = JSON.parse(adminUpdate);
                console.log('📋 [APP] اطلاع‌رسانی تجزیه شد:', notification);
                
                // فوراً به‌روزرسانی کن
                window.allMenuItems = await fetchMenuItems();
                
                if (state.currentPage === 'menu') {
                    renderProducts();
                    updateSubCategoryNav();
                    updateCategoryDisplay();
                    showUpdateNotification(`منو به‌روزرسانی شد: ${notification.action === 'DELETE' ? 'محصول حذف شد' : notification.action === 'UPDATE' ? 'محصول ویرایش شد' : 'محصول جدید اضافه شد'}.`);
                }
            } catch (error) {
                console.error('❌ [APP] خطا در به‌روزرسانی منو پس از اطلاع‌رسانی ادمین:', error);
                showUpdateNotification('خطا در به‌روزرسانی منو.', 'error');
            }
        } else {
            console.log('✅ [APP] اطلاع‌رسانی جدیدی از ادمین یافت نشد.');
        }
        console.log('===== 📢 [APP] پایان بررسی اطلاع‌رسانی از ادمین =====\n\n');
    }, 5000); // هر 5 ثانیه یکبار بررسی کن

    menuUpdateInterval = setInterval(async () => {
        console.log('\n\n===== ⏰ [APP] شروع بررسی به‌روزرسانی‌های منو (سرور) =====');
        
        // بررسی عادی به‌روزرسانی‌ها
        const hasUpdates = await checkForMenuUpdates();

        if (hasUpdates) {
            console.log('✨ [APP] به‌روزرسانی منو با داده‌های جدید...');
            try {
                window.allMenuItems = await fetchMenuItems();
                
                if (state.currentPage === 'menu') {
                    renderProducts();
                    updateSubCategoryNav();
                    updateCategoryDisplay();
                    showUpdateNotification('منو با موفقیت به‌روزرسانی شد.');
                }
            } catch (error) {
                console.error('❌ [APP] خطا در به‌روزرسانی منو پس از آپدیت:', error);
                showUpdateNotification('خطا در به‌روزرسانی منو.', 'error');
            }
        } else {
            console.log('✅ [APP] به‌روزرسانی جدیدی از سرور یافت نشد.');
        }
        console.log('===== ⏰ [APP] پایان بررسی به‌روزرسانی‌های منو (سرور) =====\n\n');
    }, 30000); // 30000 میلی‌ثانیه = 30 ثانیه
    
    // تابع پاک‌سازی برای جلوگیری از نشت حافظه
    window.stopMenuAutoUpdate = () => {
        clearInterval(checkForAdminUpdates);
        clearInterval(menuUpdateInterval);
        console.log('🛑 [APP] به‌روزرسانی خودکار منو متوقف شد.');
    };
}

function stopMenuAutoUpdate() {
    if (menuUpdateInterval) {
        clearInterval(menuUpdateInterval);
        menuUpdateInterval = null;
        console.log('🛑 Stopped automatic menu updates.');
    }
}

// تابعی برای نمایش اعلان به کاربر
function showUpdateNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `update-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 9999;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}


// ================================= تابع جدید برای گرفتن داده‌ها =================================
async function fetchMenuData() {
    console.log('\n\n===== 🚀 [APP] شروع مقداردهی اولیه برنامه و دریافت داده‌ها =====');
    try {
        console.log('📡 [APP] در حال دریافت داده‌ها از سرور...');
        window.allMenuItems = await fetchMenuItems();
        console.log('✅ [APP] داده‌ها با موفقیت دریافت شد:', window.allMenuItems);
        console.log('📊 [APP] تعداد کل محصولات در allMenuItems:', window.allMenuItems.length);
        
        initializeApp();
        // بعد از مقداردهی اولیه، آپدیت خودکار را شروع کن
        startMenuAutoUpdate();
    } catch (error) {
        console.error("❌ [APP] خطا در گرفتن داده‌ها:", error);
        document.body.innerHTML = `
            <div class="container text-center mt-5">
                <h1>خطا در بارگذاری منو</h1>
                <p>${error.message}</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">تلاش مجدد</button>
            </div>
        `;
    }
    console.log('===== 🚀 [APP] پایان مقداردهی اولیه برنامه و دریافت داده‌ها =====\n\n');
}


// ================================= تابع اصلی برای راه‌اندازی برنامه =================================
function initializeApp() {
    console.log('برنامه با داده‌های دریافتی مقداردهی اولیه می‌شود.');

    // --- مرحله ۱: اختصاص دهی عناصری که در config.js تعریف نشده‌اند ---
    elements.submitOrderBtn = document.getElementById('submit-order-btn');
    elements.confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    elements.cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    elements.paymentFormContainer = document.getElementById('payment-form-container');
    elements.orderReviewContainer = document.getElementById('order-review-container');

    // --- مرحله ۲: منطق انتخاب روش پرداخت ---
    const paymentMethodsGrid = document.querySelector('.payment-methods-grid');
    if (paymentMethodsGrid) {
        paymentMethodsGrid.addEventListener('click', (e) => {
            const box = e.target.closest('.payment-method-box');
            if (box) {
                const paymentMethod = box.dataset.paymentMethod;
                
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

    // --- مرحله ۳: تنظیم روش پرداخت پیش‌فرض ---
    const defaultPaymentMethod = state.isFromQRCode ? 'cash' : 'paypal';
    const defaultPaymentBox = document.querySelector(`[data-payment-method="${defaultPaymentMethod}"]`);
    if (defaultPaymentBox) {
        defaultPaymentBox.click(); // شبیه‌سازی کلیک برای اجرای منطق انتخاب
    }

    // --- Attach functions to global window object ---
    window.changeQuantity = changeQuantity;
    window.removeFromOrder = removeFromOrder;

    // --- EVENT LISTENERS ---
    elements.categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => showPage('menu', btn.dataset.mainCategory));
    });

    elements.subcategoryNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('subcategory-btn')) {
            elements.subcategoryNav.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.currentSubCategory = e.target.dataset.subCategory;
            renderProducts();
            updateCategoryDisplay();
        }
    });

    elements.orderTypeRadios.forEach(radio => radio.addEventListener('change', updateOrderTypeUI));

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('.add-btn')) {
            const controls = e.target.closest('.add-to-order-controls');
            const productId = parseInt(controls.dataset.productId, 10);
            addToOrder(e, productId);
        }
        if (e.target.closest('.favorite-btn')) {
            const favId = parseInt(e.target.closest('.favorite-btn').dataset.favId, 10);
            toggleFavorite(favId);
        }
        if (e.target.hasAttribute('data-page')) showPage(e.target.getAttribute('data-page'));
    });

    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });

    elements.mobileBottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(item.dataset.page);
        });
    });

    const userPanelNavLinks = elements.userPanelSidebar.querySelectorAll('a[data-page]');
    userPanelNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.getAttribute('data-page'));
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
            showView(currentView + 1);
            startAutoplay();
        });

        carouselPrevBtn.addEventListener('click', () => {
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
                showView(currentView + 1); // برو به نما بعدی
            }
            // اگر کاربر به راست سوایپ کرده (انگشتش را به راست کشیده)
            if (touchEndX > touchStartX + swipeThreshold) {
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
        restaurantCarousel.addEventListener('mouseenter', stopAutoplay);
        restaurantCarousel.addEventListener('mouseleave', startAutoplay);

        // --- مقداردهی اولیه ---
        showView(0); // نمایش اولین نما
        startAutoplay(); // شروع انیمیشن خودکار
    }
    // --- پایان کد جدید گالری رستوران ---


    elements.hamburgerMenuBtn.addEventListener('click', () => {
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
        // --- شروع کد دیباگ ---
        console.log('🛒 دکمه سبد خرید کلیک شد.');
        console.log('وضعیت فعلی سفارش (state.order):', state.order);
        console.log('مرحله فعلی سفارش (state.currentOrderStep):', state.currentOrderStep);
        console.log('عنصر سبد خرید (orderReviewContainer):', elements.orderReviewContainer);
        console.log('عنصر فرم پرداخت (paymentFormContainer):', elements.paymentFormContainer);
        // --- پایان کد دیباگ ---

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
                showPaymentView();
            } else {
                alert('Your order is empty.');
            }
        });
    }

    if (elements.cancelPaymentBtn) {
        elements.cancelPaymentBtn.addEventListener('click', () => {
            showOrderReviewView();
        });
    }

    if (elements.confirmPaymentBtn) {
        elements.confirmPaymentBtn.addEventListener('click', () => {
            const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');
            
            if (!selectedPaymentMethod) {
                alert('Please select a payment method.');
                return;
            }
            
            confirmPayment();
        });
    }

    // Window resize event
    window.addEventListener('resize', debounce(() => {
        updateStickyNavPosition();
        updateNavigationWrapper();
    }, 250));

    // --- INITIALIZATION LOGIC ---
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
        state.currentTableNumber = tableFromUrl;
        state.isFromQRCode = true;
        setTimeout(() => showPage('menu'), 100);
    }

    const header = elements.headerContainer;
    if (header) {
        const resizeObserver = new ResizeObserver(() => updateStickyNavPosition());
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
                    
                    console.log(`🔍 تغییر کلاس در عنصر: #${element.id}`);
                    console.log(`   کلاس قبلی: "${oldClasses}"`);
                    console.log(`   کلاس جدید: "${newClasses}"`);
                    console.trace(); // این خط بسیار مهم است! پشته فراخوانی (call stack) را نشان می‌دهد
                }
            });
        });

        // تنظیم آبزرور برای مشاهده تغییرات در کلاس‌ها
        observer.observe(reviewContainer, { attributes: true, attributeOldValue: true });
        observer.observe(paymentContainer, { attributes: true, attributeOldValue: true });
    }
    // --- پایان کد دیباگ پیشرفته ---
    document.getElementById('order-items').addEventListener('input', (e) => {
        if (e.target.classList.contains('order-item-note')) {
            const itemId = parseInt(e.target.closest('.order-item').dataset.itemId, 10);
            const item = state.order.find(i => i.id === itemId);
            if (item) {
                item.note = e.target.value;
            }
        }
    });
    elements.orderTotalReview = document.getElementById('order-total-review');
}


// ================================= نقطه شروع برنامه =================================
// فقط این یک خط را به عنوان نقطه شروع اصلی قرار می‌دهیم
document.addEventListener('DOMContentLoaded', fetchMenuData);

// برای جلوگیری از درخواست‌های بی‌موقع وقتی تب غیرفعال است
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopMenuAutoUpdate();
    } else {
        startMenuAutoUpdate();
    }
});

// ============================== END OF JAVASCRIPT FILE ==============================