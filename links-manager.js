class LinksManager {
    constructor() {
        this.currentUser = localStorage.getItem('ch_currentUser');
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const linkForm = document.getElementById('linkForm');
        if (linkForm) {
            linkForm.addEventListener('submit', (e) => this.handleAddLink(e));
        }

        CollegeHelper.setupSearch('searchLinks', (value) => this.filterLinks(value));
        
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.render());
        }
    }

    handleAddLink(e) {
        e.preventDefault();
        const title = e.target.linkTitle.value.trim();
        const url = e.target.linkUrl.value.trim();
        const category = e.target.linkCategory.value;

        const errors = CollegeHelper.validateForm(e.target, {
            linkTitle: [
                { type: 'required', message: 'Link title is required' },
                { type: 'maxLength', value: 100, message: 'Title too long (max 100 chars)' }
            ],
            linkUrl: [
                { type: 'required', message: 'URL is required' },
                { type: 'pattern', value: /^https?:\/\/.+/, message: 'Please enter a valid URL starting with http:// or https://' }
            ],
            linkCategory: [
                { type: 'required', message: 'Please select a category' }
            ]
        });

        if (errors.length) {
            CollegeHelper.showToast(errors[0], 'error');
            return;
        }

        const links = CollegeHelper.getData(`ch_links_${this.currentUser}`) || [];
        const newLink = {
            id: Date.now() + Math.random(),
            title,
            url,
            category,
            addedAt: Date.now()
        };

        links.push(newLink);
        CollegeHelper.saveData(`ch_links_${this.currentUser}`, links);
        CollegeHelper.showToast('Link added successfully!', 'success');

        e.target.reset();
        this.render();
    }

    async deleteLink(id) {
        const result = await this.showConfirmDialog('Are you sure you want to delete this link?');
        if (!result) return;

        const links = CollegeHelper.getData(`ch_links_${this.currentUser}`) || [];
        const index = links.findIndex(l => l.id === id);
        if (index === -1) return;

        const linkEl = document.querySelector(`[data-link-id="${id}"]`);
        if (linkEl) {
            await CollegeHelper.fadeOut(linkEl).finished;
        }

        links.splice(index, 1);
        CollegeHelper.saveData(`ch_links_${this.currentUser}`, links);
        CollegeHelper.showToast('Link deleted', 'success');
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

    filterLinks(searchTerm) {
        this.render(searchTerm);
    }

    render(searchTerm = '') {
        const links = CollegeHelper.getData(`ch_links_${this.currentUser}`) || [];
        const categoryFilter = document.getElementById('categoryFilter')?.value;

        // Filter links
        let filteredLinks = links;
        if (searchTerm) {
            const terms = searchTerm.toLowerCase().split(' ');
            filteredLinks = links.filter(link => 
                terms.every(term => 
                    link.title.toLowerCase().includes(term) ||
                    link.url.toLowerCase().includes(term)
                )
            );
        }

        if (categoryFilter && categoryFilter !== 'all') {
            filteredLinks = filteredLinks.filter(link => link.category === categoryFilter);
        }

        // Group links by category
        const groupedLinks = {};
        filteredLinks.forEach(link => {
            if (!groupedLinks[link.category]) {
                groupedLinks[link.category] = [];
            }
            groupedLinks[link.category].push(link);
        });

        // Update UI
        const linksList = document.getElementById('linksList');
        if (linksList) {
            if (Object.keys(groupedLinks).length === 0) {
                linksList.innerHTML = '<div class="empty-state"><p>No links saved yet</p></div>';
                return;
            }

            linksList.innerHTML = Object.entries(groupedLinks).map(([category, categoryLinks]) => `
                <div class="category-section">
                    <h3>${this.categoryLabels[category] || category}</h3>
                    ${categoryLinks.map(link => `
                        <div class="link-card" data-link-id="${link.id}">
                            <div class="link-info">
                                <h4>${link.title}</h4>
                                <a href="${link.url}" target="_blank" rel="noopener">${link.url}</a>
                                <small class="added-date">Added ${CollegeHelper.formatDate(link.addedAt)}</small>
                            </div>
                            <div class="link-actions">
                                <a href="${link.url}" target="_blank" rel="noopener" class="btn small">Open</a>
                                <button onclick="linksManager.deleteLink(${link.id})" class="btn small danger">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `).join('');
        }

        // Update stats if on dashboard
        document.getElementById('linksCount')?.textContent = links.length;
    }

    categoryLabels = {
        portal: "College Portal",
        timetable: "Time Table",
        library: "Library",
        resource: "Study Resource",
        other: "Other"
    };
}

// Initialize links manager when document is ready
let linksManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.links-panel')) {
        linksManager = new LinksManager();
    }
});