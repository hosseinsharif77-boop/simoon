// ================================= JAVASCRIPT FILE =================================
// File: js/menu.js
// Description: Menu and order logic for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= IMPORTS =================================
let allMenuItems = [];

// ================================= DEBUGGING FUNCTION =================================
/**
 * یک تابع دیباگ بسیار دقیق برای بررسی وضعیت کامل برنامه هنگام رندر کردن محصولات.
 */
function debugRenderProducts() {
    console.log('\n\n===== DEBUGGING renderProducts =====');

    // ۱. بررسی محتوای allMenuItems
    console.log('1. allMenuItems content:');
    console.log(window.allMenuItems);
    if (window.allMenuItems.length === 0) {
        console.error('⛔ CRITICAL ERROR: allMenuItems is EMPTY!');
    } else {
        console.log(`✅ allMenuItems has ${window.allMenuItems.length} items.`);
    }

    // ۲. بررسی وضعیت (state)
    console.log('\n2. Application State (state object):');
    console.log(state);
    console.log(`   - currentMainCategory: "${state.currentMainCategory}"`);
    console.log(`   - currentSubCategory: "${state.currentSubCategory}"`);

    // ۳. بررسی نتیجه فیلتر
    const itemsToRender = window.allMenuItems.filter(item => 
        item.mainCategory === state.currentMainCategory && 
        item.subCategory === state.currentSubCategory 
    );
    console.log('\n3. Filtering Result:');
    console.log(`Found ${itemsToRender.length} items to render.`);
    console.log(itemsToRender);

    // ۴. بررسی عناصر DOM
    console.log('\n4. DOM Elements Status:');
    console.log('   - elements.menuGrid:', elements.menuGrid);
    console.log('   - elements.categoryPromptText:', elements.categoryPromptText);

    console.log('====================================\n\n');
}
// ========================== END OF DEBUGGING FUNCTION ==========================
import { elements, state } from './config.js';
import { formatPrice } from './utils.js';
// --- اصلاح مهم: updateOrderUI را از اینجا حذف کردیم چون در همین فایل تعریف می‌شود ---
import { updateProductCardControls, closeOrderSidebar } from './ui.js';
// ========================== END OF IMPORTS ==========================

// ================================= MENU RENDERING =================================
/**
 * Renders the product grid for the currently selected main and sub-category.
 * Filters the master menu list and generates HTML for each product card.
 */
