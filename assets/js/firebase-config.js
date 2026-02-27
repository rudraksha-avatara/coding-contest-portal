// assets/js/firebase-config.js

// ✅ Keep BOTH names so no matter what, init will work
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyCXQFoxfgazhIoHEqARxG3cQ2MIdTKV6-Y",
  authDomain: "contest-portal-143.firebaseapp.com",
  databaseURL: "https://contest-portal-143-default-rtdb.firebaseio.com",
  projectId: "contest-portal-143",
  storageBucket: "contest-portal-143.appspot.com", // ✅ use appspot.com
  messagingSenderId: "929697616822",
  appId: "1:929697616822:web:e7b6a3350f8ba584266717",
  measurementId: "G-JT6J60JX03"
};

// Backward compatibility (if any file uses firebaseConfig)
window.firebaseConfig = window.FIREBASE_CONFIG;