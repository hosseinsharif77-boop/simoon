// ================================= IMPORTS =================================
import { elements } from './config.js';
import { stateManager } from './stateManager.js';
import { formatPrice, normalizeImagePath } from './utils.js';
import { updateProductCardControls, closeOrderSidebar, initSpecialsCarousel } from './ui.js';
import { 
    menuLogger, 
    orderLogger, 
    logDetailedMenuState,
    createPerformanceMonitor
} from './logger.js';
// ========================== END OF IMPORTS ==========================
let filteredMenuItems = [];
// ================================= HELPER FUNCTIONS =================================
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

const getStockStatus = (quantity) => {
    if (quantity > 10) return '<span class="text-green-600">In Stock</span>';
    if (quantity > 0) return `<span class="text-yellow-600">Only ${quantity} left</span>`;
    return '<span class="text-red-600">Out of Stock</span>';
};
// ========================== END OF HELPER FUNCTIONS ==========================

// ================================= MENU RENDERING =================================
export const toggleSpecialsCarouselVisibility = () => {
    console.log('===== TOGGLE SPECIALS CAROUSEL VISIBILITY START =====');
    const state = stateManager.getState();
    const specialsCarouselSection = document.getElementById('specials-carousel-section');
    
    console.log('Current main category:', state.currentMainCategory);
    console.log('Specials carousel section:', specialsCarouselSection);
    console.log('Specials carousel section classes:', specialsCarouselSection?.className);
    console.log('Specials carousel section innerHTML:', specialsCarouselSection?.innerHTML);
    
    if (state.currentMainCategory === 'Special') {
        console.log('Showing specials carousel for Special tab');
        specialsCarouselSection?.classList.remove('hidden');
        
        // Initialize carousel if not already done
        if (!specialsCarouselSection.hasAttribute('data-initialized')) {
            console.log('Initializing specials carousel...');
            initSpecialsCarousel();
            specialsCarouselSection.setAttribute('data-initialized', 'true');
        }
    } else {
        console.log('Hiding specials carousel for non-Special tab');
        specialsCarouselSection?.classList.add('hidden');
        
        // Clear carousel content
        const track = specialsCarouselSection?.querySelector('.specials-carousel-track');
        const indicators = specialsCarouselSection?.querySelector('.specials-carousel-indicators');
        if (track) track.innerHTML = '';
        if (indicators) indicators.innerHTML = '';
        specialsCarouselSection?.removeAttribute('data-initialized');
    }
    
    console.log('===== TOGGLE SPECIALS CAROUSEL VISIBILITY END =====');
};

export const setupSearch = () => {
    console.log('===== SETUP SEARCH START =====');
    const searchInput = document.getElementById('product-search');
    const clearSearchBtn = document.getElementById('clear-search');
    const searchContainer = document.getElementById('search-container');

    console.log('Search elements:', { searchInput, clearSearchBtn, searchContainer });

    const toggleSearchVisibility = () => {
        const state = stateManager.getState();
        console.log('Toggling search visibility for category:', state.currentMainCategory);
        if (state.currentMainCategory === 'all') {
            searchContainer.classList.remove('hidden');
        } else {
            searchContainer.classList.add('hidden');
            searchInput.value = '';
            // وقتی از تب all خارج می‌شویم، سرچ را ریست کرده و محصولات اصلی را نمایش می‌دهیم
            filteredMenuItems = [...window.allMenuItems];
            renderProducts();
        }
    };

    // اولین بار اجرا برای تنظیم وضعیت اولیه
    toggleSearchVisibility();

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        // نمایش اسپینر در حین جستجو
        const menuGrid = document.getElementById('menu-grid');
        menuGrid.innerHTML = `
            <div class="flex justify-center items-center col-span-full py-12">
                <div class="product-spinner"></div>
            </div>
        `;

        // استفاده از debounce برای جلوگیری از اجرای زیاد تابع در هنگام تایپ
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => {
            if (searchTerm === '') {
                filteredMenuItems = [...window.allMenuItems];
            } else {
                filteredMenuItems = window.allMenuItems.filter(item => {
                    return item.name.toLowerCase().includes(searchTerm) ||
                           (item.ingredients && item.ingredients.some(ing => ing.name.toLowerCase().includes(searchTerm)));
                });
            }
            console.log('Search term:', searchTerm, 'Filtered items:', filteredMenuItems.length);
            renderFilteredProducts(); // این تابع را باید بسازیم
        }, 300); // 300 میلی‌ثانیه تاخیر
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        filteredMenuItems = [...window.allMenuItems];
        renderFilteredProducts(); // این تابع را باید بسازیم
    });
    console.log('===== SETUP SEARCH END =====');
};

