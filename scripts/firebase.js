// firebase.js

// Import the functions you need from the SDKs you need

import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCHLIt1yYeWBcEgZ-V9WkQOKMzpfBnbkvE",
  authDomain: "vibrandom-52ecd.firebaseapp.com",
  projectId: "vibrandom-52ecd",
  storageBucket: "vibrandom-52ecd.appspot.com",
  messagingSenderId: "828338622041",
  appId: "1:828338622041:web:6fddd4f02684c58c9fab48",
  measurementId: "G-28CE8EVC0P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// Export the database object to use it in other files
export { db };
