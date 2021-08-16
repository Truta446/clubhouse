import { constants } from '../../_shared/constants.js';
import UserDB from './../../_shared/userDB.js'
const { firebaseConfig } = constants;

const currentUser = UserDB.get();
if (Object.keys(currentUser).length) {
  redirectToLobby();
}

firebase.initializeApp(firebaseConfig);
firebase.analytics();

/**
 * Github OAuth
 */
const githubProvider = new firebase.auth.GithubAuthProvider();
githubProvider.addScope('read:user');

const btnGithubLogin = document.getElementById('btnGithubLogin');
btnGithubLogin.addEventListener('click', onGithubLogin({ githubProvider, firebase }));

function onGithubLogin({ githubProvider, firebase }) {
  return async () => {
    try {
      const result = await firebase
        .auth()
        .signInWithPopup(githubProvider);

      const { user } = result;
      const userData = {
        img: user.photoURL,
        username: user.displayName,
      }

      UserDB.insert(userData);

      redirectToLobby();
    } catch (error) {
      console.error('error', error);
    }
  }
}

/**
 * Google OAuth
 */
const googleProvider = new firebase.auth.GoogleAuthProvider();

const btnGoogleLogin = document.getElementById('btnGoogleLogin');
btnGoogleLogin.addEventListener('click', onGoogleLogin({ googleProvider, firebase }));

function onGoogleLogin({ googleProvider, firebase }) {
  return async () => {
    try {
      const result = await firebase
        .auth()
        .signInWithPopup(googleProvider);

      const { user } = result;
      const userData = {
        img: user.photoURL,
        username: user.displayName,
      }

      UserDB.insert(userData);

      redirectToLobby();
    } catch (error) {
      console.error('error', error);
    }
  }
}

function redirectToLobby() {
  window.location = constants.pages.lobby;
}
