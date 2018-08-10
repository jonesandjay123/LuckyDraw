if (typeof firebase === 'undefined') throw new Error('hosting/init-error: Firebase SDK not detected. You must include it before /__/firebase/init.js');
firebase.initializeApp({
  apiKey: "AIzaSyCKnwCMHxdtgftBbrCxheQ8YaLKCGBnNMI",
  authDomain: "luckydraw-a74fa.firebaseapp.com",
  databaseURL: "https://luckydraw-a74fa.firebaseio.com",
  projectId: "luckydraw-a74fa",
  storageBucket: "luckydraw-a74fa.appspot.com",
  messagingSenderId: "419044534265"
});
