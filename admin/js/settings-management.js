/**
 * Simoon Cafe Admin Panel - Settings Management
 */
(function(admin) {
    'use strict';
    
    // Create settings namespace if it doesn't exist
    if (!admin.settings) {
        admin.settings = {};
    }
    
    // Initialize settings functionality
    admin.settings.init = async function() {
        console.log('Initializing settings management...');
        
        // Load settings data
        await admin.settings.loadSettings();
        
        // Set up event listeners
        admin.settings.setupEventListeners();
    };
    
    // Load settings data
    admin.settings.loadSettings = async function() {
        try {
            // In a real application, this would be an API call
            // For now, we'll use mock data
            
            // Populate settings forms
            admin.settings.populateGeneralSettings();
            admin.settings.populatePaymentSettings();
            admin.settings.populateNotificationSettings();
            admin.settings.populateUsersTable();
            
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };
    
    // Populate general settings form
    admin.settings.populateGeneralSettings = function() {
        // Mock data
        const generalSettings = {
            restaurantName: 'Simoon Cafe',
            restaurantEmail: 'info@simooncafe.com',
            restaurantAddress: '123 Main St, Anytown, USA',
            restaurantPhone: '555-123-4567',
            restaurantCurrency: 'USD'
        };
        
        // Populate form fields
        document.getElementById('restaurant-name').value = generalSettings.restaurantName;
        document.getElementById('restaurant-email').value = generalSettings.restaurantEmail;
        document.getElementById('restaurant-address').value = generalSettings.restaurantAddress;
        document.getElementById('restaurant-phone').value = generalSettings.restaurantPhone;
        document.getElementById('restaurant-currency').value = generalSettings.restaurantCurrency;
    };
    
    // Populate payment settings form
    admin.settings.populatePaymentSettings = function() {
        // Mock data
        const paymentSettings = {
            enableCod: true,
            enableStripe: false,
            stripePublishableKey: '',
            stripeSecretKey: ''
        };
        
        // Populate form fields
        document.getElementById('enable-cod').checked = paymentSettings.enableCod;
        document.getElementById('enable-stripe').checked = paymentSettings.enableStripe;
        document.getElementById('stripe-publishable-key').value = paymentSettings.stripePublishableKey;
        document.getElementById('stripe-secret-key').value = paymentSettings.stripeSecretKey;
        
        // Show/hide Stripe settings based on checkbox
        document.getElementById('stripe-settings').style.display = paymentSettings.enableStripe ? 'block' : 'none';
    };
    
    // Populate notification settings form
    admin.settings.populateNotificationSettings = function() {
        // Mock data
        const notificationSettings = {
            notifyEmail: true,
            notifySms: false,
            adminEmail: 'admin@simooncafe.com'
        };
        
        // Populate form fields
        document.getElementById('notify-email').checked = notificationSettings.notifyEmail;
        document.getElementById('notify-sms').checked = notificationSettings.notifySms;
        document.getElementById('admin-email').value = notificationSettings.adminEmail;
    };
    
    // Populate users table
    admin.settings.populateUsersTable = function() {
        const tableBody = document.getElementById('users-table-body');
        
        // Mock data
        const users = [
            { id: 1, name: 'Admin User', email: 'admin@simooncafe.com', role: 'Admin', status: 'Active' },
            { id: 2, name: 'Manager User', email: 'manager@simooncafe.com', role: 'Manager', status: 'Active' },
            { id: 3, name: 'Staff User 1', email: 'staff1@simooncafe.com', role: 'Staff', status: 'Active' },
            { id: 4, name: 'Staff User 2', email: 'staff2@simooncafe.com', role: 'Staff', status: 'Inactive' }
        ];
        
        tableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td><span class="badge ${user.status === 'Active' ? 'bg-success' : 'bg-danger'}">${user.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="admin.settings.editUser(${user.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="admin.settings.deleteUser(${user.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // Store users data for later use
        admin.settings.users = users;
    };
    
    // Show settings tab
    admin.settings.showSettingsTab = function(tabName) {
        // Hide all tabs
        document.querySelectorAll('.settings-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav links
        document.querySelectorAll('.settings-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-settings`).classList.add('active');
        
        // Add active class to selected nav link
        document.querySelector(`[data-settings-tab="${tabName}"]`).classList.add('active');
    };
    
    // Open user modal for add/edit
    admin.settings.openUserModal = function(userId = null) {
        // Reset form
        document.getElementById('userSettingsForm').reset();
        
        // Set modal title
        const modalTitle = document.getElementById('userSettingsModalLabel');
        modalTitle.textContent = userId ? 'Edit User' : 'Add New User';
        
        // Show/hide delete button
        document.getElementById('deleteUserSettingsBtn').style.display = userId ? 'block' : 'none';
        
        if (userId) {
            // Populate form with user data
            const user = admin.settings.users.find(u => u.id === userId);
            
            if (user) {
                document.getElementById('userSettingsId').value = user.id;
                document.getElementById('userSettingsName').value = user.name;
                document.getElementById('userSettingsEmail').value = user.email;
                document.getElementById('userSettingsRole').value = user.role;
                document.getElementById('userSettingsStatus').checked = user.status === 'Active';
            }
        } else {
            // Clear user ID
            document.getElementById('userSettingsId').value = '';
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('userSettingsModal'));
        modal.show();
    };
    
    // Edit user
    admin.settings.editUser = function(userId) {
        admin.settings.openUserModal(userId);
    };
    
    // Delete user
    admin.settings.deleteUser = function(userId) {
        console.log('Deleting user:', userId);
        
        // In a real implementation, this would show a confirmation dialog and then delete the user
        // For now, we'll just show an alert
        if (confirm('Are you sure you want to delete this user?')) {
            alert('User deleted successfully!');
            admin.settings.populateUsersTable();
        }
    };
    
    // Set up event listeners
    admin.settings.setupEventListeners = function() {
        // General settings form submission
        document.getElementById('general-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Saving general settings...');
            alert('General settings saved successfully!');
        });
        
        // Payment settings form submission
        document.getElementById('payment-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Saving payment settings...');
            alert('Payment settings saved successfully!');
        });
        
        // Notification settings form submission
        document.getElementById('notifications-settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Saving notification settings...');
            alert('Notification settings saved successfully!');
        });
        
        // User settings form submission
        document.getElementById('userSettingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Saving user settings...');
            alert('User settings saved successfully!');
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('userSettingsModal'));
            modal.hide();
            
            // Refresh users table
            admin.settings.populateUsersTable();
        });
        
        // Delete user button
        document.getElementById('deleteUserSettingsBtn').addEventListener('click', () => {
            const userId = document.getElementById('userSettingsId').value;
            admin.settings.deleteUser(userId);
        });
        
        // Enable Stripe checkbox
        document.getElementById('enable-stripe').addEventListener('change', (e) => {
            document.getElementById('stripe-settings').style.display = e.target.checked ? 'block' : 'none';
        });
    };
    
})(window.SimoonAdmin);