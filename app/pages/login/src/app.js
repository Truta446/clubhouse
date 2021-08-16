import { constants } from '../../_shared/constants.js';
import UserDB from './../../_shared/userDB.js'
const { firebaseConfig } = constants;

const currentUser = UserDB.get();
if (Object.keys(currentUser).length) {
    redirectToLobby();
}

firebase.initializeApp(firebaseConfig);
firebase.analytics();

var provider = new firebase.auth.GithubAuthProvider();
provider.addScope('read:user');

const btnLogin = document.getElementById('btnLogin');
btnLogin.addEventListener('click', onLogin({ provider, firebase }));

function onLogin({ provider, firebase }) {
    return async () => {
        try {
            const result = await firebase
                .auth()
                .signInWithPopup(provider);

            const { user } = result;
            const userData = {
                img: user.photoURL,
                username: user.displayName,
            }

            UserDB.insert(userData);

            redirectToLobby()
        } catch (error) {
            alert(JSON.stringify(error));
            console.error('error', error);
        }
    }
}

function redirectToLobby() {
    window.location = constants.pages.lobby;
}