export const renderProducts = () => {
    console.log('\n\n===== 🖼️ [MENU] شروع رندر کردن محصولات =====');
    
    // ۱. بررسی محتوای allMenuItems
    console.log('1. [MENU] محتوای allMenuItems:');
    console.log(window.allMenuItems);
    if (window.allMenuItems.length === 0) {
        console.error('⛔ [MENU] خطای بحرانی: allMenuItems خالی است!');
        elements.menuGrid.innerHTML = `<p class="col-span-full text-center text-gray-500 text-lg">در حال بارگذاری محصولات...</p>`;
        return;
    } else {
        console.log(`✅ [MENU] allMenuItems شامل ${window.allMenuItems.length} محصول است.`);
    }

    // ۲. بررسی وضعیت (state)
    console.log('\n2. [MENU] وضعیت برنامه (state object):');
    console.log(state);
    console.log(`   - currentMainCategory: "${state.currentMainCategory}"`);
    console.log(`   - currentSubCategory: "${state.currentSubCategory}"`);

    // ۳. بررسی نتیجه فیلتر - اصلاح مهم
    const itemsToRender = window.allMenuItems.filter(item => {
        // بررسی اگر زیردسته خالی است، آن را نادیده بگیر
        if (!item.subCategory || item.subCategory.trim() === '') {
            return false;
        }
        
        return item.mainCategory === state.currentMainCategory && 
               item.subCategory === state.currentSubCategory;
    });
    
    console.log('\n3. [MENU] نتیجه فیلتر:');
    console.log(`تعداد ${itemsToRender.length} محصول برای نمایش یافت شد.`);
    console.log(itemsToRender);

    // ۴. بررسی عناصر DOM
    console.log('\n4. [MENU] وضعیت عناصر DOM:');
    console.log('   - elements.menuGrid:', elements.menuGrid);
    console.log('   - elements.categoryPromptText:', elements.categoryPromptText);

    // پاک کردن محتوای موجود
    elements.menuGrid.innerHTML = '';

    // نمایش پیام اگر محصولی یافت نشد
    if (itemsToRender.length === 0) {
        elements.menuGrid.innerHTML = `<p class="col-span-full text-center text-gray-500 text-lg">محصولی در این دسته‌بندی یافت نشد.</p>`;
        elements.categoryPromptText.innerHTML = '';
        return;
    }

    // تولید و اضافه کردن کارت‌های محصول
    itemsToRender.forEach(item => {
        const isFavorite = state.favorites.some(fav => fav.id === item.id); 
        const productCard = document.createElement('article');
        productCard.className = 'product-card-wrapper';
        productCard.dataset.productId = item.id;
        productCard.innerHTML = `
            <div class="product-image-container">
                <img src="${item.image}" alt="${item.name}" class="product-image">
            </div>
            <div class="product-card">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-fav-id="${item.id}">
                    <i class="fas fa-heart"></i>
                </button>
                <div class="card-content">
                    <div>
                        <h3 class="text-sm font-bold mb-1">${item.name}</h3>
                        <p class="text-lg font-semibold text-amber-500 mb-1">${formatPrice(item.price)}</p>
                        <p class="text-xs text-gray-400 mb-3">${item.available} موجود</p>
                    </div>
                    <div class="add-to-order-controls flex items-center justify-center gap-2" data-product-id="${item.id}">
                        <button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        elements.menuGrid.appendChild(productCard);
    });

    // به‌روزرسانی کنترل‌ها پس از رندر کردن محصولات جدید
    updateProductCardControls();
    console.log('✅ [MENU] محصولات با موفقیت رندر شدند.');
    console.log('===== 🖼️ [MENU] پایان رندر کردن محصولات =====\n\n');
};


// ========================== END OF MENU RENDERING ==========================

// ================================= ORDER MANAGEMENT =================================
export const addToOrder = (e, productId) => {
    // استفاده از window.allMenuItems
    const product = window.allMenuItems.find(p => p.id === productId);
    if (!product) return;

    const existingItem = state.order.find(item => item.id === productId); 
    if (existingItem) {
        existingItem.quantity++;
    } else {
        state.order.push({ ...product, quantity: 1, note: '' }); 
    }

    // --- Flying Image Animation ---
    const productCard = e.target.closest('.product-card-wrapper');
    const productImg = productCard.querySelector('.product-image');
    const orderIconRect = elements.menuOrderBtn.getBoundingClientRect();
    const productImgRect = productImg.getBoundingClientRect();
    
    const flyingImg = productImg.cloneNode(true);
    flyingImg.classList.add('flying-image');
    
    Object.assign(flyingImg.style, {
        position: 'fixed',
        top: `${productImgRect.top}px`,
        left: `${productImgRect.left}px`,
        width: `${productImgRect.width}px`,
        height: `${productImgRect.height}px`,
        zIndex: '9999',
        pointerEvents: 'none',
        borderRadius: '50%',
    });
    
    document.body.appendChild(flyingImg);
    
    setTimeout(() => {
        const finalX = orderIconRect.left + (orderIconRect.width / 2) - (productImgRect.width / 2);
        const finalY = orderIconRect.top + (orderIconRect.height / 2) - (productImgRect.height / 2);
        
        flyingImg.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        flyingImg.style.transform = `translate(${finalX - productImgRect.left}px, ${finalY - productImgRect.top}px) scale(0.2) rotate(15deg)`;
        flyingImg.style.opacity = '0.5';
    }, 10);
    
    setTimeout(() => { 
        flyingImg.remove(); 
        elements.menuOrderBtn.classList.add('shake-animation'); 
        setTimeout(() => elements.menuOrderBtn.classList.remove('shake-animation'), 500); 
    }, 800);
    
    updateOrderUI(); 
    updateProductCardControls(productId);
};

export const changeQuantity = (productId, change) => {
    const item = state.order.find(i => i.id === productId); 
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromOrder(productId);
        } else {
            updateOrderUI();
            updateProductCardControls(productId);
        }
    }
};

export const removeFromOrder = (productId) => {
    state.order = state.order.filter(item => item.id !== productId); 
    updateOrderUI();
    updateProductCardControls(productId);
};

// --- توابع جدید برای فرآیند پرداخت ---

/**
 * نمایش مرحله انتخاب روش پرداخت در سایدبار.
 */
export const showPaymentView = () => {
    console.log('🔧 تابع showPaymentView اجرا شد.'); // این لاگ را اضافه کنید
    
    state.currentOrderStep = 'payment';
    
    // مخفی کردن سبد خرید
    elements.orderReviewContainer.classList.add('hidden');
    
    // نمایش فرم پرداخت
    elements.paymentFormContainer.classList.remove('hidden');
};

/**
 * بازگشت به مرحله بررسی سفارش.
 */
// در فایل js/menu.js

export const showOrderReviewView = () => {
    console.log('🔧 تابع showOrderReviewView اجرا شد.');
    console.log('🔧 عنصر paymentFormContainer:', elements.paymentFormContainer);
    console.log('🔧 عنصر orderReviewContainer:', elements.orderReviewContainer);
    
    state.currentOrderStep = 'review';
    console.log('🔧 وضعیت currentOrderStep تنظیم شد روی:', state.currentOrderStep);

    if (elements.paymentFormContainer) {
        console.log('🔧 در حال اضافه کردن کلاس hidden به paymentFormContainer...');
        elements.paymentFormContainer.classList.add('hidden');
        console.log('🔧 کلاس‌های فعلی paymentFormContainer:', elements.paymentFormContainer.className);
    } else {
        console.error('❌ خطا: عنصر paymentFormContainer پیدا نشد!');
    }

    if (elements.orderReviewContainer) {
        console.log('🔧 در حال حذف کلاس hidden از orderReviewContainer...');
        elements.orderReviewContainer.classList.remove('hidden');
        console.log('🔧 کلاس‌های فعلی orderReviewContainer:', elements.orderReviewContainer.className);
    } else {
        console.error('❌ خطا: عنصر orderReviewContainer پیدا نشد!');
    }
};

/**
 * مدیریت نهایی سفارش پس از تایید پرداخت.
 */
export const confirmPayment = () => {
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    // ساخت لیست سفارش به همراه توضیحات
    let orderDetails = state.order.map(item => 
        `${item.quantity}x ${item.name} ${item.note ? `(Note: ${item.note})` : ''}`
    ).join('\n');
    
    alert(`Order confirmed!\n\nOrder Details:\n${orderDetails}\n\nPayment Method: ${selectedPaymentMethod}\nTotal: ${elements.orderTotal.textContent}`);
    
    state.order = [];
    state.currentOrderStep = 'review';
    updateOrderUI(); 
    updateProductCardControls(); 
    closeOrderSidebar();
};

// --- تابع اصلی و کامل برای به‌روزرسانی سفارش ---
// در فایل js/menu.js

export const updateOrderUI = () => {
    const totalItems = state.order.reduce((sum, item) => sum + item.quantity, 0);
    elements.menuOrderCount.textContent = totalItems;
    elements.menuOrderCount.classList.toggle('hidden', totalItems === 0);

    const totalPrice = formatPrice(state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0));

    // به‌روزرسانی هر دو نمایش مجموع
    if (elements.orderTotal) elements.orderTotal.textContent = totalPrice;
    if (elements.orderTotalReview) elements.orderTotalReview.textContent = totalPrice;

    if (state.order.length === 0) {
        elements.orderItemsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">You haven\'t ordered anything yet.</p>';
    } else {
        elements.orderItemsContainer.innerHTML = state.order.map(item => `
            <div class="order-item" data-item-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="order-item-image">
                <div class="order-item-details">
                    <h4 class="order-item-name">${item.name}</h4>
                    <div class="order-item-meta">
                        <span class="order-item-price">${formatPrice(item.price)}</span>
                        <div class="order-item-qty-controls">
                            <button onclick="changeQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="changeQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <input type="text" class="order-item-note" placeholder="Add a note (e.g., less salt)" value="${item.note || ''}">
                </div>
            </div>
        `).join('');
    }
};

// ========================== END OF ORDER MANAGEMENT ==========================
// ============================== END OF JAVASCRIPT FILE ==============================