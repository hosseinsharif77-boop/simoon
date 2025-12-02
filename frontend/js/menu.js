// ================================= JAVASCRIPT FILE =================================
// File: js/menu.js
// Description: Menu and order logic for the Simoon Cafe application.
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= IMPORTS =================================
let allMenuItems = [];

import { elements, state } from './config.js';
import { formatPrice, normalizeImagePath } from './utils.js';
import { updateProductCardControls, closeOrderSidebar } from './ui.js';
import { 
    menuLogger, 
    orderLogger, 
    logDetailedMenuState,
    createPerformanceMonitor
} from './logger.js';
// ========================== END OF IMPORTS ==========================

// ================================= HELPER FUNCTIONS =================================
/**
 * Creates text representation of ingredients
 * @param {Array} ingredients - Array of ingredient objects
 * @returns {string} HTML string of ingredients
 */
const createIngredientsText = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return 'No ingredients information available';
    return ingredients.map(ing => {
        let quantityText = '';
        if (ing.quantity && ing.unit) {
            quantityText = `${ing.quantity}${ing.unit}`;
        } else if (ing.quantity) {
            quantityText = `${ing.quantity}g`;
        }
        return `<span class="ingredient-item">${ing.name} <span class="ingredient-quantity">(${quantityText})</span></span>`;
    }).join('');
};

/**
 * Gets stock status text based on quantity
 * @param {number} quantity - Stock quantity
 * @returns {string} HTML string of stock status
 */
const getStockStatus = (quantity) => {
    if (quantity > 10) return '<span class="text-green-600">In Stock</span>';
    if (quantity > 0) return `<span class="text-yellow-600">Only ${quantity} left</span>`;
    return '<span class="text-red-600">Out of Stock</span>';
};
// ========================== END OF HELPER FUNCTIONS ==========================

// ================================= MENU RENDERING =================================
/**
 * Renders product grid for currently selected main and sub-category.
 * Filters products based on main category and special status.
 * Uses an atomic update with a fade transition for a smooth UX.
 */
export const renderProducts = () => {
    const monitor = createPerformanceMonitor('renderProducts');
    
    menuLogger.section('Render Products');
    
    // استفاده از requestAnimationFrame برای اطمینان از ترتیب صحیح رندر
    requestAnimationFrame(() => {
        menuLogger.debug('Current state for rendering', {
            currentMainCategory: state.currentMainCategory,
            currentSubCategory: state.currentSubCategory,
            totalItems: window.allMenuItems.length
        });
        
        // فیلتر کردن محصولات بر اساس دسته بندی فعلی
        const filteredItems = window.allMenuItems.filter(item => {
            // اگر در تب specials هستیم، فقط محصولات ویژه را نشان بده
            if (state.currentMainCategory === 'specials') {
                return item.is_special === true;
            }
            
            // برای تب‌های دیگر، بر اساس دسته بندی اصلی و زیردسته فیلتر کن
            const categoryMatch = item.category === state.currentMainCategory;
            const subcategoryMatch = !state.currentSubCategory || item.sub_category === state.currentSubCategory;
            
            return categoryMatch && subcategoryMatch;
        });
        
        menuLogger.debug('Filtering results', {
            filteredItemsCount: filteredItems.length,
            categoryMatch: state.currentMainCategory,
            subcategoryMatch: state.currentSubCategory
        });
        
        // ساخت محتوای جدید
        const fragment = document.createDocumentFragment();
        
        if (filteredItems.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state text-center py-12';
            emptyMessage.innerHTML = `
                <div class="text-gray-500">
                    <i class="fas fa-utensils text-4xl mb-4"></i>
                    <p class="text-lg">No products found in this category</p>
                    <p class="text-sm mt-2">Please try another category</p>
                </div>
            `;
            fragment.appendChild(emptyMessage);
        } else {
            filteredItems.forEach((item, index) => {
                const productCard = createProductCard(item, index);
                fragment.appendChild(productCard);
            });
        }
        
        // جایگزینی محتوا به صورت atomic
        elements.menuGrid.innerHTML = '';
        elements.menuGrid.appendChild(fragment);
        
        menuLogger.debug('Products rendered', {
            filteredItemsCount: filteredItems.length
        });
        
        // اضافه کردن event listener ها
        attachProductEventListeners();
        
        // آپدیت کنترل‌های محصولات
        updateProductCardControls();
        
        monitor.end({ totalItems: window.allMenuItems.length, filteredItems: filteredItems.length });
        menuLogger.endSection();
    });
};

