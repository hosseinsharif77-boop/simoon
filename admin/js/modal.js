/**
 * Simoon Cafe Admin Panel - Modal Management
 */
(function(admin) {
    'use strict';

    // Modal Management Class
    admin.ModalManager = function(elementId, options = {}) {
        this.element = document.getElementById(elementId);
        this.modal = null;
        this.options = {
            backdrop: true,
            keyboard: true,
            focus: true,
            ...options
        };
        
        if (!this.element) {
            console.error(`Modal element with ID "${elementId}" not found`);
            return null;
        }
        
        this.init();
    };
    
    admin.ModalManager.prototype.init = function() {
        // Create modal instance if it doesn't exist
        if (!this.modal) {
            this.modal = new bootstrap.Modal(this.element, this.options);
        }
        
        // Store reference to element
        this.modal._element = this.element;
        
        // Store initial values for forms
        if (this.element.querySelector('form')) {
            this.modal._options = this.options;
            this.modal._initialValues = {};
            
            const formElements = this.element.querySelectorAll('input, select, textarea');
            formElements.forEach(el => {
                if (el.type === 'checkbox' || el.type === 'radio') {
                    this.modal._initialValues[el.name] = el.checked;
                } else {
                    this.modal._initialValues[el.name] = el.value;
                }
            });
        }
    };
    
    admin.ModalManager.prototype.show = function() {
        if (!this.modal) {
            this.init();
        }
        
        this.modal.show();
    };
    
    admin.ModalManager.prototype.hide = function() {
        if (this.modal) {
            this.modal.hide();
        }
    };
    
    admin.ModalManager.prototype.dispose = function() {
        if (this.modal) {
            this.modal.dispose();
            this.modal = null;
        }
    };
    
    admin.ModalManager.prototype.reset = function() {
        if (this.element.querySelector('form')) {
            this.element.querySelector('form').reset();
            this._setInitialValues();
        }
    };
    
    admin.ModalManager.prototype._setInitialValues = function() {
        if (this.modal._initialValues) {
            Object.keys(this.modal._initialValues).forEach(key => {
                const element = this.element.querySelector(`[name="${key}"]`);
                if (element) {
                    if (element.type === 'checkbox' || element.type === 'radio') {
                        element.checked = this.modal._initialValues[key];
                    } else {
                        element.value = this.modal._initialValues[key];
                    }
                }
            });
        }
    };

    // Factory function to create modal managers
    admin.createModalManager = function(elementId, options = {}) {
        return new admin.ModalManager(elementId, options);
    };

})(window.SimoonAdmin);