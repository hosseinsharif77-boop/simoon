// فایل جدید: js/stateManager.js
class StateManager {
    constructor() {
        this.state = {
            currentMainCategory: 'all',
            currentSubCategory: '',
            currentPage: 'home',
            order: [],
            favorites: [],
            allMenuItems: []
        };
        
        this.subscribers = [];
    }
    
    subscribe(callback) {
        this.subscribers.push(callback);
    }
    
    setState(updates) {
        Object.assign(this.state, updates);
        this.notifySubscribers();
    }
    
    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }
    
    getState() {
        return { ...this.state };
    }
}

export const stateManager = new StateManager();