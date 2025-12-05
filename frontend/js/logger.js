// ================================= LOGGING SYSTEM =================================
// File: js/logger.js
// Description: Comprehensive logging system for Simoon Cafe application
// ============================== END OF FILE HEADER ==============================
import { stateManager } from './stateManager.js';

// ================================= LOG LEVELS =================================
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

let currentLogLevel = LOG_LEVELS.DEBUG;

// ================================= LOGGER CLASS =================================
class Logger {
    constructor(prefix = '') {
        this.prefix = prefix;
    }

    shouldLog(level) {
        return level <= currentLogLevel;
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const levelName = Object.keys(LOG_LEVELS)[level];
        let formattedMessage = `[${timestamp}] [${levelName}] ${this.prefix ? `[${this.prefix}] ` : ''}${message}`;
        
        if (data) {
            formattedMessage += '\nData:';
            if (data instanceof Error) {
                formattedMessage += '\n' + JSON.stringify({
                    name: data.name,
                    message: data.message,
                    stack: data.stack
                }, null, 2);
            } else if (typeof data === 'object') {
                formattedMessage += '\n' + JSON.stringify(data, null, 2);
            } else {
                formattedMessage += ' ' + data;
            }
        }
        
        return formattedMessage;
    }

    error(message, data = null) {
        if (this.shouldLog(LOG_LEVELS.ERROR)) {
            console.error(this.formatMessage(LOG_LEVELS.ERROR, message, data));
        }
    }

    warn(message, data = null) {
        if (this.shouldLog(LOG_LEVELS.WARN)) {
            console.warn(this.formatMessage(LOG_LEVELS.WARN, message, data));
        }
    }

    info(message, data = null) {
        if (this.shouldLog(LOG_LEVELS.INFO)) {
            console.info(this.formatMessage(LOG_LEVELS.INFO, message, data));
        }
    }

    debug(message, data = null) {
        if (this.shouldLog(LOG_LEVELS.DEBUG)) {
            console.log(this.formatMessage(LOG_LEVELS.DEBUG, message, data));
        }
    }

    trace(message, data = null) {
        if (this.shouldLog(LOG_LEVELS.TRACE)) {
            console.log(this.formatMessage(LOG_LEVELS.TRACE, message, data));
            console.trace();
        }
    }

    logNavigation(from, to, additionalInfo = {}) {
        this.info(`Navigation: ${from} → ${to}`, additionalInfo);
    }

    logApiCall(method, url, requestData = null, responseData = null, error = null) {
        if (error) {
            this.error(`API Call Failed: ${method} ${url}`, { 
                request: requestData, 
                error: error.message || error,
                stack: error.stack
            });
        } else {
            this.info(`API Call Success: ${method} ${url}`, { 
                request: requestData, 
                response: responseData 
            });
        }
    }

    logComponentState(componentName, state) {
        this.debug(`Component State: ${componentName}`, state);
    }

    logImageLoad(imageUrl, success, error = null) {
        if (success) {
            this.debug(`Image loaded successfully: ${imageUrl}`);
        } else {
            this.error(`Failed to load image: ${imageUrl}`, { error: error ? error.message : 'Unknown error' });
        }
    }

    logDataValidation(dataType, data, isValid, issues = []) {
        if (isValid) {
            this.debug(`Data validation passed: ${dataType}`);
        } else {
            this.warn(`Data validation failed: ${dataType}`, { 
                data: data, 
                issues: issues 
            });
        }
    }

    logMenuUpdate(updateType, oldData, newData) {
        this.info(`Menu update: ${updateType}`, { 
            oldItemCount: oldData ? oldData.length : 0,
            newItemCount: newData ? newData.length : 0,
            changedItems: this.findChangedItems(oldData, newData)
        });
    }

    findChangedItems(oldData, newData) {
        if (!oldData || !newData) return [];
        
        const oldIds = new Set(oldData.map(item => item.id));
        const newIds = new Set(newData.map(item => item.id));
        
        const added = newData.filter(item => !oldIds.has(item.id));
        const removed = oldData.filter(item => !newIds.has(item.id));
        
        const changed = [];
        for (const newItem of newData) {
            const oldItem = oldData.find(item => item.id === newItem.id);
            if (oldItem && JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
                changed.push({
                    id: newItem.id,
                    name: newItem.name,
                    changes: this.getItemChanges(oldItem, newItem)
                });
            }
        }
        
        return { added, removed, changed };
    }

    getItemChanges(oldItem, newItem) {
        const changes = {};
        for (const key in newItem) {
            if (oldItem[key] !== newItem[key]) {
                changes[key] = {
                    old: oldItem[key],
                    new: newItem[key]
                };
            }
        }
        return changes;
    }

    logUserAction(action, details = {}) {
        this.info(`User Action: ${action}`, details);
    }

    logPerformance(operation, startTime, endTime, additionalInfo = {}) {
        const duration = endTime - startTime;
        this.info(`Performance: ${operation} took ${duration}ms`, additionalInfo);
    }

    section(title) {
        console.log(`\n===== ${title} =====`);
    }

    endSection() {
        console.log(`===== END =====\n`);
    }
}

// ================================= SPECIALIZED LOGGERS =================================
export const apiLogger = new Logger('API');
export const uiLogger = new Logger('UI');
export const menuLogger = new Logger('MENU');
export const orderLogger = new Logger('ORDER');
export const navLogger = new Logger('NAV');
export const dataLogger = new Logger('DATA');
export const perfLogger = new Logger('PERF');
export const carouselLogger = new Logger('CAROUSEL');