// تابع کمکی برای ساخت کارت محصول
const createProductCard = (item, index) => {
    const productCard = document.createElement('div');
    productCard.className = 'menu-item product-card-wrapper';
    productCard.dataset.productId = item.id;
    
    // اضافه کردن delay برای انیمیشن بر اساس index
    productCard.style.animationDelay = `${index * 0.05}s`;
    productCard.style.setProperty('--item-index', index);
    
    const ingredientsText = createIngredientsText(item.ingredients);
    const stockStatus = getStockStatus(item.stock_quantity);
    const normalizedImagePath = normalizeImagePath(item.image);
    
    productCard.innerHTML = `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${normalizedImagePath}" alt="${item.name}" class="product-image">
                <button class="favorite-btn" data-fav-id="${item.id}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
            <div class="card-content">
                <h3 class="menu-item-name">${item.name}</h3>
                <div class="separator-line"></div> <!-- خط جداکننده بین نام و توضیحات -->
                <div class="menu-item-details">
                    <div class="ingredients-section">
                        <p class="ingredients-title">Ingredients:</p>
                        <p class="menu-item-description">${ingredientsText}</p>
                    </div>
                    <div class="separator-line"></div> <!-- خط جداکننده بین توضیحات و قیمت -->
                    <div class="menu-item-footer">
                        <div class="price-row">
                            <p class="menu-item-price">$${formatPrice(item.price)}</p>
                        </div>
                        <div class="stock-row">
                            <p class="menu-item-stock">${stockStatus}</p>
                        </div>
                    </div>
                </div>
                <div class="separator-line"></div>
                <div class="add-to-order-controls" data-product-id="${item.id}">
                    ${item.stock_quantity > 0 ? `
                        <button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors">
                            <i class="fas fa-plus text-sm"></i>
                        </button>
                    ` : `
                        <button class="add-btn bg-gray-400 text-white w-8 h-8 rounded-full cursor-not-allowed" disabled>
                            <i class="fas fa-times text-sm"></i>
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
    
    return productCard;
};

// تابع کمکی برای اضافه کردن event listener ها
const attachProductEventListeners = () => {
    // Event listener برای دکمه‌های افزودن به سفارش
    document.querySelectorAll('.add-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const productCard = this.closest('.product-card-wrapper');
            const productId = parseInt(productCard.dataset.productId, 10);
            menuLogger.debug('Add button clicked', { productId });
            addToOrder(e, productId);
        });
    });
    
    // Event listener برای دکمه‌های مورد علاقه
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productId = parseInt(this.dataset.favId, 10);
            toggleFavorite(productId);
        });
    });
};
// ========================== END OF MENU RENDERING ==========================

// ================================= ORDER MANAGEMENT =================================
/**
 * Adds a product to the order or increases its quantity if already in the order.
 * Triggers a flying animation from the product image to the cart button.
 * @param {Event} e - The click event
 * @param {number} productId - The ID of product to add
 */
export const addToOrder = (e, productId) => {
    const product = window.allMenuItems.find(p => p.id === productId);
    if (!product) {
        orderLogger.error('Product not found when adding to order', { productId });
        return;
    }

    const existingItem = state.order.find(item => item.id === productId); 
    let isNewItem = false;
    
    if (existingItem) {
        existingItem.quantity++;
        orderLogger.debug('Item quantity increased in order', {
            productId,
            productName: product.name,
            newQuantity: existingItem.quantity
        });
    } else {
        state.order.push({ ...product, quantity: 1, note: '' }); 
        isNewItem = true;
        orderLogger.info('New item added to order', {
            productId,
            productName: product.name,
            price: product.price
        });
    }

    // Update UI first
    updateOrderUI(); 
    updateProductCardControls(productId);
    
    // Execute flying animation
    executeFlyingAnimationForProduct(productId);
};

/**
 * Changes the quantity of an item in the order.
 * Triggers a flying animation when increasing quantity.
 * @param {number} productId - The ID of product
 * @param {number} change - The change in quantity (positive or negative)
 */
