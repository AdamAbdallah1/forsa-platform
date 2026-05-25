import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyDD4V1u0xxmGCiEa8RILpQFsF0-8Rkg6gs",
authDomain: "forsa-platfrom.firebaseapp.com",
projectId: "forsa-platfrom",
storageBucket: "forsa-platfrom.firebasestorage.app",
messagingSenderId: "571366213811",
appId: "1:571366213811:web:37b92270a287704e4e88c6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);