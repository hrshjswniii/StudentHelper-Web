class TasksManager {
    constructor() {
        this.currentUser = localStorage.getItem('ch_currentUser');
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        }

        CollegeHelper.setupSearch('searchTasks', (value) => this.filterTasks(value));

        const sortSelect = document.getElementById('sortTasks');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => this.render());
        }
    }

    handleAddTask(e) {
        e.preventDefault();
        const title = e.target.taskTitle.value.trim();
        const description = e.target.taskDesc.value.trim();
        const dueDate = e.target.taskDue.value;
        const priority = e.target.taskPriority.value;

        const errors = CollegeHelper.validateForm(e.target, {
            taskTitle: [
                { type: 'required', message: 'Task title is required' },
                { type: 'maxLength', value: 100, message: 'Title too long (max 100 chars)' }
            ],
            taskDesc: [
                { type: 'maxLength', value: 500, message: 'Description too long (max 500 chars)' }
            ]
        });

        if (errors.length) {
            CollegeHelper.showToast(errors[0], 'error');
            return;
        }

        const tasks = CollegeHelper.getData('ch_tasks');
        const newTask = {
            id: Date.now() + Math.random(),
            title,
            description,
            dueDate,
            priority,
            completed: false,
            createdAt: Date.now(),
            user: this.currentUser
        };

        tasks.push(newTask);
        CollegeHelper.saveData('ch_tasks', tasks);
        CollegeHelper.showToast('Task added successfully!', 'success');

        e.target.reset();
        this.render();
    }

    async deleteTask(id) {
        const result = await this.showConfirmDialog('Are you sure you want to delete this task?');
        if (!result) return;

        const tasks = CollegeHelper.getData('ch_tasks');
        const index = tasks.findIndex(t => t.id === id);
        if (index === -1) return;

        const taskEl = document.querySelector(`[data-task-id="${id}"]`);
        if (taskEl) {
            await CollegeHelper.fadeOut(taskEl).finished;
        }

        tasks.splice(index, 1);
        CollegeHelper.saveData('ch_tasks', tasks);
        CollegeHelper.showToast('Task deleted', 'success');
        this.render();
    }

    toggleTaskComplete(id) {
        const tasks = CollegeHelper.getData('ch_tasks');
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        CollegeHelper.saveData('ch_tasks', tasks);
        
        const message = task.completed ? 'Task marked as complete' : 'Task marked as incomplete';
        CollegeHelper.showToast(message, 'success');
        
        this.render();
    }

    showConfirmDialog(message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="confirm-content">
                    <p>${message}</p>
                    <div class="confirm-actions">
                        <button class="btn" data-confirm="true">Yes, delete</button>
                        <button class="btn" data-confirm="false">Cancel</button>
                    </div>
                </div>
            `;

            const handleClick = (e) => {
                const button = e.target.closest('button');
                if (!button) return;
                
                const confirmed = button.dataset.confirm === 'true';
                document.body.removeChild(dialog);
                resolve(confirmed);
            };

            dialog.addEventListener('click', handleClick);
            document.body.appendChild(dialog);
            CollegeHelper.fadeIn(dialog.firstElementChild);
        });
    }

    filterTasks(searchTerm) {
        this.render(searchTerm);
    }

    render(searchTerm = '') {
        const tasks = CollegeHelper.getData('ch_tasks').filter(t => t.user === this.currentUser);
        const sortValue = document.getElementById('sortTasks')?.value || 'date-new';

        // Filter tasks
        let filteredTasks = tasks;
        if (searchTerm) {
            const terms = searchTerm.toLowerCase().split(' ');
            filteredTasks = tasks.filter(task => 
                terms.every(term => 
                    task.title.toLowerCase().includes(term) ||
                    (task.description || '').toLowerCase().includes(term)
                )
            );
        }

        // Sort tasks
        filteredTasks.sort((a, b) => {
            switch(sortValue) {
                case 'date-new': return b.createdAt - a.createdAt;
                case 'date-old': return a.createdAt - b.createdAt;
                case 'due-soon': 
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                case 'priority':
                    const priorityOrder = { high: 0, medium: 1, low: 2 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                default: return 0;
            }
        });

        // Update UI
        const tasksList = document.getElementById('tasksList');
        if (tasksList) {
            tasksList.innerHTML = filteredTasks.length ? filteredTasks.map(task => `
                <li class="task-item priority-${task.priority}" data-task-id="${task.id}">
                    <div class="task-main">
                        <label class="task-checkbox">
                            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                                   onchange="tasksManager.toggleTaskComplete(${task.id})">
                            <span class="checkmark"></span>
                        </label>
                        <div class="task-info ${task.completed ? 'completed' : ''}">
                            <strong>${task.title}</strong>
                            ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
                            <div class="task-meta">
                                <span>Created ${CollegeHelper.formatDate(task.createdAt)}</span>
                                ${task.dueDate ? `<span class="due-date">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                                <span class="priority-badge">${task.priority}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button onclick="tasksManager.deleteTask(${task.id})" class="btn small danger">Delete</button>
                    </div>
                </li>
            `).join('') : '<li class="muted empty-tasks">No tasks added yet</li>';
        }

        // Update stats if on dashboard
        const statsUpdate = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.completed).length,
            dueSoon: tasks.filter(t => {
                if (!t.dueDate || t.completed) return false;
                const due = new Date(t.dueDate);
                const now = new Date();
                const diff = (due - now) / (1000 * 60 * 60 * 24); // difference in days
                return diff >= 0 && diff <= 7;
            }).length
        };

        // Update various stats elements if they exist
        document.getElementById('tasksCount')?.textContent = statsUpdate.totalTasks;
        document.getElementById('completedTasks')?.textContent = statsUpdate.completedTasks;
        document.getElementById('dueSoonTasks')?.textContent = statsUpdate.dueSoon;
    }
}

// Initialize tasks manager when document is ready
let tasksManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.tasks-panel')) {
        tasksManager = new TasksManager();
    }
});