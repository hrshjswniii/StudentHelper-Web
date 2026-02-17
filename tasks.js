// Mock data for tasks - TODO: Replace with Firebase backend later
let tasks = [
    {
        id: 1,
        title: "Complete Physics Assignment",
        subject: "Physics",
        deadline: "2025-10-28",
        priority: "high"
    },
    {
        id: 2,
        title: "Study for Math Test",
        subject: "Mathematics",
        deadline: "2025-10-30",
        priority: "medium"
    },
    {
        id: 3,
        title: "Submit Lab Report",
        subject: "Chemistry",
        deadline: "2025-11-05",
        priority: "low"
    }
];

let nextId = 4;

function displayTasks() {
    const tasksList = document.getElementById('tasksList');

    if (tasks.length === 0) {
        tasksList.innerHTML = '<div class="empty-state"><p>You haven\'t added any tasks!</p></div>';
        return;
    }

    tasksList.innerHTML = '';

    tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `item-card priority-${task.priority}`;

        const today = new Date();
        const deadline = new Date(task.deadline);
        const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        let deadlineText = '';
        if (daysUntil < 0) {
            deadlineText = 'Overdue!';
        } else if (daysUntil === 0) {
            deadlineText = 'Due today!';
        } else if (daysUntil === 1) {
            deadlineText = 'Due tomorrow';
        } else {
            deadlineText = `${daysUntil} days left`;
        }

        taskCard.innerHTML = `
            <h4>${task.title}</h4>
            <p><strong>Subject:</strong> ${task.subject}</p>
            <div class="item-meta">
                <span class="meta-badge">Deadline: ${task.deadline}</span>
                <span class="meta-badge">${deadlineText}</span>
                <span class="meta-badge">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
            </div>
            <button class="delete-btn" onclick="deleteTask(${task.id})">Delete Task</button>
        `;
        tasksList.appendChild(taskCard);
    });
}

function addTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const subject = document.getElementById('taskSubject').value.trim();
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;

    if (!title || !subject || !deadline || !priority) {
        alert('Please fill in all fields');
        return;
    }

    const newTask = {
        id: nextId++,
        title: title,
        subject: subject,
        deadline: deadline,
        priority: priority
    };

    tasks.push(newTask);

    document.getElementById('taskForm').reset();

    displayTasks();
}

function deleteTask(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== id);
        displayTasks();
    }
}

document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();
    addTask();
});

displayTasks();

// example.js or inside a React component
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs
} from "firebase/firestore";

// // Add a new user
// async function addUser() {
//   try {
//     const docRef = await addDoc(collection(db, "users"), {
//       name: "Harsh",
//       age: 20
//     });
//     console.log("User added with ID:", docRef.id);
//   } catch (e) {
//     console.error("Error adding user:", e);
//   }
// }

// // Get all users
// async function getUsers() {
//   const querySnapshot = await getDocs(collection(db, "users"));
//   querySnapshot.forEach((doc) => {
//     console.log(doc.id, " => ", doc.data());
//   });
// }