export const changeQuantity = (productId, change) => {
    const item = state.order.find(i => i.id === productId); 
    if (item) {
        const oldQuantity = item.quantity;
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromOrder(productId);
        } else {
            orderLogger.debug('Item quantity changed', {
                productId,
                productName: item.name,
                oldQuantity,
                newQuantity: item.quantity,
                change
            });
            
            // Execute flying animation when increasing quantity
            if (change > 0) {
                executeFlyingAnimationForProduct(productId);
            }
            
            updateOrderUI();
            updateProductCardControls(productId);
        }
    } else {
        orderLogger.error('Item not found in order when changing quantity', { productId });
    }
};

/**
 * Removes an item from the order.
 * @param {number} productId - The ID of product to remove
 */
export const removeFromOrder = (productId) => {
    const item = state.order.find(i => i.id === productId);
    const itemName = item ? item.name : 'Unknown';
    
    state.order = state.order.filter(item => item.id !== productId); 
    
    orderLogger.info('Item removed from order', {
        productId,
        productName: itemName
    });
    
    updateOrderUI();
    updateProductCardControls(productId);
};

/**
 * Executes the flying animation for a product.
 * @param {number} productId - The ID of product
 */
const executeFlyingAnimationForProduct = (productId) => {
    try {
        // Find required elements for animation
        const productCard = document.querySelector(`.product-card-wrapper[data-product-id="${productId}"]`);
        
        if (!productCard) {
            return;
        }
        
        const productImg = productCard.querySelector('.product-image');
        
        if (!productImg || !elements.menuOrderBtn) {
            return;
        }
        
        // Ensure cart button is visible
        if (elements.menuOrderBtn.classList.contains('hidden')) {
            elements.menuOrderBtn.classList.remove('hidden');
            elements.menuOrderBtn.style.display = 'flex';
            elements.menuOrderBtn.style.visibility = 'visible';
        }
        
        // Ensure button has correct dimensions
        if (elements.menuOrderBtn.offsetWidth === 0 || elements.menuOrderBtn.offsetHeight === 0) {
            elements.menuOrderBtn.style.width = '56px';
            elements.menuOrderBtn.style.height = '56px';
        }
        
        // Wait for UI to update and button to get dimensions
        setTimeout(() => {
            const orderIconRect = elements.menuOrderBtn.getBoundingClientRect();
            const productImgRect = productImg.getBoundingClientRect();
            
            // If values are not valid, cancel animation
            if (orderIconRect.width === 0 || orderIconRect.height === 0 || 
                productImgRect.width === 0 || productImgRect.height === 0) {
                return;
            }
            
            // Execute animation using separate function
            executeFlyingAnimation(productImg, orderIconRect, productImgRect, productId);
        }, 100);
    } catch (error) {
        orderLogger.error('Error in flying animation', { error, productId });
    }
};

/**
 * Executes the flying image animation.
 * @param {HTMLElement} productImg - The product image element
 * @param {DOMRect} orderIconRect - The rectangle of order button
 * @param {DOMRect} productImgRect - The rectangle of product image
 * @param {number} productId - The ID of product
 */
