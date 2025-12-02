/**
 * Simoon Cafe Admin Panel - Utility Functions
 */
(function(admin) {
    'use strict';

    /**
     * Toggle view between admin panel and site preview
     */
    admin.toggleView = function() {
        // Function to show site preview
        window.open('/', '_blank');
    };

    /**
     * Logout from admin panel
     */
    admin.logout = function() {
        // Function to logout from admin panel
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/admin/login';
        }
    };

})(window.SimoonAdmin);