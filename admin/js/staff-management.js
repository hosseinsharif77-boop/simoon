/**
 * Simoon Cafe Admin Panel - Staff Management
 */
(function(admin) {
    'use strict';
    
    // Create staff namespace if it doesn't exist
    if (!admin.staff) {
        admin.staff = {};
    }
    
    // Initialize staff functionality
    admin.staff.init = async function() {
        console.log('Initializing staff management...');
        
        // Fetch staff data
        await admin.staff.fetchStaff();
        
        // Set up event listeners
        admin.staff.setupEventListeners();
    };
    
    // Fetch staff data from API
    admin.staff.fetchStaff = async function() {
        try {
            // In a real application, this would be an API call
            // For now, we'll use mock data
            
            // Populate staff table
            admin.staff.populateStaffTable();
            
            // Populate staff select for scheduling
            admin.staff.populateStaffSelect();
            
            // Load permissions for default role
            admin.staff.loadPermissions('admin');
            
        } catch (error) {
            console.error('Error fetching staff data:', error);
        }
    };
    
    // Populate staff table
    admin.staff.populateStaffTable = function() {
        const tableBody = document.getElementById('staff-table');
        
        // Mock data
        const staff = [
            { id: 1, name: 'Admin User', email: 'admin@simooncafe.com', role: 'Admin', status: 'Active' },
            { id: 2, name: 'Manager User', email: 'manager@simooncafe.com', role: 'Manager', status: 'Active' },
            { id: 3, name: 'Staff User 1', email: 'staff1@simooncafe.com', role: 'Staff', status: 'Active' },
            { id: 4, name: 'Staff User 2', email: 'staff2@simooncafe.com', role: 'Staff', status: 'Inactive' },
            { id: 5, name: 'Staff User 3', email: 'staff3@simooncafe.com', role: 'Staff', status: 'Active' }
        ];
        
        tableBody.innerHTML = '';
        staff.forEach(member => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.email}</td>
                <td>${member.role}</td>
                <td><span class="badge ${member.status === 'Active' ? 'bg-success' : 'bg-danger'}">${member.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="admin.staff.editStaff(${member.id})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="admin.staff.deleteStaff(${member.id})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };
    
    // Populate staff select for scheduling
    admin.staff.populateStaffSelect = function() {
        const selectElement = document.getElementById('staff-schedule-select');
        
        // Mock data
        const staff = [
            { id: 1, name: 'Admin User' },
            { id: 2, name: 'Manager User' },
            { id: 3, name: 'Staff User 1' },
            { id: 4, name: 'Staff User 2' },
            { id: 5, name: 'Staff User 3' }
        ];
        
        selectElement.innerHTML = '';
        staff.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            selectElement.appendChild(option);
        });
        
        // Load schedule for first staff member
        if (staff.length > 0) {
            admin.staff.loadSchedule(staff[0].id);
        }
    };
    
    // Load permissions for a role
    admin.staff.loadPermissions = function(role) {
        const permissionsContainer = document.getElementById('permissions-container');
        
        // Mock permissions based on role
        const permissions = {
            admin: [
                { name: 'Manage Products', checked: true },
                { name: 'Manage Categories', checked: true },
                { name: 'Manage Orders', checked: true },
                { name: 'Manage Customers', checked: true },
                { name: 'Manage Staff', checked: true },
                { name: 'Manage Settings', checked: true },
                { name: 'View Reports', checked: true },
                { name: 'Manage Inventory', checked: true }
            ],
            manager: [
                { name: 'Manage Products', checked: true },
                { name: 'Manage Categories', checked: true },
                { name: 'Manage Orders', checked: true },
                { name: 'Manage Customers', checked: true },
                { name: 'Manage Staff', checked: false },
                { name: 'Manage Settings', checked: false },
                { name: 'View Reports', checked: true },
                { name: 'Manage Inventory', checked: true }
            ],
            staff: [
                { name: 'Manage Products', checked: false },
                { name: 'Manage Categories', checked: false },
                { name: 'Manage Orders', checked: true },
                { name: 'Manage Customers', checked: false },
                { name: 'Manage Staff', checked: false },
                { name: 'Manage Settings', checked: false },
                { name: 'View Reports', checked: false },
                { name: 'Manage Inventory', checked: true }
            ]
        };
        
        const rolePermissions = permissions[role] || [];
        
        permissionsContainer.innerHTML = '';
        rolePermissions.forEach(permission => {
            const div = document.createElement('div');
            div.className = 'form-check';
            div.innerHTML = `
                <input class="form-check-input" type="checkbox" id="permission-${permission.name.replace(/\s+/g, '-').toLowerCase()}" ${permission.checked ? 'checked' : ''}>
                <label class="form-check-label" for="permission-${permission.name.replace(/\s+/g, '-').toLowerCase()}">${permission.name}</label>
            `;
            permissionsContainer.appendChild(div);
        });
    };
    
    // Load schedule for a staff member
    admin.staff.loadSchedule = function(staffId) {
        const scheduleContainer = document.getElementById('schedule-container');
        
        // Mock schedule data
        const schedule = [
            { day: 'Monday', startTime: '09:00', endTime: '17:00' },
            { day: 'Tuesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Wednesday', startTime: '09:00', endTime: '17:00' },
            { day: 'Thursday', startTime: '09:00', endTime: '17:00' },
            { day: 'Friday', startTime: '09:00', endTime: '17:00' },
            { day: 'Saturday', startTime: '10:00', endTime: '15:00' },
            { day: 'Sunday', startTime: 'Off', endTime: 'Off' }
        ];
        
        scheduleContainer.innerHTML = '';
        schedule.forEach(day => {
            const div = document.createElement('div');
            div.className = 'row mb-2';
            div.innerHTML = `
                <div class="col-md-3">
                    <label class="form-label">${day.day}</label>
                </div>
                <div class="col-md-4">
                    <input type="time" class="form-control" value="${day.startTime === 'Off' ? '' : day.startTime}" ${day.startTime === 'Off' ? 'disabled' : ''}>
                </div>
                <div class="col-md-4">
                    <input type="time" class="form-control" value="${day.endTime === 'Off' ? '' : day.endTime}" ${day.endTime === 'Off' ? 'disabled' : ''}>
                </div>
                <div class="col-md-1">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="day-${day.day.toLowerCase()}" ${day.startTime === 'Off' ? '' : 'checked'}>
                        <label class="form-check-label" for="day-${day.day.toLowerCase()}">Working</label>
                    </div>
                </div>
            `;
            scheduleContainer.appendChild(div);
        });
    };
    
    // Set up event listeners
    admin.staff.setupEventListeners = function() {
        // Add staff button
        document.getElementById('add-staff-btn').addEventListener('click', () => {
            admin.staff.openStaffModal();
        });
        
        // Role select change
        document.getElementById('role-select').addEventListener('change', (e) => {
            admin.staff.loadPermissions(e.target.value);
        });
        
        // Staff schedule select change
        document.getElementById('staff-schedule-select').addEventListener('change', (e) => {
            admin.staff.loadSchedule(e.target.value);
        });
        
        // Save permissions button
        document.getElementById('save-permissions-btn').addEventListener('click', () => {
            admin.staff.savePermissions();
        });
        
        // Save schedule button
        document.getElementById('save-schedule-btn').addEventListener('click', () => {
            admin.staff.saveSchedule();
        });
    };
    
    // Open staff modal for add/edit
    admin.staff.openStaffModal = function(staffId = null) {
        // Implementation for opening staff modal
        console.log('Opening staff modal for', staffId ? 'editing' : 'adding');
        
        // In a real implementation, this would open a modal with staff details
        // For now, we'll just log the action
    };
    
    // Edit staff
    admin.staff.editStaff = function(staffId) {
        console.log('Editing staff member', staffId);
        
        // In a real implementation, this would open a modal with staff details for editing
    };
    
    // Delete staff
    admin.staff.deleteStaff = function(staffId) {
        console.log('Deleting staff member', staffId);
        
        // In a real implementation, this would show a confirmation dialog and then delete the staff member
        // For now, we'll just show an alert
        if (confirm('Are you sure you want to delete this staff member?')) {
            alert('Staff member deleted successfully!');
            admin.staff.populateStaffTable();
        }
    };
    
    // Save permissions
    admin.staff.savePermissions = function() {
        const role = document.getElementById('role-select').value;
        
        console.log('Saving permissions for role:', role);
        
        // In a real implementation, this would save the permissions to the database
        // For now, we'll just show an alert
        alert('Permissions saved successfully!');
    };
    
    // Save schedule
    admin.staff.saveSchedule = function() {
        const staffId = document.getElementById('staff-schedule-select').value;
        
        console.log('Saving schedule for staff member:', staffId);
        
        // In a real implementation, this would save the schedule to the database
        // For now, we'll just show an alert
        alert('Schedule saved successfully!');
    };
    
})(window.SimoonAdmin);