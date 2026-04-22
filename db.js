import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
            apiKey: "AIzaSyC907raHdPtNtNxBNLxImf7i-FfPIvglhE",
            authDomain: "sohh-7b016.firebaseapp.com",
            projectId: "sohh-7b016",
            storageBucket: "sohh-7b016.firebasestorage.app",
            messagingSenderId: "436729414470",
            appId: "1:436729414470:web:da0db38fedb21aaeac5b47",
            measurementId: "G-SDNWQPHX47"
        };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
