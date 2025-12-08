/**
 * Simoon Cafe Admin Panel - Dashboard Management (with i18n)
 */
(function(admin) {
    'use strict';
    
    // Create dashboard namespace if it doesn't exist
    if (!admin.dashboard) {
        admin.dashboard = {};
    }
    
    // Initialize dashboard functionality
    admin.dashboard.init = async function() {
        console.log(admin.i18n.t('initializing_dashboard'));
        
        // Fetch dashboard data
        await admin.dashboard.fetchDashboardData();
        
        // Initialize charts
        admin.dashboard.initCharts();
        
        // Set up event listeners
        admin.dashboard.setupEventListeners();
    };
    
    // Fetch dashboard data from API
    admin.dashboard.fetchDashboardData = async function() {
        try {
            // In a real application, this would be an API call
            // For now, we'll use mock data
            
            // Update KPI cards with descriptions
            admin.dashboard.updateKPICards();
            
            // Populate latest orders table
            admin.dashboard.populateLatestOrders();
            
            // Populate low stock table
            admin.dashboard.populateLowStock();
            
        } catch (error) {
            console.error(admin.i18n.t('error_fetching_dashboard_data'), error);
        }
    };
    
    // Update KPI cards with descriptions
    admin.dashboard.updateKPICards = function() {
        // Update Today's Sales
        const todaySalesCard = document.querySelector('#today-sales').closest('.card-body');
        if (todaySalesCard) {
            const titleElement = todaySalesCard.querySelector('.card-title');
            titleElement.innerHTML = `${admin.i18n.t('todays_sales')} <i class="bi bi-info-circle ms-1" data-bs-toggle="tooltip" data-bs-placement="top" title="${admin.i18n.t('total_revenue_from_sales_today')}"></i>`;
            
            document.getElementById('today-sales').textContent = '$1,234.56';
            document.getElementById('today-sales-change').innerHTML = `<i class="bi bi-arrow-up"></i> 12.5% ${admin.i18n.t('compared_to_yesterday')}`;
        }
        
        // Update Today's Orders
        const todayOrdersCard = document.querySelector('#today-orders').closest('.card-body');
        if (todayOrdersCard) {
            const titleElement = todayOrdersCard.querySelector('.card-title');
            titleElement.innerHTML = `${admin.i18n.t('todays_orders')} <i class="bi bi-info-circle ms-1" data-bs-toggle="tooltip" data-bs-placement="top" title="${admin.i18n.t('total_orders_today')}"></i>`;
            
            document.getElementById('today-orders').textContent = '42';
            document.getElementById('orders-change').innerHTML = `<i class="bi bi-arrow-up"></i> 8.3% ${admin.i18n.t('compared_to_yesterday')}`;
        }
        
        // Update Average Order Value
        const avgOrderCard = document.querySelector('#avg-order-value').closest('.card-body');
        if (avgOrderCard) {
            const titleElement = avgOrderCard.querySelector('.card-title');
            titleElement.innerHTML = `${admin.i18n.t('avg_order_value')} <i class="bi bi-info-circle ms-1" data-bs-toggle="tooltip" data-bs-placement="top" title="${admin.i18n.t('average_amount_per_order_today')}"></i>`;
            
            document.getElementById('avg-order-value').textContent = '$29.40';
            document.getElementById('avg-change').innerHTML = `<i class="bi bi-arrow-down"></i> 2.1% ${admin.i18n.t('compared_to_yesterday')}`;
        }
        
        // Update Low Stock Items
        const lowStockCard = document.querySelector('#low-stock-count').closest('.card-body');
        if (lowStockCard) {
            const titleElement = lowStockCard.querySelector('.card-title');
            titleElement.innerHTML = `${admin.i18n.t('low_stock_items')} <i class="bi bi-info-circle ms-1" data-bs-toggle="tooltip" data-bs-placement="top" title="${admin.i18n.t('products_needing_restock')}"></i>`;
            
            document.getElementById('low-stock-count').textContent = '7';
            document.getElementById('low-stock-count').nextElementSibling.innerHTML = `<i class="bi bi-exclamation-triangle"></i> ${admin.i18n.t('alert')}`;
        }
        
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    };
    
    // Initialize charts
    admin.dashboard.initCharts = function() {
        // Sales trend chart
        const salesCtx = document.getElementById('sales-chart').getContext('2d');
        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: Array.from({length: 30}, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (29 - i));
                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: admin.i18n.t('sales'),
                    data: Array.from({length: 30}, () => Math.floor(Math.random() * 1000) + 500),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return admin.i18n.t('sales_trend');
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
        
        // Category sales chart
        const categoryCtx = document.getElementById('category-chart').getContext('2d');
        new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: [
                    admin.i18n.t('coffee'),
                    admin.i18n.t('pastries'),
                    admin.i18n.t('sandwiches'),
                    admin.i18n.t('beverages'),
                    admin.i18n.t('other')
                ],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            title: function(context) {
                                return admin.i18n.t('sales_by_category');
                            }
                        }
                    }
                }
            }
        });
    };
    
    // Populate latest orders table
    admin.dashboard.populateLatestOrders = function() {
        const tableBody = document.getElementById('latest-orders-table');
        
        // Mock data
        const orders = [
            { id: 'ORD-001', customer: 'John Doe', total: '$45.67', status: admin.i18n.t('completed') },
            { id: 'ORD-002', customer: 'Jane Smith', total: '$23.45', status: admin.i18n.t('pending') },
            { id: 'ORD-003', customer: 'Bob Johnson', total: '$67.89', status: admin.i18n.t('completed') },
            { id: 'ORD-004', customer: 'Alice Brown', total: '$12.34', status: admin.i18n.t('cancelled') },
            { id: 'ORD-005', customer: 'Charlie Wilson', total: '$56.78', status: admin.i18n.t('pending') }
        ];
        
        tableBody.innerHTML = '';
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.id}</td>
                <td>${order.customer}</td>
                <td>${order.total}</td>
                <td><span class="badge ${order.status === admin.i18n.t('completed') ? 'bg-success' : order.status === admin.i18n.t('pending') ? 'bg-warning' : 'bg-danger'}">${order.status}</span></td>
            `;
            tableBody.appendChild(row);
        });
    };
    
    // Populate low stock table
    admin.dashboard.populateLowStock = function() {
        const tableBody = document.getElementById('low-stock-table');
        
        // Mock data
        const lowStockItems = [
            { product: admin.i18n.t('espresso_beans'), stock: 5 },
            { product: admin.i18n.t('milk'), stock: 3 },
            { product: admin.i18n.t('sugar'), stock: 8 },
            { product: admin.i18n.t('croissant'), stock: 2 },
            { product: admin.i18n.t('chocolate_syrup'), stock: 4 }
        ];
        
        tableBody.innerHTML = '';
        lowStockItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.product}</td>
                <td>${item.stock}</td>
                <td><button class="btn btn-sm btn-primary">${admin.i18n.t('restock')}</button></td>
            `;
            tableBody.appendChild(row);
        });
    };
    
    // Set up event listeners
    admin.dashboard.setupEventListeners = function() {
        // View all orders button
        document.getElementById('view-all-orders-btn').addEventListener('click', () => {
            // Navigate to orders section
            document.querySelector('[data-section="orders"]').click();
        });
        
        // View all low stock button
        document.getElementById('view-all-low-stock-btn').addEventListener('click', () => {
            // Navigate to inventory section
            document.querySelector('[data-section="inventory"]').click();
        });
    };
    
})(window.SimoonAdmin);