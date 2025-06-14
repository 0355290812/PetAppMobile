import {initializeApp} from "firebase/app";
import {getFirestore} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAgHvn08siFNfRtTFSN0HukuJ1g8czjj54",
    authDomain: "petapp-281fa.firebaseapp.com",
    projectId: "petapp-281fa",
    storageBucket: "petapp-281fa.firebasestorage.app",
    messagingSenderId: "813785872921",
    appId: "1:813785872921:web:411895b17be0b4360e0888"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;