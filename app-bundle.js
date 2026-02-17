// Utility Class for College Helper App
class CollegeHelper {
    static init() {
        this.setupAuthCheck();
        this.setupLogout();
        this.setupTheme();
    }

    // Auth Management
    static setupAuthCheck() {
        const currentUser = localStorage.getItem('ch_currentUser');
        const publicPages = ['index.html', 'auth.html'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';

        if (!currentUser && !publicPages.includes(currentPage)) {
            location.href = 'auth.html';
            return;
        }

        if (currentUser && currentPage === 'auth.html') {
            location.href = 'dashboard.html';
            return;
        }
    }

    static setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    static logout() {
        localStorage.removeItem('ch_currentUser');
        location.href = 'auth.html';
    }

    // Data Management
    static getData(key, userId = null) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        return userId ? data.filter(item => item.user === userId) : data;
    }

    static saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // UI Utilities
    static setupTheme() {
        const hour = new Date().getHours();
        if (hour >= 18 || hour < 6) {
            document.body.classList.add('dark-mode');
        }
    }

    static showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        }, 100);
    }

    static formatDate(date) {
        const d = new Date(date);
        const now = new Date();
        const diff = (now - d) / 1000;

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

        return d.toLocaleDateString();
    }

    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Notes Management Class
class NotesManager {
    constructor() {
        this.currentUser = localStorage.getItem('ch_currentUser');
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Upload handler
        const uploadBtn = document.getElementById('uploadBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.handleUpload());
        }

        // Search and sort
        const searchInput = document.getElementById('searchNotes');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterNotes(e.target.value));
        }

        const sortSelect = document.getElementById('sortNotes');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.render());
        }

        // File input enhancement
        const fileInput = document.getElementById('noteFile');
        if (fileInput) {
            fileInput.addEventListener('change', () => this.updateFileLabel());
        }
    }

    async handleUpload() {
        const files = document.getElementById('noteFile').files;
        const title = document.getElementById('noteTitle').value.trim();
        const description = document.getElementById('noteDesc').value.trim();

        if (!files.length) {
            CollegeHelper.showToast('Please select at least one file', 'error');
            return;
        }

        try {
            CollegeHelper.showToast('Uploading files...', 'info');
            await this.uploadFiles(files, title, description);
            CollegeHelper.showToast('Files uploaded successfully!', 'success');
            
            // Clear form
            document.getElementById('noteFile').value = '';
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteDesc').value = '';
        } catch (error) {
            CollegeHelper.showToast('Upload failed: ' + error.message, 'error');
        }
    }

    async uploadFiles(files, title, description) {
        const notes = CollegeHelper.getData('ch_notes');
        
        for (const file of files) {
            const reader = new FileReader();
            await new Promise((resolve, reject) => {
                reader.onload = (e) => {
                    notes.push({
                        id: Date.now() + Math.random(),
                        title,
                        description,
                        name: file.name,
                        dataUrl: e.target.result,
                        size: file.size,
                        type: file.type,
                        uploadedAt: Date.now(),
                        user: this.currentUser
                    });
                    resolve();
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }

        CollegeHelper.saveData('ch_notes', notes);
        this.render();
    }

    filterNotes(searchTerm) {
        this.render(searchTerm);
    }

    async deleteNote(id) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        const notes = CollegeHelper.getData('ch_notes');
        const index = notes.findIndex(n => n.id === id);
        if (index === -1) return;

        notes.splice(index, 1);
        CollegeHelper.saveData('ch_notes', notes);
        CollegeHelper.showToast('Note deleted', 'success');
        this.render();
    }

    render(searchTerm = '') {
        const notes = CollegeHelper.getData('ch_notes').filter(n => n.user === this.currentUser);
        const sortValue = document.getElementById('sortNotes')?.value || 'date-new';
        
        // Filter notes
        let filteredNotes = notes;
        if (searchTerm) {
            const terms = searchTerm.toLowerCase().split(' ');
            filteredNotes = notes.filter(note => 
                terms.every(term => 
                    (note.title || '').toLowerCase().includes(term) ||
                    (note.name || '').toLowerCase().includes(term) ||
                    (note.description || '').toLowerCase().includes(term)
                )
            );
        }

        // Sort notes
        filteredNotes.sort((a, b) => {
            switch(sortValue) {
                case 'date-new': return b.uploadedAt - a.uploadedAt;
                case 'date-old': return a.uploadedAt - b.uploadedAt;
                case 'name': return (a.title || a.name).localeCompare(b.title || b.name);
                case 'size': return b.size - a.size;
                default: return 0;
            }
        });

        // Update UI
        const notesList = document.getElementById('notesList');
        const totalSize = notes.reduce((sum, note) => sum + (note.size || 0), 0);
        
        if (notesList) {
            notesList.innerHTML = filteredNotes.length ? filteredNotes.map(note => `
                <li class="note-item">
                    <div class="note-main">
                        <div class="note-icon">📄</div>
                        <div class="note-info">
                            <strong>${note.title || note.name}</strong>
                            ${note.description ? `<p class="note-desc">${note.description}</p>` : ''}
                            <div class="note-meta">
                                <span>Uploaded ${CollegeHelper.formatDate(note.uploadedAt)}</span>
                                <span>Size: ${CollegeHelper.formatBytes(note.size || 0)}</span>
                                <span>Type: ${note.name.split('.').pop().toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="note-actions">
                        <a href="${note.dataUrl}" download="${note.name}" class="btn small">Download</a>
                        <button onclick="notesManager.deleteNote(${note.id})" class="btn small danger">Delete</button>
                    </div>
                </li>
            `).join('') : '<li class="muted empty-notes">No notes uploaded yet</li>';
        }

        // Update stats
        document.getElementById('notesCount')?.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
        document.getElementById('totalSize')?.textContent = `Total size: ${CollegeHelper.formatBytes(totalSize)}`;
    }
}

// Dashboard Management Class
class DashboardManager {
    constructor() {
        this.currentUser = localStorage.getItem('ch_currentUser');
        if (!this.currentUser) {
            location.href = 'auth.html';
            return;
        }
        this.initializeData();
        this.setupRefreshTimer();
    }

    initializeData() {
        // Save last login time
        const lastLogin = localStorage.getItem(`ch_lastLogin_${this.currentUser}`);
        localStorage.setItem(`ch_lastLogin_${this.currentUser}`, Date.now());

        // Update welcome message
        document.getElementById('userWelcome').textContent = this.currentUser;
        document.getElementById('lastLoginTime').textContent = lastLogin ? 
            CollegeHelper.formatDate(parseInt(lastLogin)) : 'First login';

        this.updateStats();
        this.updateActivity();
        this.updateDeadlines();
    }

    setupRefreshTimer() {
        // Refresh data every minute
        setInterval(() => {
            this.updateStats();
            this.updateActivity();
            this.updateDeadlines();
        }, 60000);
    }

    updateStats() {
        // Get data
        const notes = CollegeHelper.getData('ch_notes').filter(n => n.user === this.currentUser);
        const tasks = CollegeHelper.getData('ch_tasks').filter(t => t.user === this.currentUser);
        const links = CollegeHelper.getData(`ch_links_${this.currentUser}`) || [];

        // Calculate stats
        const totalNotes = notes.length;
        const totalSize = notes.reduce((sum, note) => sum + (note.size || 0), 0);
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const totalLinks = links.length;

        // Update UI
        document.getElementById('notesCount').textContent = totalNotes;
        document.getElementById('notesSize').textContent = CollegeHelper.formatBytes(totalSize);
        document.getElementById('tasksCount').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = `${completedTasks} completed`;
        document.getElementById('linksCount').textContent = totalLinks;
    }

    updateActivity() {
        const notes = CollegeHelper.getData('ch_notes').filter(n => n.user === this.currentUser);
        const tasks = CollegeHelper.getData('ch_tasks').filter(t => t.user === this.currentUser);
        const links = CollegeHelper.getData(`ch_links_${this.currentUser}`) || [];

        // Combine all activities
        const activities = []
            .concat(notes.map(n => ({
                type: 'note',
                when: n.uploadedAt,
                text: `Uploaded note: ${n.title || n.name}`,
                size: n.size
            })))
            .concat(tasks.map(t => ({
                type: 'task',
                when: t.createdAt || t.addedAt || 0,
                text: `${t.completed ? 'Completed' : 'Added'} task: ${t.title}`,
                status: t.completed ? 'completed' : t.due ? 'pending' : 'no-due-date'
            })))
            .concat(links.map(l => ({
                type: 'link',
                when: l.addedAt || 0,
                text: `Added link: ${l.title}`,
                category: l.category
            })));

        // Sort by date (newest first) and take last 10
        activities.sort((a, b) => b.when - a.when);
        const recent = activities.slice(0, 10);

        // Update UI
        const activityFeed = document.getElementById('recentActivity');
        if (activityFeed) {
            activityFeed.innerHTML = recent.length ? recent.map(activity => `
                <div class="activity-item ${activity.type} ${activity.status || ''}">
                    <div class="activity-time">${CollegeHelper.formatDate(activity.when)}</div>
                    <div class="activity-content">
                        ${activity.text}
                        ${activity.size ? `<small>(${CollegeHelper.formatBytes(activity.size)})</small>` : ''}
                        ${activity.category ? `<small>[${activity.category}]</small>` : ''}
                    </div>
                </div>
            `).join('') : '<p class="muted">No recent activity</p>';
        }
    }

    updateDeadlines() {
        const tasks = CollegeHelper.getData('ch_tasks')
            .filter(t => t.user === this.currentUser && !t.completed && t.due)
            .sort((a, b) => new Date(a.due) - new Date(b.due));

        const deadlinesEl = document.getElementById('deadlines');
        if (!deadlinesEl) return;

        if (!tasks.length) {
            deadlinesEl.innerHTML = '<p class="muted">No upcoming deadlines</p>';
            return;
        }

        deadlinesEl.innerHTML = tasks.map(task => `
            <div class="deadline-item ${isOverdue(task.due) ? 'overdue' : ''}">
                <div class="deadline-content">
                    <strong>${task.title}</strong>
                    ${task.description ? `<p>${task.description}</p>` : ''}
                    <div class="deadline-meta">
                        <span>Due: ${new Date(task.due).toLocaleString()}</span>
                        <span class="priority-${task.priority}">${task.priority}</span>
                    </div>
                </div>
            </div>
        `).join('');

        function isOverdue(dueDate) {
            return new Date(dueDate) < new Date();
        }
    }
}

// Initialize Classes
document.addEventListener('DOMContentLoaded', () => {
    // Initialize CollegeHelper
    CollegeHelper.init();

    // Initialize page-specific managers
    const page = window.location.pathname.split('/').pop();
    
    if (page === 'notes.html' || page === 'notes_new.html') {
        window.notesManager = new NotesManager();
    }
    else if (page === 'dashboard.html' || page === 'dashboard_new.html') {
        window.dashboardManager = new DashboardManager();
    }
});

// Add dynamic styles
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: #333;
        color: white;
        border-radius: 4px;
        opacity: 0;
        transform: translateY(100%);
        transition: all 0.3s ease;
        z-index: 1000;
    }
    .toast.show {
        opacity: 1;
        transform: translateY(0);
    }
    .toast-success { background: #28a745; }
    .toast-error { background: #dc3545; }
    .toast-warning { background: #ffc107; color: #333; }
    
    .dark-mode {
        background: #1a1a1a;
        color: #fff;
    }
    .dark-mode .navbar {
        background: #2c2c2c;
    }
    .dark-mode .card,
    .dark-mode .notes-panel,
    .dark-mode .auth-box {
        background: #2c2c2c;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
`;