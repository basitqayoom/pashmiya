// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCeo80ERlwz74d55jbv_wVG_Vv6ZCOQ08M",
  authDomain: "pashmina-f613a.firebaseapp.com",
  projectId: "pashmina-f613a",
  storageBucket: "pashmina-f613a.firebasestorage.app",
  messagingSenderId: "40478927870",
  appId: "1:40478927870:web:41443a9e54a6bac2a26eaf",
  measurementId: "G-9DVSG1KCB7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);