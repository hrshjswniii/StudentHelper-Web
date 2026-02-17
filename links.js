// Links are persisted per-user in localStorage under key ch_links_<username>
const CURRENT_USER = window.CH_CURRENT_USER || localStorage.getItem('ch_currentUser');
if(!CURRENT_USER){
    // If somehow not available, redirect to auth
    location.href = 'auth.html';
}

const STORAGE_KEY = `ch_links_${CURRENT_USER}`;
let links = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
let nextId = 1;
if(!links){
    // default starter links for new users
    links = [
        { id: 1, title: "College Portal", url: "https://portal.college.edu", category: "portal" },
        { id: 2, title: "Class Timetable", url: "https://timetable.college.edu", category: "timetable" },
        { id: 3, title: "Digital Library", url: "https://library.college.edu", category: "library" }
    ];
    nextId = 4;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
} else {
    // compute nextId
    nextId = links.reduce((m,l)=> Math.max(m, l.id), 0) + 1;
}

const categoryLabels = {
    portal: "College Portal",
    timetable: "Time Table",
    library: "Library",
    resource: "Study Resource",
    other: "Other"
};

function displayLinks() {
    const linksList = document.getElementById('linksList');

    if (links.length === 0) {
        linksList.innerHTML = '<div class="empty-state"><p>No links saved yet — add your first one!</p></div>';
        return;
    }

    linksList.innerHTML = '';

    const groupedLinks = {};
    links.forEach(link => {
        if (!groupedLinks[link.category]) {
            groupedLinks[link.category] = [];
        }
        groupedLinks[link.category].push(link);
    });

    Object.keys(groupedLinks).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.style.marginBottom = '2rem';

        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = categoryLabels[category];
        categoryTitle.style.marginBottom = '1rem';
        categoryTitle.style.color = '#2c3e50';
        categorySection.appendChild(categoryTitle);

        groupedLinks[category].forEach(link => {
            const linkCard = document.createElement('div');
            linkCard.className = 'link-card';
            linkCard.innerHTML = `
                <div class="link-info">
                    <h4>${link.title}</h4>
                    <a href="${link.url}" target="_blank">${link.url}</a>
                </div>
                <div class="link-actions">
                    <button class="delete-btn" onclick="deleteLink(${link.id})">Delete</button>
                </div>
            `;
            categorySection.appendChild(linkCard);
        });

        linksList.appendChild(categorySection);
    });
}

function addLink() {
    const title = document.getElementById('linkTitle').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const category = document.getElementById('linkCategory').value;

    if (!title || !url || !category) {
        alert('Please fill in all fields');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }

    const newLink = {
        id: nextId++,
        title: title,
        url: url,
        category: category
    };

    links.push(newLink);
    // persist per-user
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));

    document.getElementById('linkForm').reset();

    displayLinks();
}

function deleteLink(id) {
    if (confirm('Are you sure you want to delete this link?')) {
        links = links.filter(link => link.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
        displayLinks();
    }
}

document.getElementById('linkForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addLink();
});

displayLinks();
