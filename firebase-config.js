// Your web app's Firebase configuration
const firebaseConfig = {
  // TODO: Replace with your Firebase config object
  apiKey: "your-api-key",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytes,
  getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { 
  auth, 
  db, 
  storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  doc,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
};