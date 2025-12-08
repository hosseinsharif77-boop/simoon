/**
 * Simoon Cafe Admin Panel - Orders Management
 */
(function(admin) {
    'use strict';
    
    // Create orders namespace if it doesn't exist
    if (!admin.orders) {
        admin.orders = {};
    }
    
    // Initialize orders functionality
    admin.orders.init = async function() {
        console.log('Initializing orders management...');
        
        // Fetch orders data
        await admin.orders.fetchOrders();
        
        // Set up event listeners
        admin.orders.setupEventListeners();
    };
    
    // Fetch orders data from API
    admin.orders.fetchOrders = async function() {
        try {
            // In a real application, this would be an API call
            // For now, we'll use mock data
            
            // Populate orders table
            admin.orders.populateOrdersTable();
            
        } catch (error) {
            console.error('Error fetching orders data:', error);
        }
    };
    
    // Populate orders table
    admin.orders.populateOrdersTable = function() {
        const ordersContentArea = document.getElementById('ordersContentArea');
        
        // Mock data
        const orders = [
            { 
                id: 'ORD-001', 
                customer: 'John Doe', 
                date: '2023-11-15', 
                total: '$45.67', 
                status: 'Completed',
                items: [
                    { name: 'Cappuccino', quantity: 2, price: '$3.50' },
                    { name: 'Croissant', quantity: 1, price: '$4.50' }
                ]
            },
            { 
                id: 'ORD-002', 
                customer: 'Jane Smith', 
                date: '2023-11-15', 
                total: '$23.45', 
                status: 'Pending',
                items: [
                    { name: 'Latte', quantity: 1, price: '$4.00' },
                    { name: 'Muffin', quantity: 2, price: '$2.50' }
                ]
            },
            { 
                id: 'ORD-003', 
                customer: 'Bob Johnson', 
                date: '2023-11-14', 
                total: '$67.89', 
                status: 'Completed',
                items: [
                    { name: 'Espresso', quantity: 3, price: '$2.50' },
                    { name: 'Sandwich', quantity: 2, price: '$7.50' }
                ]
            }
        ];
        
        // Create table HTML
        let tableHTML = `
            <div class="table-responsive">
                <table class="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        orders.forEach(order => {
            const statusClass = order.status === 'Completed' ? 'bg-success' : 
                               order.status === 'Pending' ? 'bg-warning' : 'bg-danger';
            
            tableHTML += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.customer}</td>
                    <td>${order.date}</td>
                    <td>${order.total}</td>
                    <td><span class="badge ${statusClass}">${order.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="admin.orders.viewOrderDetails('${order.id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        ordersContentArea.innerHTML = tableHTML;
        
        // Store orders data for later use
        admin.orders.data = orders;
    };
    
    // View order details
    admin.orders.viewOrderDetails = function(orderId) {
        const order = admin.orders.data.find(o => o.id === orderId);
        
        if (!order) {
            console.error('Order not found:', orderId);
            return;
        }
        
        // Populate modal with order details
        let itemsHTML = '';
        order.items.forEach(item => {
            itemsHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.price}</td>
                </tr>
            `;
        });
        
        const modalBody = document.getElementById('orderDetailsModalBody');
        modalBody.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Customer:</strong> ${order.customer}</p>
                    <p><strong>Date:</strong> ${order.date}</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Total:</strong> ${order.total}</p>
                    <p><strong>Status:</strong> <span class="badge ${order.status === 'Completed' ? 'bg-success' : order.status === 'Pending' ? 'bg-warning' : 'bg-danger'}">${order.status}</span></p>
                </div>
            </div>
            <h5>Order Items</h5>
            <div class="table-responsive">
                <table class="table table-dark table-hover">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>
        `;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    };
    
    // Update order status
    admin.orders.updateOrderStatus = function() {
        // In a real implementation, this would update the order status in the database
        console.log('Updating order status...');
        
        // For now, we'll just show an alert
        alert('Order status updated successfully!');
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
        modal.hide();
        
        // Refresh orders table
        admin.orders.populateOrdersTable();
    };
    
    // Render orders based on filter
    admin.orders.renderOrders = function(filter) {
        console.log('Rendering orders with filter:', filter);
        
        // In a real implementation, this would filter the orders based on the selected tab
        // For now, we'll just repopulate the table
        admin.orders.populateOrdersTable();
    };
    
    // Filter orders based on search term
    admin.orders.filterOrders = function(searchTerm) {
        console.log('Filtering orders with search term:', searchTerm);
        
        // In a real implementation, this would filter the orders based on the search term
        // For now, we'll just log the action
    };
    
    // Set up event listeners
    admin.orders.setupEventListeners = function() {
        // This function is already called from app.js
        // No need to set up event listeners here
    };
    
})(window.SimoonAdmin);