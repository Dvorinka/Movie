// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA8jhOoWV9icagi9f8l_WZfNy0sQJH9Z8",
  authDomain: "filmfuse-57b21.firebaseapp.com",
  projectId: "filmfuse-57b21",
  storageBucket: "filmfuse-57b21.appspot.com",
  messagingSenderId: "90721125276",
  appId: "1:90721125276:web:65c9dd1e0dac5ee55dfe59",
  measurementId: "G-VY9VR252B9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Sign in with GitHub
document.getElementById('githubSignIn').addEventListener('click', function(e) {
  e.preventDefault();
  const provider = new firebase.auth.GithubAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    console.log(result.user);
  }).catch(error => {
    console.error(error);
  });
});

// Sign in with Google
document.getElementById('googleSignIn').addEventListener('click', function(e) {
  e.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    console.log(result.user);
  }).catch(error => {
    console.error(error);
  });
});

// Sign up with GitHub
document.getElementById('githubSignUp').addEventListener('click', function(e) {
  e.preventDefault();
  const provider = new firebase.auth.GithubAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    console.log(result.user);
  }).catch(error => {
    console.error(error);
  });
});

// Sign up with Google
document.getElementById('googleSignUp').addEventListener('click', function(e) {
  e.preventDefault();
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).then(result => {
    console.log(result.user);
  }).catch(error => {
    console.error(error);
  });
});