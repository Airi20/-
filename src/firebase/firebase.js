// src/firebase/firebase.js
import { initializeApp } from "firebase/app"
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs
} from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBtvi17_M3FUpf_OywZoMMcmZKiU8z_mBc",
  authDomain: "trigger-ad101.firebaseapp.com",
  projectId: "trigger-ad101",
  storageBucket: "trigger-ad101.appspot.com", // ← typoも修正（storageBucketのドメインおかしかった）
  messagingSenderId: "769144492125",
  appId: "1:769144492125:web:45aca7e6b70a139d823db4",
  measurementId: "G-RW676RF4PH"
}

const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
const db = getFirestore(app)

// ここで全部まとめて export！
export {
  db,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs
}