const executeFlyingAnimation = (productImg, orderIconRect, productImgRect, productId) => {
    // Create a unique ID for this flying image
    const uniqueId = `flying-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Clone image
    const flyingImg = productImg.cloneNode(true);
    flyingImg.id = uniqueId;
    flyingImg.classList.add('flying-image');
    
    // Set initial styles
    const initialStyles = {
        position: 'fixed',
        top: `${productImgRect.top}px`,
        left: `${productImgRect.left}px`,
        width: `${productImg.width}px`,
        height: `${productImgRect.height}px`,
        zIndex: '10000',
        pointerEvents: 'none',
        borderRadius: '50%',
        margin: '0',
        padding: '0',
        boxSizing: 'border-box',
        transition: 'none',
        transform: 'translate(0, 0) scale(1)',
        opacity: '1'
    };
    
    Object.assign(flyingImg.style, initialStyles);
    
    // Add to body
    document.body.appendChild(flyingImg);
    
    // Force a reflow
    flyingImg.offsetHeight;
    
    // Set transition and animate
    requestAnimationFrame(() => {
        // Recalculate values to ensure they are correct
        const freshOrderIconRect = elements.menuOrderBtn.getBoundingClientRect();
        const freshProductImgRect = productImg.getBoundingClientRect();
        
        // If values are not valid, cancel animation
        if (freshOrderIconRect.width === 0 || freshOrderIconRect.height === 0 || 
            freshProductImgRect.width === 0 || freshProductImgRect.height === 0) {
            document.getElementById(uniqueId)?.remove();
            return;
        }
        
        const finalX = freshOrderIconRect.left + (freshOrderIconRect.width / 2) - (freshProductImgRect.width / 2);
        const finalY = freshOrderIconRect.top + (freshOrderIconRect.height / 2) - (freshProductImgRect.height / 2);
        
        const finalTransform = `translate(${finalX - freshProductImgRect.left}px, ${finalY - freshProductImgRect.top}px) scale(0.2) rotate(15deg)`;
        
        flyingImg.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        flyingImg.style.transform = finalTransform;
        flyingImg.style.opacity = '0.3';
    });
    
    // Clean up after animation
    setTimeout(() => {
        const imgToRemove = document.getElementById(uniqueId);
        
        if (imgToRemove) {
            imgToRemove.remove();
            menuLogger.debug('Flying image removed', { uniqueId });
        }
        
        // Add shake animation to cart button
        elements.menuOrderBtn.classList.remove('shake-animation');
        void elements.menuOrderBtn.offsetWidth; // Force reflow
        elements.menuOrderBtn.classList.add('shake-animation');
        
        setTimeout(() => {
            elements.menuOrderBtn.classList.remove('shake-animation');
        }, 500);
    }, 800);
};

// --- Payment Process Functions ---

/**
 * Displays the payment method selection step in the sidebar.
 */
export const showPaymentView = () => {
    orderLogger.info('Showing payment view', {
        orderLength: state.order.length,
        totalAmount: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
    
    state.currentOrderStep = 'payment';
    
    // Hide order review
    elements.orderReviewContainer.classList.add('hidden');
    
    // Show payment form
    elements.paymentFormContainer.classList.remove('hidden');
};

/**
 * Returns to the order review step.
 */
export const showOrderReviewView = () => {
    orderLogger.info('Showing order review view', {
        orderLength: state.order.length,
        totalAmount: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
    
    state.currentOrderStep = 'review';

    if (elements.paymentFormContainer) {
        elements.paymentFormContainer.classList.add('hidden');
    } else {
        orderLogger.error('Payment form container not found');
    }

    if (elements.orderReviewContainer) {
        elements.orderReviewContainer.classList.remove('hidden');
    } else {
        orderLogger.error('Order review container not found');
    }
};

/**
 * Finalizes the order after payment confirmation.
 */
export const confirmPayment = () => {
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    // Create order list with notes
    let orderDetails = state.order.map(item => 
        `${item.quantity}x ${item.name} ${item.note ? `(Note: ${item.note})` : ''}`
    ).join('\n');
    
    orderLogger.info('Order confirmed', {
        paymentMethod: selectedPaymentMethod,
        orderLength: state.order.length,
        totalAmount: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        orderDetails
    });
    
    alert(`Order confirmed!\n\nOrder Details:\n${orderDetails}\n\nPayment Method: ${selectedPaymentMethod}\nTotal: ${elements.orderTotal.textContent}`);
    
    state.order = [];
    state.currentOrderStep = 'review';
    updateOrderUI(); 
    updateProductCardControls(); 
    closeOrderSidebar();
};

/**
 * Updates the order sidebar UI, including item count, list of items, and total price.
 */
export const updateOrderUI = () => {
    const totalItems = state.order.reduce((sum, item) => sum + item.quantity, 0);
    elements.menuOrderCount.textContent = totalItems;
    elements.menuOrderCount.classList.toggle('hidden', totalItems === 0);

    const totalPrice = formatPrice(state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0));

    // Update both total displays
    if (elements.orderTotal) elements.orderTotal.textContent = totalPrice;
    if (elements.orderTotalReview) elements.orderTotalReview.textContent = totalPrice;

    if (state.order.length === 0) {
        elements.orderItemsContainer.innerHTML = '<p class="text-center text-gray-500 mt-10">You haven\'t ordered anything yet.</p>';
    } else {
        elements.orderItemsContainer.innerHTML = state.order.map(item => `
            <div class="order-item" data-item-id="${item.id}">
                <img src="${normalizeImagePath(item.image)}" alt="${item.name}" class="order-item-image">
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
    
    orderLogger.debug('Order UI updated', {
        totalItems,
        totalPrice,
        orderLength: state.order.length
    });
};

// ========================== END OF ORDER MANAGEMENT ==========================
// ============================== END OF JAVASCRIPT FILE ==============================