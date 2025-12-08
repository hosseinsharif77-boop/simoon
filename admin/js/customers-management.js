/**
 * Simoon Cafe Admin Panel - Customers Management
 */
(function(admin) {
    'use strict';
    
    // Create customers namespace if it doesn't exist
    if (!admin.customers) {
        admin.customers = {};
    }
    
    // Initialize customers functionality
    admin.customers.init = async function() {
        console.log('Initializing customers management...');
        
        // Fetch customers data
        await admin.customers.fetchCustomers();
        
        // Set up event listeners
        admin.customers.setupEventListeners();
    };
    
    // Fetch customers data from API
    admin.customers.fetchCustomers = async function() {
        try {
            // In a real application, this would be an API call
            // For now, we'll use mock data
            
            // Populate customers table
            admin.customers.populateCustomersTable();
            
        } catch (error) {
            console.error('Error fetching customers data:', error);
        }
    };
    
    // Populate customers table
    admin.customers.populateCustomersTable = function() {
        const tableBody = document.getElementById('customers-table');
        
        // Mock data
        const customers = [
            { 
                id: 1, 
                name: 'John Doe', 
                email: 'john@example.com', 
                phone: '123-456-7890', 
                totalOrders: 15, 
                totalSpent: '$456.78', 
                loyaltyPoints: 230 
            },
            { 
                id: 2, 
                name: 'Jane Smith', 
                email: 'jane@example.com', 
                phone: '234-567-8901', 
                totalOrders: 8, 
                totalSpent: '$234.56', 
                loyaltyPoints: 120 
            },
            { 
                id: 3, 
                name: 'Bob Johnson', 
                email: 'bob@example.com', 
                phone: '345-678-9012', 
                totalOrders: 22, 
                totalSpent: '$678.90', 
                loyaltyPoints: 340 
            },
            { 
                id: 4, 
                name: 'Alice Brown', 
                email: 'alice@example.com', 
                phone: '456-789-0123', 
                totalOrders: 5, 
                totalSpent: '$123.45', 
                loyaltyPoints: 75 
            },
            { 
                id: 5, 
                name: 'Charlie Wilson', 
                email: 'charlie@example.com', 
                phone: '567-890-1234', 
                totalOrders: 12, 
                totalSpent: '$345.67', 
                loyaltyPoints: 180 
            }
        ];
        
        tableBody.innerHTML = '';
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.email}</td>
                <td>${customer.phone}</td>
                <td>${customer.totalOrders}</td>
                <td>${customer.totalSpent}</td>
                <td>${customer.loyaltyPoints}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="admin.customers.viewCustomerDetails(${customer.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="admin.customers.editCustomer(${customer.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };
    
    // Set up event listeners
    admin.customers.setupEventListeners = function() {
        // Add customer button
        document.getElementById('add-customer-btn').addEventListener('click', () => {
            admin.customers.openCustomerModal();
        });
        
        // Export customers button
        document.getElementById('export-customers-btn').addEventListener('click', () => {
            admin.customers.exportCustomers();
        });
        
        // Search input
        document.getElementById('customer-search-input').addEventListener('input', (e) => {
            admin.customers.filterCustomers(e.target.value);
        });
        
        // Clear search button
        document.getElementById('clear-customer-search-btn').addEventListener('click', () => {
            document.getElementById('customer-search-input').value = '';
            admin.customers.populateCustomersTable();
        });
    };
    
    // Open customer modal for add/edit
    admin.customers.openCustomerModal = function(customerId = null) {
        // Implementation for opening customer modal
        console.log('Opening customer modal for', customerId ? 'editing' : 'adding');
        
        // In a real implementation, this would open a modal with customer details
        // For now, we'll just log the action
    };
    
    // View customer details
    admin.customers.viewCustomerDetails = function(customerId) {
        console.log('Viewing details for customer', customerId);
        
        // In a real implementation, this would navigate to a customer details page
        // or open a modal with customer details
    };
    
    // Edit customer
    admin.customers.editCustomer = function(customerId) {
        console.log('Editing customer', customerId);
        
        // In a real implementation, this would open a modal with customer details for editing
    };
    
    // Export customers
    admin.customers.exportCustomers = function() {
        console.log('Exporting customers data');
        
        // In a real implementation, this would generate and download a CSV file
        // For now, we'll just show an alert
        alert('Customers data exported successfully!');
    };
    
    // Filter customers
    admin.customers.filterCustomers = function(searchTerm) {
        console.log('Filtering customers with term:', searchTerm);
        
        // In a real implementation, this would filter the customers table
        // For now, we'll just log the action
    };
    
})(window.SimoonAdmin);