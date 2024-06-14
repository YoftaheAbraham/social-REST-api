import { initializeApp } from '@firebase/app';
import { getStorage } from '@firebase/storage';
import dotenv from 'dotenv'

dotenv.config()
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGE_SENDING_ID,
    appId: process.env.FIREBASE_APP_ID
};
// const firebaseConfig = {
//     apiKey: "AIzaSyCQuvX9oui3JNbU337RgmQ1hh6qhOrcSsM",
//     authDomain: "yofigram-5504e.firebaseapp.com",
//     projectId: "yofigram-5504e",
//     storageBucket: "yofigram-5504e.appspot.com",
//     messagingSenderId: "518300312368",
//     appId: "1:518300312368:web:68edd197c7fbc222b45ef5"
// };

export const App = initializeApp(firebaseConfig);
export const storage = getStorage(App);


