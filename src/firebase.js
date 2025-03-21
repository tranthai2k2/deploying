import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDg5tScMx3wh-DxfZanNoLf9_t95ZM-uDs",
  authDomain: "removetag-geldoru.firebaseapp.com",
  projectId: "removetag-geldoru",
  storageBucket: "removetag-geldoru.firebasestorage.app",
  messagingSenderId: "177975373588",
  appId: "1:177975373588:web:7cd9ef17f6361b9553dc01",
  measurementId: "G-0B2LMJ7HLV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };