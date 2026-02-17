// Mock data for notes - TODO: Replace with Firebase backend later
let notes = [
    {
        id: 1,
        title: "Data Structures - Trees",
        subject: "Computer Science",
        content: "Binary trees, BST, AVL trees, traversal methods",
        date: "2025-10-20"
    },
    {
        id: 2,
        title: "Calculus - Integration",
        subject: "Mathematics",
        content: "Fundamental theorem of calculus, integration by parts",
        date: "2025-10-18"
    }
];

let nextId = 3;

function displayNotes() {
    const notesList = document.getElementById('notesList');

    if (notes.length === 0) {
        notesList.innerHTML = '<div class="empty-state"><p>No notes yet — add your first one!</p></div>';
        return;
    }

    notesList.innerHTML = '';

    notes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'item-card';
        noteCard.innerHTML = `
            <h4>${note.title}</h4>
            <p><strong>Subject:</strong> ${note.subject}</p>
            <p>${note.content}</p>
            <div class="item-meta">
                <span class="meta-badge">Added: ${note.date}</span>
            </div>
            <button class="delete-btn" onclick="deleteNote(${note.id})">Delete Note</button>
        `;
        notesList.appendChild(noteCard);
    });
}

function addNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const subject = document.getElementById('noteSubject').value.trim();
    const content = document.getElementById('noteContent').value.trim();

    if (!title || !subject || !content) {
        alert('Please fill in all fields');
        return;
    }

    const newNote = {
        id: nextId++,
        title: title,
        subject: subject,
        content: content,
        date: new Date().toISOString().split('T')[0]
    };

    notes.unshift(newNote);

    document.getElementById('noteForm').reset();

    displayNotes();
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        notes = notes.filter(note => note.id !== id);
        displayNotes();
    }
}

document.getElementById('noteForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addNote();
});

displayNotes();
