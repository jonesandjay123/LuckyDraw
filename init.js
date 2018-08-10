if (typeof firebase === 'undefined') throw new Error('hosting/init-error: Firebase SDK not detected. You must include it before /__/firebase/init.js');
firebase.initializeApp({
    apiKey: "AIzaSyCl_SZpy_jPglg0T0f4a6uxafyNDYLU-q4",
	authDomain: "test-2292b.firebaseapp.com",
    databaseURL: "https://test-2292b.firebaseio.com",
    projectId: "test-2292b",
    storageBucket: "test-2292b.appspot.com",
    messagingSenderId: "289972332728"
});