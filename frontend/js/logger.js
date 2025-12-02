// ================================= JAVASCRIPT FILE =================================
// File: js/logger.js
// Description: Comprehensive logging system for the Simoon Cafe application
// Author: [Your Name]
// Last Modified: [Date]
// ============================== END OF FILE HEADER ==============================
import { state } from './config.js';
// ================================= LOG LEVELS =================================
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
};

// Set the current log level (change this to control verbosity)
let currentLogLevel = LOG_LEVELS.DEBUG;

// ================================= LOGGER CLASS =================================
class Logger {
    constructor(prefix = '') {
        this.prefix = prefix;
    }

    // Helper method to check if we should log at this level
    shouldLog(level) {
        return level <= currentLogLevel;
    }

    // Format the log message with timestamp and prefix
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const levelName = Object.keys(LOG_LEVELS)[level];
        let formattedMessage = `[${timestamp}] [${levelName}] ${this.prefix ? `[${this.prefix}] ` : ''}${message}`;
        
        if (data) {
            formattedMessage += '\nData:';
            // اگر داده یک خطا است، پیام و پشته فراخوانی آن را استخراج کن
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

    // Log methods for each level
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
            console.trace(); // Adds stack trace for detailed debugging
        }
    }

    // Specialized logging methods for common operations
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

    // Create a section divider for better log readability
    section(title) {
        console.log(`\n===== ${title} =====`);
    }

    // End a section
    endSection() {
        console.log(`===== END =====\n`);
    }
}

// ================================= SPECIALIZED LOGGERS =================================
// Create specialized loggers for different parts of the application
export const apiLogger = new Logger('API');
export const uiLogger = new Logger('UI');
export const menuLogger = new Logger('MENU');
export const orderLogger = new Logger('ORDER');
export const navLogger = new Logger('NAV');
export const dataLogger = new Logger('DATA');
export const perfLogger = new Logger('PERF');

// ================================= UTILITY FUNCTIONS =================================
// Function to validate menu data
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

// Function to check if images exist
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

// Function to log component states
export function logComponentStates() {
    // Log navigation state
    navLogger.logComponentState('Navigation', {
        currentPage: state.currentPage,
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory
    });
    
    // Log menu state
    menuLogger.logComponentState('Menu', {
        totalItems: window.allMenuItems ? window.allMenuItems.length : 0,
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory
    });
    
    // Log order state
    orderLogger.logComponentState('Order', {
        itemCount: state.order.length,
        totalItems: state.order.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: state.order.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    });
}

// Function to create a performance monitor
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

// Function to log detailed menu state
export function logDetailedMenuState(caller = 'Unknown') {
    navLogger.section(`DETAILED MENU STATE (from: ${caller})`);
    
    // Log state variables
    navLogger.debug('State Variables', {
        currentMainCategory: state.currentMainCategory,
        currentSubCategory: state.currentSubCategory,
        currentPage: state.currentPage
    });
    
    // Log DOM elements
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
    
    // Log menu items
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
    
    navLogger.endSection();
}

// Function to log navigation events
export function logNavigationEvent(from, to, additionalInfo = {}) {
    navLogger.logNavigation(from, to, additionalInfo);
    
    // Log detailed state after navigation
    setTimeout(() => {
        logDetailedMenuState('After Navigation');
    }, 100);
}

// ============================== END OF JAVASCRIPT FILE ==============================