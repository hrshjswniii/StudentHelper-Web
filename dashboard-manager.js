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

    updateDeadlines() {
        const tasks = CollegeHelper.getData('ch_tasks')
            .filter(t => t.user === this.currentUser && !t.completed && t.due)
            .sort((a, b) => new Date(a.due) - new Date(b.due));

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);

        // Group tasks by due date
        const overdue = [];
        const dueToday = [];
        const dueTomorrow = [];
        const dueThisWeek = [];
        const dueLater = [];

        tasks.forEach(task => {
            const dueDate = new Date(task.due);
            if (dueDate < today) {
                overdue.push(task);
            } else if (dueDate.getTime() === today.getTime()) {
                dueToday.push(task);
            } else if (dueDate.getTime() === tomorrow.getTime()) {
                dueTomorrow.push(task);
            } else if (dueDate <= nextWeek) {
                dueThisWeek.push(task);
            } else {
                dueLater.push(task);
            }
        });

        // Update UI
        const deadlinesEl = document.getElementById('deadlines');
        if (!tasks.length) {
            deadlinesEl.innerHTML = '<p class="muted">No upcoming deadlines</p>';
            return;
        }

        deadlinesEl.innerHTML = `
            ${this.renderDeadlineGroup('Overdue', overdue, 'overdue')}
            ${this.renderDeadlineGroup('Due Today', dueToday, 'due-today')}
            ${this.renderDeadlineGroup('Due Tomorrow', dueTomorrow, 'due-tomorrow')}
            ${this.renderDeadlineGroup('This Week', dueThisWeek, 'this-week')}
            ${this.renderDeadlineGroup('Later', dueLater, 'later')}
        `;
    }

    renderDeadlineGroup(title, tasks, className) {
        if (!tasks.length) return '';
        
        return `
            <div class="deadline-group ${className}">
                <h4>${title} (${tasks.length})</h4>
                ${tasks.map(task => `
                    <div class="deadline-item">
                        <div class="deadline-content">
                            <strong>${task.title}</strong>
                            ${task.description ? `<p>${task.description}</p>` : ''}
                            <div class="deadline-meta">
                                <span>Due: ${new Date(task.due).toLocaleString()}</span>
                                <span class="priority-${task.priority}">${task.priority}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize dashboard when document is ready
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
});