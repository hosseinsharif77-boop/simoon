// ================================= JAVASCRIPT FILE =================================
// File: js/script.js
// Description: Main JavaScript file for Simoon Cafe website
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================

// ================================= INITIALIZATION =================================
// Wait for the DOM to be fully loaded before executing JavaScript
document.addEventListener('DOMContentLoaded', () => {
// ========================== END OF INITIALIZATION ==========================

    // ================================= STATE MANAGEMENT =================================
    // --- Application State Variables ---
    let order = []; // Array to store items in the current order
    let favorites = []; // Array to store user's favorite items
    let currentMainCategory = 'specials'; // Currently selected main category
    let currentSubCategory = 'american'; // Currently selected subcategory
    let currentPage = 'home'; // Currently active page
    let currentSlide = 0; // Current slide index for carousel
    let currentTableNumber = null; // Table number if ordering from QR code
    let isFromQRCode = false; // Flag to check if user came from QR code

    // --- NEW: State for Specials Carousel ---
    let currentSpecialsSlide = 0; // Current slide index for specials carousel
    let specialsCarouselInterval; // To store the interval for auto-play

    // --- REMOVE: State for scroll navigation is no longer needed ---
    // let isScrollNavigating = false; // Flag to prevent multiple rapid navigations
    // ========================== END OF STATE MANAGEMENT ==========================
    // ================================= MENU DATA =================================
    // --- Menu Items Database ---
    const allMenuItems = [
        // ... (آیتم‌های منوی شما بدون تغییر)
        // Pizza Category
        { id: 1, name: 'Pepperoni Classic', price: 2.29, mainCategory: 'pizza', subCategory: 'american', image: 'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=600', available: 15 },
        { id: 2, name: 'BBQ Chicken', price: 2.59, mainCategory: 'pizza', subCategory: 'american', image: 'https://images.pexels.com/photos/2619967/pexels-photo-2619967.jpeg?auto=compress&cs=tinysrgb&w=600', available: 12 },
        { id: 3, name: 'Margherita', price: 2.19, mainCategory: 'pizza', subCategory: 'italian', image: 'https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=600', available: 20 },
        { id: 4, name: 'Quattro Stagioni', price: 2.79, mainCategory: 'pizza', subCategory: 'italian', image: 'https://images.pexels.com/photos/825662/pexels-photo-825662.jpeg?auto=compress&cs=tinysrgb&w=600', available: 8 },
        { id: 5, name: 'Vegetarian', price: 2.49, mainCategory: 'pizza', subCategory: 'italian', image: 'https://images.pexels.com/photos/2147491/pexels-photo-2147491.jpeg?auto=compress&cs=tinysrgb&w=600', available: 10 },
        
        // Sandwich Category
        { id: 6, name: 'Classic Beef Burger', price: 3.99, mainCategory: 'sandwich', subCategory: 'burger', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', available: 10 },
        { id: 7, name: 'Cheese Burger', price: 3.49, mainCategory: 'sandwich', subCategory: 'burger', image: 'https://images.pexels.com/photos/1251198/pexels-photo-1251198.jpeg?auto=compress&cs=tinysrgb&w=600', available: 12 },
        { id: 8, name: 'Hot Dog', price: 2.99, mainCategory: 'sandwich', subCategory: 'hot-dog', image: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=600', available: 15 },
        { id: 9, name: 'Chicken Sandwich', price: 3.19, mainCategory: 'sandwich', subCategory: 'chicken', image: 'https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg?auto=compress&cs=tinysrgb&w=600', available: 12 },
        { id: 10, name: 'Club Sandwich', price: 3.79, mainCategory: 'sandwich', subCategory: 'chicken', image: 'https://images.pexels.com/photos/1059907/pexels-photo-1059907.jpeg?auto=compress&cs=tinysrgb&w=600', available: 9 },
        
        // Fried Chicken Category
        { id: 11, name: 'Crispy Strips', price: 2.49, mainCategory: 'fried-chicken', subCategory: 'strips', image: 'https://images.pexels.com/photos/2983099/pexels-photo-2983099.jpeg?auto=compress&cs=tinysrgb&w=600', available: 20 },
        { id: 12, name: 'Hot Wings', price: 2.79, mainCategory: 'fried-chicken', subCategory: 'wings', image: 'https://images.pexels.com/photos/1565982/pexels-photo-1565982.jpeg?auto=compress&cs=tinysrgb&w=600', available: 25 },
        { id: 13, name: 'Popcorn Chicken', price: 2.29, mainCategory: 'fried-chicken', subCategory: 'popcorn', image: 'https://images.pexels.com/photos/5946081/pexels-photo-5946081.jpeg?auto=compress&cs=tinysrgb&w=600', available: 18 },
        { id: 14, name: 'BBQ Ribs', price: 4.99, mainCategory: 'fried-chicken', subCategory: 'ribs', image: 'https://images.pexels.com/photos/1109198/pexels-photo-1109198.jpeg?auto=compress&cs=tinysrgb&w=600', available: 7 },
        { id: 15, name: 'Family Bucket', price: 8.99, mainCategory: 'fried-chicken', subCategory: 'bucket', image: 'https://images.pexels.com/photos/2619966/pexels-photo-2619966.jpeg?auto=compress&cs=tinysrgb&w=600', available: 5 },
        
        // Pasta Category
        { id: 16, name: 'Spaghetti Bolognese', price: 3.49, mainCategory: 'pasta', subCategory: 'italian', image: 'https://images.pexels.com/photos/1487511/pexels-photo-1487511.jpeg?auto=compress&cs=tinysrgb&w=600', available: 14 },
        { id: 17, name: 'Alfredo Fettuccine', price: 3.79, mainCategory: 'pasta', subCategory: 'italian', image: 'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600', available: 11 },
        { id: 18, name: 'Pesto Pasta', price: 3.99, mainCategory: 'pasta', subCategory: 'italian', image: 'https://images.pexels.com/photos/1581388/pexels-photo-1581388.jpeg?auto=compress&cs=tinysrgb&w=600', available: 9 },
        { id: 19, name: 'Spicy Arrabbiata', price: 3.29, mainCategory: 'pasta', subCategory: 'italian', image: 'https://images.pexels.com/photos/1438692/pexels-photo-1438692.jpeg?auto=compress&cs=tinysrgb&w=600', available: 13 },
        { id: 20, name: 'Seafood Pasta', price: 4.99, mainCategory: 'pasta', subCategory: 'seafood', image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600', available: 6 },
        
        // Breakfast Category
        { id: 21, name: 'Pancakes & Syrup', price: 2.99, mainCategory: 'breakfast', subCategory: 'sweet', image: 'https://images.pexels.com/photos/3738730/pexels-photo-3738730.jpeg?auto=compress&cs=tinysrgb&w=600', available: 10 },
        { id: 22, name: 'French Toast', price: 2.79, mainCategory: 'breakfast', subCategory: 'sweet', image: 'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600', available: 8 },
        { id: 23, name: 'Omelette', price: 2.49, mainCategory: 'breakfast', subCategory: 'savory', image: 'https://images.pexels.com/photos/708567/pexels-photo-708567.jpeg?auto=compress&cs=tinysrgb&w=600', available: 15 },
        { id: 24, name: 'Scrambled Eggs', price: 2.29, mainCategory: 'breakfast', subCategory: 'savory', image: 'https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg?auto=compress&cs=tinysrgb&w=600', available: 12 },
        { id: 25, name: 'Breakfast Burrito', price: 3.49, mainCategory: 'breakfast', subCategory: 'savory', image: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg?auto=compress&cs=tinysrgb&w=600', available: 9 },
        
        // Kids Menu Category
        { id: 26, name: 'Mini Burger', price: 2.99, mainCategory: 'kids-menu', subCategory: 'main', image: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=600', available: 10 },
        { id: 27, name: 'Chicken Nuggets', price: 2.49, mainCategory: 'kids-menu', subCategory: 'main', image: 'https://images.pexels.com/photos/5946081/pexels-photo-5946081.jpeg?auto=compress&cs=tinysrgb&w=600', available: 15 },
        { id: 28, name: 'Mac & Cheese', price: 2.79, mainCategory: 'kids-menu', subCategory: 'main', image: 'https://images.pexels.com/photos/13814644/pexels-photo-13814644.jpeg?auto=compress&cs=tinysrgb&w=600', available: 12 },
        { id: 29, name: 'Fruit Juice', price: 1.49, mainCategory: 'kids-menu', subCategory: 'drink', image: 'https://images.pexels.com/photos/4065145/pexels-photo-4065145.jpeg?auto=compress&cs=tinysrgb&w=600', available: 20 },
        { id: 30, name: 'Ice Cream', price: 1.99, mainCategory: 'kids-menu', subCategory: 'dessert', image: 'https://images.pexels.com/photos/1352278/pexels-photo-1352278.jpeg?auto=compress&cs=tinysrgb&w=600', available: 18 },
        
        // Specials Category
        { id: 31, name: "Chef's Steak", price: 9.99, mainCategory: 'specials', subCategory: 'main', image: 'https://images.pexels.com/photos/1351239/pexels-photo-1351239.jpeg?auto=compress&cs=tinysrgb&w=600', available: 4 },
        { id: 32, name: 'Grilled Salmon', price: 8.49, mainCategory: 'specials', subCategory: 'main', image: 'https://images.pexels.com/photos/2294475/pexels-photo-2294475.jpeg?auto=compress&cs=tinysrgb&w=600', available: 6 },
        { id: 33, name: 'Lobster Roll', price: 12.99, mainCategory: 'specials', subCategory: 'main', image: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=600', available: 3 },
        { id: 34, name: 'Chocolate Lava Cake', price: 3.99, mainCategory: 'specials', subCategory: 'dessert', image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=600', available: 8 },
        { id: 35, name: 'Tiramisu', price: 3.49, mainCategory: 'specials', subCategory: 'dessert', image: 'https://images.pexels.com/photos/1021876/pexels-photo-1021876.jpeg?auto=compress&cs=tinysrgb&w=600', available: 10 },
    
        // NEW: Drinks Category
        { id: 36, name: 'Fresh Orange Juice', price: 1.99, mainCategory: 'drinks', subCategory: 'juice', image: 'https://images.pexels.com/photos/67468/orange-juice-splash-pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600', available: 30 },
        { id: 37, name: 'Iced Latte', price: 2.49, mainCategory: 'drinks', subCategory: 'coffee', image: 'https://images.pexels.com/photos/982612/pexels-photo-982612.jpeg?auto=compress&cs=tinysrgb&w=600', available: 25 },
        { id: 38, name: 'Mojito', price: 3.99, mainCategory: 'drinks', subCategory: 'cocktail', image: 'https://images.pexels.com/photos/1653559/pexels-photo-1653559.jpeg?auto=compress&cs=tinysrgb&w=600', available: 15 },
    ];

    // --- Category Data ---
    const categoryData = {
        specials: { 
            description: "Experience the extraordinary with our chef's exclusive specials—masterfully crafted dishes bursting with premium ingredients and bold, unforgettable flavors. Perfect for those craving a culinary adventure unlike any other."
        },
        pizza: { 
            description: "fresh"
        },
        sandwich: { 
            description: "Dive into our gourmet sandwiches, where artisan breads meet vibrant, fresh fillings—juicy meats, crisp veggies, and signature sauces—all layered to create the perfect bite that's both satisfying and unforgettable."
        },
        'fried-chicken': { 
            description: "Indulge in our golden, crispy fried chicken—seasoned with a secret blend of spices and cooked to juicy perfection. Every crunchy bite delivers comfort, flavor, and pure satisfaction that keeps you coming back for more."
        },
        pasta: { 
            description: "Treat yourself to our authentic pasta creations, crafted with fresh ingredients and timeless Italian recipes. From velvety sauces to perfectly al dente noodles, each dish is a celebration of rich, irresistible flavors."
        },
        breakfast: { 
            description: "Kickstart your day with our vibrant breakfast selection—fluffy pancakes, farm-fresh eggs, crispy bacon, and wholesome sides—all designed to energize your morning with deliciousness and warmth."
        },
        'kids-menu': { 
            description: "Delight your little ones with our fun and flavorful kids' menu—nutritious, colorful, and crafted to spark joy with every bite. Perfectly balanced meals that kids love and parents trust."
        },
        drinks: { 
            description: "Refresh and rejuvenate with our curated selection of drinks—from freshly squeezed juices and creamy smoothies to handcrafted cocktails. The perfect sip to complement any meal or moment."
        }
    };

    // --- NEW: Specials Album Data ---
    const specialsAlbumData = [
        {
            imageUrl: '1764022176699-019ab7e9-d8ee-7291-a84f-60cc45c957ac.png',
            title: 'Simoon Special Burger',
            description: 'Two juicy patties, melted cheese, and all the flavor you crave!'
        },
        {
            imageUrl: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: 'Chocolate Lava Cake',
            description: 'Decadent chocolate cake with a warm, gooey center.'
        },
        {
            imageUrl: 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: 'Lobster Roll',
            description: 'Tender lobster meat served in a toasted brioche bun.'
        },
        {
            imageUrl: 'https://images.pexels.com/photos/1059907/pexels-photo-1059907.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            title: 'Fresh Ingredients',
            description: 'We use only the finest and freshest ingredients in our kitchen.'
        }
    ];
    // ========================== END OF MENU DATA ==========================

    // ================================= DOM ELEMENTS =================================
    // --- Cached DOM Elements ---
    const headerContainer = document.getElementById('header-container');
    const menuNav = document.getElementById('menu-nav');
    const menuGrid = document.getElementById('menu-grid');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const subcategoryNav = document.getElementById('subcategory-nav');
    const menuOrderBtn = document.getElementById('menu-order-btn');
    const menuOrderCount = document.getElementById('menu-order-count');
    const orderSidebar = document.getElementById('order-sidebar');
    const orderOverlay = document.getElementById('order-overlay');
    const closeOrderBtn = document.getElementById('close-order-btn');
    const orderItemsContainer = document.getElementById('order-items');
    const orderTotal = document.getElementById('order-total');
    const tableNumberInput = document.getElementById('table-number');
    const tableInfoContainer = document.getElementById('table-info-container');
    const deliveryAddressContainer = document.getElementById('delivery-address-container');
    const deliveryAddressInput = document.getElementById('delivery-address');
    const hamburgerMenuBtn = document.getElementById('hamburger-menu-btn');
    const userPanelSidebar = document.getElementById('user-panel-sidebar');
    const userPanelOverlay = document.getElementById('user-panel-overlay');
    const closeUserPanelBtn = document.getElementById('close-user-panel-btn');
    const favoritesContainer = document.getElementById('favorites-container');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileBottomNavItems = document.querySelectorAll('.mobile-bottom-nav-item');
    const pageSections = document.querySelectorAll('.page-section');
    const carouselTrack = document.getElementById('restaurant-carousel');
    const carouselPrev = document.getElementById('carousel-prev');
    const carouselNext = document.getElementById('carousel-next');
    const orderTypeRadios = document.querySelectorAll('input[name="order-type"]');
    const categoryTitle = document.getElementById('category-title');
    const categoryImageContainer = document.querySelector('.category-image-container');
    const categoryDescription = document.getElementById('category-description');
    const categoryDisplayWrapper = document.getElementById('category-display-wrapper');
    // ========================== END OF DOM ELEMENTS ==========================
        
    // ================================= HELPER FUNCTIONS =================================
    const formatPrice = (price) => `$${price.toFixed(2)}`;

    // --- NEW: Function to fix sticky navigation top position ---
    const updateStickyNavPosition = () => {
        const header = document.getElementById('header-container');
        const navigationWrapper = document.querySelector('.navigation-wrapper');
        const mainElement = document.querySelector('main');

        if (header && navigationWrapper && mainElement) {
            const headerHeight = header.offsetHeight;
            navigationWrapper.style.top = `${headerHeight}px`;
            mainElement.style.paddingTop = `${headerHeight}px`;
        }
    };

    // --- REMOVE: The entire handleScrollForNavigation function is no longer needed ---
    /*
    const handleScrollForNavigation = () => {
        // ... (کدهای قبلی)
    };
    */

    // --- REMOVE: The manageScrollToNextIcon function is also no longer needed ---
    /*
    const manageScrollToNextIcon = () => {
        // ... (کدهای قبلی)
    };
    */

    // --- REMOVE: The goToNextMainCategory function is no longer needed ---
    /*
    const goToNextMainCategory = () => {
        // ... (کدهای قبلی)
    };
    */

    const setSpecialsCarouselHeight = () => {
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

    const startCategorySmoke = () => {
        if (currentMainCategory === 'specials') return;
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

    const updateSpecialsCarousel = (targetIndex = null) => {
        const slides = document.querySelectorAll('.specials-carousel-track .category-carousel-slide');
        const indicators = document.querySelectorAll('.indicator');
        if (slides.length === 0) return;
        currentSpecialsSlide = targetIndex !== null ? targetIndex : (currentSpecialsSlide + 1) % slides.length;
        slides.forEach((slide, index) => slide.classList.toggle('active', index === currentSpecialsSlide));
        indicators.forEach((dot, index) => dot.classList.toggle('active', index === currentSpecialsSlide));
        resetSpecialsCarouselInterval();
    };

    const initSpecialsCarousel = () => {
        document.querySelectorAll('.indicator').forEach(dot => {
            dot.addEventListener('click', () => updateSpecialsCarousel(parseInt(dot.dataset.slideTo, 10)));
        });
        startSpecialsCarouselInterval();
    };
    
    const startSpecialsCarouselInterval = () => {
        clearInterval(specialsCarouselInterval);
        specialsCarouselInterval = setInterval(() => updateSpecialsCarousel(), 4000);
    };

    const resetSpecialsCarouselInterval = () => {
        clearInterval(specialsCarouselInterval);
        startSpecialsCarouselInterval();
    };
    // ========================== END OF HELPER FUNCTIONS ==========================

    // ================================= UI UPDATE FUNCTIONS =================================
    // --- Function to update navigation wrapper ---
    const updateNavigationWrapper = () => {
        const navigationWrapper = document.querySelector('.navigation-wrapper');
        const categoryDisplaySection = document.querySelector('.category-display-section');
        const activeCategoryBtn = document.querySelector('.category-btn.active');
        
        if (!activeCategoryBtn) return;

        const category = activeCategoryBtn.dataset.mainCategory;
        const imageUrl = activeCategoryBtn.dataset.categoryImage;
        const isMobile = window.innerWidth <= 768;

        navigationWrapper.classList.remove('mobile-image-bg');
        categoryDisplaySection.classList.remove('hide-category-display');

        if (isMobile && category !== 'specials') {
            if (imageUrl) {
                navigationWrapper.style.setProperty('--category-bg-image', `url('../${imageUrl}')`);
                navigationWrapper.classList.add('mobile-image-bg');
            }
            categoryDisplaySection.classList.add('hide-category-display');
        }
    };

    const updateCategoryDisplay = () => {
        const mainCategoryName = currentMainCategory.charAt(0).toUpperCase() + currentMainCategory.slice(1).replace('-', ' ');
        const subCategoryName = currentSubCategory.charAt(0).toUpperCase() + currentSubCategory.slice(1).replace('-', ' ');
        
        if (currentMainCategory === 'specials') {
            if (window.categorySmokeInterval) clearInterval(window.categorySmokeInterval);
            categoryDisplayWrapper.className = 'specials-layout';
            currentSpecialsSlide = 0;
            let slidesHtml = specialsAlbumData.map((item, index) => `
                <div class="category-carousel-slide ${index === 0 ? 'active' : ''}" style="background-image: url('${item.imageUrl}');">
                    <div class="carousel-slide-info"><h3>${item.title}</h3><p>${item.description}</p></div>
                </div>
            `).join('');
            let indicatorsHtml = specialsAlbumData.map((_, index) => `
                <button class="indicator ${index === 0 ? 'active' : ''}" data-slide-to="${index}"><span class="indicator-timer"></span></button>
            `).join('');
            categoryDisplayWrapper.innerHTML = `
                <div class="category-info"><h2 class="category-title">${mainCategoryName}</h2><p id="category-description" class="category-description">${categoryData[currentMainCategory].description}</p></div>
                <div class="category-image-container specials-carousel-container"><div class="specials-carousel-track">${slidesHtml}</div><div class="carousel-indicators">${indicatorsHtml}</div></div>
            `;
            setTimeout(initSpecialsCarousel, 100);
        } else {
            categoryDisplayWrapper.className = 'default-category-layout';
            const activeCategoryBtn = document.querySelector(`.category-btn[data-main-category="${currentMainCategory}"]`);
            const imageUrl = activeCategoryBtn.getAttribute('data-category-image');
            categoryDisplayWrapper.innerHTML = `
                <h2 class="category-title">${mainCategoryName}</h2>
                <div class="category-image-container">
                <img id="category-image" src="${imageUrl}" alt="${mainCategoryName}" class="category-image">
                <div class="category-info-overlay"><p id="category-description" class="category-description">${categoryData[currentMainCategory].description}</p></div>
                <div id="category-smoke-container" class="smoke-container"></div>
                </div>
                <div class="category-info">
                    <h3 class="subcategory-title">${subCategoryName}</h3>
                </div>
            `;
            startCategorySmoke();
        }
    };

    const renderProducts = () => {
        const itemsToRender = allMenuItems.filter(item => item.mainCategory === currentMainCategory && item.subCategory === currentSubCategory);
        const menuGrid = document.getElementById('menu-grid');
        const promptTextContainer = document.getElementById('category-prompt-text');

        menuGrid.innerHTML = itemsToRender.length === 0 ? `<p class="col-span-full text-center text-gray-500 text-lg">No items found in this category.</p>` : '';
        
        // --- NEW: Add prompt text for Specials ---
        if (currentMainCategory === 'specials' && itemsToRender.length > 0) {
            promptTextContainer.innerHTML = `<p class="text-lg text-amber-400 font-medium">Choose your specials & add to cart</p>`;
        } else {
            promptTextContainer.innerHTML = ''; // برای بقیه دسته‌ها، متن را پاک کن
        }

        itemsToRender.forEach(item => {
            const isFavorite = favorites.some(fav => fav.id === item.id);
            const productCard = document.createElement('article');
            productCard.className = 'product-card-wrapper';
            productCard.dataset.productId = item.id;
            productCard.innerHTML = `
                <div class="product-image-container"><img src="${item.image}" alt="${item.name}" class="product-image"></div>
                <div class="product-card">
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-fav-id="${item.id}"><i class="fas fa-heart"></i></button>
                    <div class="card-content">
                        <div>
                            <h3 class="text-sm font-bold mb-1">${item.name}</h3>
                            <p class="text-lg font-semibold text-amber-500 mb-1">${formatPrice(item.price)}</p>
                            <p class="text-xs text-gray-400 mb-3">${item.available} available</p>
                        </div>
                        <div class="add-to-order-controls flex items-center justify-center gap-2" data-product-id="${item.id}">
                            <button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors"><i class="fas fa-plus text-sm"></i></button>
                        </div>
                    </div>
                </div>
            `;
            menuGrid.appendChild(productCard);
        });

        // --- REMOVE: The call to manageScrollToNextIcon is no longer needed ---
        // manageScrollToNextIcon();
    };

    const updateSubCategoryNav = () => {
        const subcategories = [...new Set(allMenuItems.filter(item => item.mainCategory === currentMainCategory).map(item => item.subCategory))];
        const navContainer = subcategoryNav.querySelector('nav');
        navContainer.innerHTML = '';
        subcategories.forEach(sub => {
            const btn = document.createElement('button');
            btn.className = 'subcategory-btn';
            btn.dataset.subCategory = sub;
            btn.textContent = sub.charAt(0).toUpperCase() + sub.slice(1).replace('-', ' ');
            navContainer.appendChild(btn);
        });
        subcategoryNav.classList.remove('hidden');
        if (!currentSubCategory || !subcategories.includes(currentSubCategory)) currentSubCategory = subcategories[0];
        navContainer.querySelector(`[data-sub-category="${currentSubCategory}"]`).classList.add('active');
        updateCategoryDisplay();
    };

    const updateOrderUI = () => {
        const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
        menuOrderCount.textContent = totalItems;
        menuOrderCount.classList.toggle('hidden', totalItems === 0);
        orderItemsContainer.innerHTML = order.length === 0 ? `<p class="text-center text-gray-500 mt-10">You haven't ordered anything yet.</p>` : order.map(item => `
            <div class="flex items-center justify-between mb-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div class="flex items-center gap-3">
                    <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-full">
                    <div><h4 class="font-semibold">${item.name}</h4><p class="text-sm text-gray-400">${formatPrice(item.price)}</p></div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="changeQuantity(${item.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600"><i class="fas fa-minus text-xs"></i></button>
                    <span class="w-8 text-center font-semibold">${item.quantity}</span>
                    <button onclick="changeQuantity(${item.id}, 1)" class="w-7 h-7 bg-amber-600 rounded-full text-white hover:bg-amber-700"><i class="fas fa-plus text-xs"></i></button>
                    <button onclick="removeFromOrder(${item.id})" class="mr-2 text-red-500 hover:text-red-400"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        orderTotal.textContent = formatPrice(order.reduce((sum, item) => sum + (item.price * item.quantity), 0));
    };
    
    const updateFavoritesUI = () => {
        favoritesContainer.innerHTML = favorites.length === 0 ? `<p class="col-span-2 text-center text-gray-500 text-sm">No favorites yet.</p>` : favorites.map(item => `
            <div class="bg-gray-800 p-2 rounded-lg border border-gray-700 text-center">
                <img src="${item.image}" alt="${item.name}" class="w-full h-20 object-cover rounded-md mb-1">
                <h5 class="text-xs font-semibold truncate">${item.name}</h5>
            </div>
        `).join('');
    };

    const showPage = (pageId) => {
        const body = document.body;
        body.classList.toggle('menu-page-active', pageId === 'menu');
        pageSections.forEach(section => section.classList.toggle('active', section.id === `${pageId}-page`));
        navLinks.forEach(link => link.classList.toggle('active', link.dataset.page === pageId));
        mobileBottomNavItems.forEach(item => item.classList.toggle('active', item.dataset.page === pageId));
        currentPage = pageId;
        menuOrderBtn.classList.toggle('hidden', pageId !== 'menu');
        if (pageId === 'menu') {
            updateSubCategoryNav();
            updateCategoryDisplay();
            renderProducts();
            categoryBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.mainCategory === currentMainCategory));
        }
        closeUserPanel();
    };

    const updateOrderTypeUI = () => {
        const selectedOrderType = document.querySelector('input[name="order-type"]:checked').value;
        tableInfoContainer.classList.toggle('hidden', selectedOrderType !== 'dine-in');
        deliveryAddressContainer.classList.toggle('hidden', selectedOrderType !== 'delivery');
        if (selectedOrderType === 'dine-in') {
            if (isFromQRCode && currentTableNumber) {
                tableNumberInput.value = currentTableNumber;
                tableNumberInput.readOnly = true;
            } else {
                tableNumberInput.value = '';
                tableNumberInput.readOnly = false;
            }
        }
    };

    const updateCarousel = () => {
        const slideWidth = 100 / carouselTrack.children.length;
        carouselTrack.style.transform = `translateX(-${currentSlide * slideWidth}%)`;
    };

    const nextSlide = () => {
        currentSlide = (currentSlide + 1) % carouselTrack.children.length;
        updateCarousel();
    };

    const prevSlide = () => {
        currentSlide = (currentSlide - 1 + carouselTrack.children.length) % carouselTrack.children.length;
        updateCarousel();
    };

    const updateProductCardControls = (productId) => {
        const controls = productId ? document.querySelector(`.add-to-order-controls[data-product-id="${productId}"]`) : null;
        const item = productId ? order.find(i => i.id === productId) : null;
        if (controls) {
            controls.innerHTML = item ? `<button onclick="changeQuantity(${item.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600"><i class="fas fa-minus text-xs"></i></button><span class="w-8 text-center font-semibold">${item.quantity}</span><button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-7 h-7 rounded-full transition-colors"><i class="fas fa-plus text-xs"></i></button>` : `<button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors"><i class="fas fa-plus text-sm"></i></button>`;
        } else {
            document.querySelectorAll('.add-to-order-controls').forEach(control => {
                const id = parseInt(control.dataset.productId, 10);
                const itemInOrder = order.find(i => i.id === id);
                control.innerHTML = itemInOrder ? `<button onclick="changeQuantity(${itemInOrder.id}, -1)" class="w-7 h-7 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600"><i class="fas fa-minus text-xs"></i></button><span class="w-8 text-center font-semibold">${itemInOrder.quantity}</span><button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-7 h-7 rounded-full transition-colors"><i class="fas fa-plus text-xs"></i></button>` : `<button class="add-btn bg-amber-600 hover:bg-amber-700 text-white w-8 h-8 rounded-full transition-colors"><i class="fas fa-plus text-sm"></i></button>`;
            });
        }
    };
    // ========================== END OF UI UPDATE FUNCTIONS ==========================

    // ================================= EVENT HANDLERS =================================
    window.changeQuantity = (productId, change) => {
        const item = order.find(i => i.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) removeFromOrder(productId);
            else { updateOrderUI(); updateProductCardControls(productId); }
        }
    };

    window.removeFromOrder = (productId) => {
        order = order.filter(item => item.id !== productId);
        updateOrderUI();
        updateProductCardControls(productId);
    };

    window.submitOrder = () => {
        const selectedOrderType = document.querySelector('input[name="order-type"]:checked').value;
        let orderDetails = '';
        if (selectedOrderType === 'dine-in') {
            const tableNumber = tableNumberInput.value;
            if (!tableNumber) { alert('Please enter a table number.'); return; }
            orderDetails = `Order submitted for table ${tableNumber}!`;
        } else if (selectedOrderType === 'delivery') {
            const deliveryAddress = deliveryAddressInput.value;
            if (!deliveryAddress) { alert('Please enter a delivery address.'); return; }
            orderDetails = `Order submitted for delivery to: ${deliveryAddress}`;
        } else if (selectedOrderType === 'pickup') {
            orderDetails = 'Order submitted for pickup';
        }
        if (order.length === 0) { alert('Your order is empty.'); return; }
        alert(`${orderDetails}\n\nTotal: ${orderTotal.textContent}`);
        order = []; 
        updateOrderUI(); 
        updateProductCardControls(); 
        closeOrderSidebar();
    };

    const addToOrder = (e, productId) => {
        const product = allMenuItems.find(p => p.id === productId);
        if (!product) return;
        const existingItem = order.find(item => item.id === productId);
        if (existingItem) existingItem.quantity++;
        else order.push({ ...product, quantity: 1 });
        
        const productCard = e.target.closest('.product-card-wrapper');
        const productImg = productCard.querySelector('.product-image');
        const orderIconRect = menuOrderBtn.getBoundingClientRect();
        const productImgRect = productImg.getBoundingClientRect();
        
        // Create flying image
        const flyingImg = productImg.cloneNode(true);
        flyingImg.classList.add('flying-image');
        
        // Set initial position and size
        flyingImg.style.position = 'fixed';
        flyingImg.style.top = `${productImgRect.top}px`;
        flyingImg.style.left = `${productImgRect.left}px`;
        flyingImg.style.width = `${productImgRect.width}px`;
        flyingImg.style.height = `${productImgRect.height}px`;
        flyingImg.style.zIndex = '9999';
        flyingImg.style.pointerEvents = 'none';
        flyingImg.style.borderRadius = '50%';
        
        document.body.appendChild(flyingImg);
        
        // Animate to cart
        setTimeout(() => {
            const finalX = orderIconRect.left + (orderIconRect.width / 2) - (productImgRect.width / 2);
            const finalY = orderIconRect.top + (orderIconRect.height / 2) - (productImgRect.height / 2);
            
            flyingImg.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            flyingImg.style.transform = `translate(${finalX - productImgRect.left}px, ${finalY - productImgRect.top}px) scale(0.2) rotate(15deg)`;
            flyingImg.style.opacity = '0.5';
        }, 10);
        
        // Remove flying image and shake cart button
        setTimeout(() => { 
            flyingImg.remove(); 
            menuOrderBtn.classList.add('shake-animation'); 
            setTimeout(() => menuOrderBtn.classList.remove('shake-animation'), 500); 
        }, 800);
        
        updateOrderUI(); 
        updateProductCardControls(productId);
    };
    
    const toggleFavorite = (productId) => {
        const product = allMenuItems.find(p => p.id === productId);
        if (!product) return;
        const index = favorites.findIndex(fav => fav.id === productId);
        if (index > -1) favorites.splice(index, 1);
        else favorites.push(product);
        updateFavoritesUI(); renderProducts();
    };

    const closeUserPanel = () => { 
        userPanelOverlay.classList.remove('opacity-100');
        userPanelOverlay.classList.add('opacity-0');
        setTimeout(() => { 
            userPanelSidebar.classList.remove('open'); 
            userPanelOverlay.classList.add('hidden'); 
        }, 300); 
    };

    const closeOrderSidebar = () => { 
        orderOverlay.classList.remove('opacity-100');
        orderOverlay.classList.add('opacity-0');
        setTimeout(() => { 
            orderSidebar.classList.remove('open'); 
            orderOverlay.classList.add('hidden'); 
        }, 300); 
    };
    // ========================== END OF EVENT HANDLERS ==========================
    
    // ================================= EVENT LISTENERS =================================
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMainCategory = btn.dataset.mainCategory;
            currentSubCategory = '';
            
            updateNavigationWrapper();
            updateSubCategoryNav();
            renderProducts();
            updateCategoryDisplay();
        });
    });

    subcategoryNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('subcategory-btn')) {
            subcategoryNav.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentSubCategory = e.target.dataset.subCategory;
            renderProducts();
            updateCategoryDisplay();
        }
    });

    orderTypeRadios.forEach(radio => radio.addEventListener('change', updateOrderTypeUI));

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

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.dataset.page);
        });
    });

    mobileBottomNavItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(item.dataset.page);
        });
    });

    const userPanelNavLinks = userPanelSidebar.querySelectorAll('a[data-page]');
    userPanelNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showPage(link.getAttribute('data-page'));
        });
    });

    carouselPrev.addEventListener('click', prevSlide);
    carouselNext.addEventListener('click', nextSlide);
    hamburgerMenuBtn.addEventListener('click', () => { 
        userPanelSidebar.classList.add('open'); 
        userPanelOverlay.classList.remove('hidden'); 
        setTimeout(() => {
            userPanelOverlay.classList.remove('opacity-0');
            userPanelOverlay.classList.add('opacity-100');
        }, 10); 
    });
    closeUserPanelBtn.addEventListener('click', closeUserPanel); 
    userPanelOverlay.addEventListener('click', closeUserPanel);
    menuOrderBtn.addEventListener('click', () => { 
        orderSidebar.classList.add('open'); 
        orderOverlay.classList.remove('hidden'); 
        setTimeout(() => {
            orderOverlay.classList.remove('opacity-0');
            orderOverlay.classList.add('opacity-100');
        }, 10); 
    });
    closeOrderBtn.addEventListener('click', closeOrderSidebar); 
    orderOverlay.addEventListener('click', closeOrderSidebar);

    // --- Event listener for window resize ---
    window.addEventListener('resize', () => {
        updateStickyNavPosition();
        updateNavigationWrapper();
    });

    // --- REMOVE: The window scroll event listener that triggers navigation is no longer needed ---
    /*
    window.addEventListener('scroll', () => {
        const menuGrid = document.getElementById('menu-grid');
        const allProductCards = menuGrid.querySelectorAll('.product-card-wrapper');
        const lastProductCard = allProductCards[allProductCards.length - 1];
        
        if (!lastProductCard) return;
        
        const rect = lastProductCard.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        
        if (isVisible) {
            // اگر کاربر به انتهای لیست محصولات رسیده باشد، به تب بعدی برو
            goToNextMainCategory();
        }
    });

    window.addEventListener('scroll', handleScrollForNavigation, { passive: true });
    */

    // ========================== END OF EVENT LISTENERS ==========================
    
    // ================================= INITIALIZATION =================================
    // --- QR Code Detection ---
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromUrl = urlParams.get('table');
    if (tableFromUrl) {
        currentTableNumber = tableFromUrl;
        isFromQRCode = true;
        setTimeout(() => showPage('menu'), 100);
    }

    // --- Use ResizeObserver for accurate and responsive positioning ---
    const header = document.getElementById('header-container');
    if (header) {
        const resizeObserver = new ResizeObserver(() => {
            updateStickyNavPosition();
        });
        resizeObserver.observe(header);
    }

    // --- Application Initialization ---
    setInterval(nextSlide, 5000);
    showPage('home');
    updateOrderTypeUI();
    setTimeout(updateStickyNavPosition, 100); // Initial call with a delay
    // ========================== END OF INITIALIZATION ==========================
}); // End of DOMContentLoaded event listener
// ============================== END OF JAVASCRIPT FILE ==============================