const renderFilteredProducts = () => {
    const monitor = createPerformanceMonitor('renderFilteredProducts');
    menuLogger.section('Render Filtered Products');
    
    // چک می‌کنیم که آیا در حالت جستجو هستیم یا خیر
    const searchInput = document.getElementById('product-search');
    const isSearchActive = searchInput.value.trim() !== '';

    // اگر سرچ فعال نبود، کنترل را به renderProducts اصلی برگردان
    if (!isSearchActive) {
        console.log('Search is not active, delegating to main renderProducts...');
        menuLogger.endSection();
        renderProducts(); // تابع اصلی را فراخوانی کن
        return;
    }
    
    // اگر سرچ فعال بود، ادامه منطق فیلتر را اجرا کن
    requestAnimationFrame(() => {
        menuLogger.debug('Rendering search results', {
            totalItems: window.allMenuItems.length,
            filteredItemsCount: filteredMenuItems.length
        });
        
        const fragment = document.createDocumentFragment();
        
        if (filteredMenuItems.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state text-center py-12 col-span-full';
            emptyMessage.innerHTML = `<p class="text-gray-500">No products found for "<span class="font-semibold">${searchInput.value}</span>"</p>`;
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

export const renderProducts = () => {
    console.log('===== RENDER PRODUCTS START =====');
    const startTime = performance.now();
    const state = stateManager.getState();
    console.log('Current state:', state);
    
    menuLogger.section('Render Products');
    
    toggleSpecialsCarouselVisibility();
    
    // نمایش اسپینر لودینگ
    const menuGrid = document.getElementById('menu-grid');
    if (menuGrid) {
        menuGrid.innerHTML = `
            <div class="flex justify-center items-center col-span-full py-12">
                <div class="product-spinner"></div>
            </div>
        `;
    }
    
    requestAnimationFrame(() => {
        let itemsToRender = [];
        
        // اگر در حالت جستجو هستیم، از آرایه فیلتر شده استفاده کن
        const isSearchActive = document.getElementById('product-search').value.trim() !== '';
        
        if (isSearchActive) {
            itemsToRender = filteredMenuItems;
            console.log('Rendering filtered search results:', itemsToRender.length);
        } else {
            // در غیر این صورت، منطق عادی دسته‌بندی را اجرا کن
            if (state.currentMainCategory === 'all') {
                itemsToRender = state.allMenuItems;
                stateManager.setState({ currentSubCategory: '' });
            } else if (state.currentMainCategory === 'Special') {
                itemsToRender = state.allMenuItems.filter(item => item.is_special === true);
            } else {
                itemsToRender = state.allMenuItems.filter(item => {
                    const categoryMatch = item.mainCategory === state.currentMainCategory;
                    const subcategoryMatch = !state.currentSubCategory || item.subCategory === state.currentSubCategory;
                    return categoryMatch && subcategoryMatch;
                });
            }
        }
        
        console.log('Items to render:', itemsToRender.length);
        
        const fragment = document.createDocumentFragment();
        
        if (itemsToRender.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-state text-center py-12 col-span-full';
            if (isSearchActive) {
                 emptyMessage.innerHTML = `<p class="text-gray-500">No products found for "<span class="font-semibold">${document.getElementById('product-search').value}</span>"</p>`;
            } else {
                emptyMessage.innerHTML = `
                    <div class="text-gray-500">
                        <i class="fas fa-utensils text-4xl mb-4"></i>
                        <p class="text-lg">No products found in this category</p>
                        <p class="text-sm mt-2">Please try another category</p>
                    </div>
                `;
            }
            fragment.appendChild(emptyMessage);
        } else {
            itemsToRender.forEach((item, index) => {
                const productCard = createProductCard(item, index);
                fragment.appendChild(productCard);
            });
        }

        if (menuGrid) {
            menuGrid.innerHTML = '';
            menuGrid.appendChild(fragment);
        }
        
        attachProductEventListeners();
        updateProductCardControls();
        
        const totalEndTime = performance.now();
        console.log('Total render time:', totalEndTime - startTime, 'ms');
        menuLogger.info(`Total renderProducts execution time: ${totalEndTime - startTime}ms`);
        menuLogger.endSection();
        console.log('===== RENDER PRODUCTS END =====');
    });
};

const createProductCard = (item, index) => {
    const productCard = document.createElement('div');
    productCard.className = 'menu-item product-card-wrapper';
    productCard.dataset.productId = item.id;
    
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
                <div class="separator-line"></div>
                <div class="menu-item-details">
                    <div class="ingredients-section">
                        <p class="ingredients-title">Ingredients:</p>
                        <p class="menu-item-description">${ingredientsText}</p>
                    </div>
                    <div class="separator-line"></div>
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

const attachProductEventListeners = () => {
    document.querySelectorAll('.add-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const productCard = this.closest('.product-card-wrapper');
            const productId = parseInt(productCard.dataset.productId, 10);
            menuLogger.debug('Add button clicked', { productId });
            addToOrder(e, productId);
        });
    });
    
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
export const addToOrder = (e, productId) => {
    const product = window.allMenuItems.find(p => p.id === productId);
    if (!product) {
        orderLogger.error('Product not found when adding to order', { productId });
        return;
    }

    const state = stateManager.getState();
    const existingItem = state.order.find(item => item.id === productId); 
    let isNewItem = false;
    let updatedOrder;
    
    if (existingItem) {
        updatedOrder = state.order.map(item => 
            item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
        orderLogger.debug('Item quantity increased in order', {
            productId,
            productName: product.name,
            newQuantity: existingItem.quantity + 1
        });
    } else {
        updatedOrder = [...state.order, { ...product, quantity: 1, note: '' }];
        isNewItem = true;
        orderLogger.info('New item added to order', {
            productId,
            productName: product.name,
            price: product.price
        });
    }

    stateManager.setState({ order: updatedOrder });
    updateOrderUI(); 
    updateProductCardControls(productId);
    executeFlyingAnimationForProduct(productId);
};

export const changeQuantity = (productId, change) => {
    const state = stateManager.getState();
    const item = state.order.find(i => i.id === productId); 
    if (item) {
        const oldQuantity = item.quantity;
        const newQuantity = item.quantity + change;
        
        if (newQuantity <= 0) {
            removeFromOrder(productId);
        } else {
            const updatedOrder = state.order.map(item => 
                item.id === productId ? { ...item, quantity: newQuantity } : item
            );
            
            orderLogger.debug('Item quantity changed', {
                productId,
                productName: item.name,
                oldQuantity,
                newQuantity,
                change
            });
            
            stateManager.setState({ order: updatedOrder });
            
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

export const removeFromOrder = (productId) => {
    const state = stateManager.getState();
    const item = state.order.find(i => i.id === productId);
    const itemName = item ? item.name : 'Unknown';
    
    const updatedOrder = state.order.filter(item => item.id !== productId);
    
    orderLogger.info('Item removed from order', {
        productId,
        productName: itemName
    });
    
    stateManager.setState({ order: updatedOrder });
    updateOrderUI();
    updateProductCardControls(productId);
};

const executeFlyingAnimationForProduct = (productId) => {
    try {
        const productCard = document.querySelector(`.product-card-wrapper[data-product-id="${productId}"]`);
        
        if (!productCard) {
            return;
        }
        
        const productImg = productCard.querySelector('.product-image');
        
        if (!productImg || !elements.menuOrderBtn) {
            return;
        }
        
        if (elements.menuOrderBtn.classList.contains('hidden')) {
            elements.menuOrderBtn.classList.remove('hidden');
            elements.menuOrderBtn.style.display = 'flex';
            elements.menuOrderBtn.style.visibility = 'visible';
        }
        
        if (elements.menuOrderBtn.offsetWidth === 0 || elements.menuOrderBtn.offsetHeight === 0) {
            elements.menuOrderBtn.style.width = '56px';
            elements.menuOrderBtn.style.height = '56px';
        }
        
        setTimeout(() => {
            const orderIconRect = elements.menuOrderBtn.getBoundingClientRect();
            const productImgRect = productImg.getBoundingClientRect();
            
            if (orderIconRect.width === 0 || orderIconRect.height === 0 || 
                productImgRect.width === 0 || productImgRect.height === 0) {
                return;
            }
            
            executeFlyingAnimation(productImg, orderIconRect, productImgRect, productId);
        }, 100);
    } catch (error) {
        orderLogger.error('Error in flying animation', { error, productId });
    }
};

const executeFlyingAnimation = (productImg, orderIconRect, productImgRect, productId) => {
    const uniqueId = `flying-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const flyingImg = productImg.cloneNode(true);
    flyingImg.id = uniqueId;
    flyingImg.classList.add('flying-image');
    
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
    
    document.body.appendChild(flyingImg);
    
    flyingImg.offsetHeight;
    
    requestAnimationFrame(() => {
        const freshOrderIconRect = elements.menuOrderBtn.getBoundingClientRect();
        const freshProductImgRect = productImg.getBoundingClientRect();
        
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
    
    setTimeout(() => {
        const imgToRemove = document.getElementById(uniqueId);
        
        if (imgToRemove) {
            imgToRemove.remove();
            menuLogger.debug('Flying image removed', { uniqueId });
        }
        
        elements.menuOrderBtn.classList.remove('shake-animation');
        void elements.menuOrderBtn.offsetWidth;
        elements.menuOrderBtn.classList.add('shake-animation');
        
        setTimeout(() => {
            elements.menuOrderBtn.classList.remove('shake-animation');
        }, 500);
    }, 800);
};

export const showPaymentView = () => {
    const state = stateManager.getState();
    orderLogger.info('Showing payment view', {
        orderLength: state.order.length,
        totalAmount: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
    
    stateManager.setState({ currentOrderStep: 'payment' });
    
    elements.orderReviewContainer.classList.add('hidden');
    elements.paymentFormContainer.classList.remove('hidden');
};

export const showOrderReviewView = () => {
    const state = stateManager.getState();
    orderLogger.info('Showing order review view', {
        orderLength: state.order.length,
        totalAmount: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
    
    stateManager.setState({ currentOrderStep: 'review' });

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

export const confirmPayment = () => {
    const state = stateManager.getState();
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
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
    
    stateManager.setState({ 
        order: [],
        currentOrderStep: 'review'
    });
    updateOrderUI(); 
    updateProductCardControls(); 
    closeOrderSidebar();
};

export const updateOrderUI = () => {
    const state = stateManager.getState();
    const totalItems = state.order.reduce((sum, item) => sum + item.quantity, 0);
    elements.menuOrderCount.textContent = totalItems;
    elements.menuOrderCount.classList.toggle('hidden', totalItems === 0);

    const totalPrice = formatPrice(state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0));

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
                            <button onclick="window.changeQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="window.changeQuantity(${item.id}, 1)">+</button>
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