// ================================= UTILITY FUNCTIONS =================================
export function validateMenuData(data) {
    const issues = [];
    
    if (!Array.isArray(data)) {
        issues.push('Data is not an array');
        return { isValid: false, issues };
    }
    
    data.forEach((item, index) => {
        if (!item.id) issues.push(`Item at index ${index} is missing id`);
        if (!item.name) issues.push(`Item ${item.id || index} is missing name`);
        if (typeof item.price !== 'number') issues.push(`Item ${item.id || index} has invalid price`);
        if (!item.image) issues.push(`Item ${item.id || index} is missing image`);
        if (!item.mainCategory && !item.category) issues.push(`Item ${item.id || index} is missing category`);
    });
    
    return {
        isValid: issues.length === 0,
        issues
    };
}

export function checkImagesExist(data) {
    const promises = data.map(item => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                uiLogger.logImageLoad(item.image, true);
                resolve({ id: item.id, exists: true });
            };
            img.onerror = () => {
                uiLogger.logImageLoad(item.image, false);
                resolve({ id: item.id, exists: false });
            };
            img.src = item.image;
        });
    });
    
    return Promise.all(promises);
}

export function logComponentStates() {
    const state = stateManager.getState();
    
    navLogger.logComponentState('Navigation', {
        currentPage: state.currentPage,
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory
    });
    
    menuLogger.logComponentState('Menu', {
        totalItems: window.allMenuItems ? window.allMenuItems.length : 0,
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory
    });
    
    orderLogger.logComponentState('Order', {
        itemCount: state.order.length,
        totalItems: state.order.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
}

export function createPerformanceMonitor(operationName) {
    const startTime = performance.now();
    
    return {
        end: (additionalInfo = {}) => {
            const endTime = performance.now();
            perfLogger.logPerformance(operationName, startTime, endTime, additionalInfo);
            return endTime - startTime;
        }
    };
}

export function logDetailedMenuState(caller = 'Unknown') {
    const state = stateManager.getState();
    
    navLogger.section(`DETAILED MENU STATE (from: ${caller})`);
    
    navLogger.debug('State Variables', {
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory,
        currentPage: state.currentPage
    });
    
    const activeMainBtn = document.querySelector('.category-btn.active');
    const activeSubBtn = document.querySelector('.subcategory-btn.active');
    const navigationWrapper = document.querySelector('.navigation-wrapper');
    
    navLogger.debug('DOM Elements Status', {
        activeMainCategoryButton: activeMainBtn ? {
            category: activeMainBtn.dataset.mainCategory,
            image: activeMainBtn.dataset.categoryImage
        } : 'Not found',
        activeSubCategoryButton: activeSubBtn ? {
            subcategory: activeSubBtn.dataset.subCategory
        } : 'Not found',
        navigationWrapper: {
            hasMobileImageBg: navigationWrapper ? navigationWrapper.classList.contains('mobile-image-bg') : 'Not found',
            backgroundImage: navigationWrapper ? getComputedStyle(navigationWrapper).getPropertyValue('--category-bg-image') : 'Not found'
        }
    });
    
    if (window.allMenuItems) {
        const filteredItems = window.allMenuItems.filter(item => 
            item.mainCategory === state.currentMainCategory && 
            (!state.currentSubCategory || item.subCategory === state.currentSubCategory)
        );
        
        menuLogger.debug('Menu Items', {
            totalItems: window.allMenuItems.length,
            filteredItems: filteredItems.length,
            currentCategory: state.currentMainCategory,
            currentSubCategory: state.currentSubCategory
        });
    }
    
    const specialsCarouselSection = document.getElementById('specials-carousel-section');
    const specialsCarouselTrack = document.querySelector('.specials-carousel-track');
    const carouselSlides = specialsCarouselTrack ? specialsCarouselTrack.querySelectorAll('.specials-carousel-slide') : [];
    
    carouselLogger.debug('Specials Carousel State', {
        carouselSectionExists: !!specialsCarouselSection,
        carouselTrackExists: !!specialsCarouselTrack,
        isHidden: specialsCarouselSection ? specialsCarouselSection.classList.contains('hidden') : 'N/A',
        slideCount: carouselSlides.length,
        currentSlide: state.currentSpecialsSlide,
        currentCategory: state.currentMainCategory,
        isInitialized: specialsCarouselSection ? specialsCarouselSection.hasAttribute('data-initialized') : false
    });
    
    if (carouselSlides.length > 0) {
        const slideImages = Array.from(carouselSlides).map(slide => {
            const img = slide.querySelector('.special-item-image');
            return {
                slideIndex: Array.from(carouselSlides).indexOf(slide),
                imageSrc: img ? img.src : 'No image element',
                imageExists: img ? (img.complete && img.naturalHeight !== 0) : false,
                imageError: img ? img.hasAttribute('data-error') : false
            };
        });
        
        carouselLogger.debug('Carousel Images State', slideImages);
    }
    
    navLogger.endSection();
}

export function logNavigationEvent(from, to, additionalInfo = {}) {
    navLogger.logNavigation(from, to, additionalInfo);
    
    setTimeout(() => {
        logDetailedMenuState('After Navigation');
    }, 100);
}

export function logCarouselEvent(eventType, additionalInfo = {}) {
    carouselLogger.info(`Carousel Event: ${eventType}`, additionalInfo);
}

export function logImageEvent(imageUrl, eventType, additionalInfo = {}) {
    uiLogger.info(`Image Event: ${eventType}`, {
        imageUrl,
        ...additionalInfo
    });
}
// ============================== END OF JAVASCRIPT FILE ==============================