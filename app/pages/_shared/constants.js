export const constants = {
    /* socketUrl: 'http://localhost:3000', */
    socketUrl: 'https://socket-server-clubhouse.herokuapp.com',
    socketNamespaces: {
        room: 'room',
        lobby: 'lobby'
    },
    peerConfig: Object.values({
        id: undefined,
        /* config: {
            port: 9000,
            host: 'localhost',
            path: '/'
        } */
        config: {
            host: 'peerjs-server-clubhouse.herokuapp.com',
            secure: true,
            path: '/'
        }
    }),
    pages: {
        lobby: '/pages/lobby',
        login: '/pages/login'
    },
    events: {
        USER_CONNECTED: 'userConnection',
        USER_DISCONNECTED: 'userDisconnection',
        JOIN_ROOM: 'joinRoom',
        LOBBY_UPDATED: 'lobbyUpdated',
        UPGRADE_USER_PERMISSION: 'upgradeUserPermission',
        SPEAK_REQUEST: 'speakRequest',
        SPEAK_ANSWER: 'speakAnswer'
    },
    firebaseConfig: {
        apiKey: 'AIzaSyCiKdRlMhEsBb9Bf2tHQUCzmhFWcp6HSBM',
        authDomain: 'clubhouse-550df.firebaseapp.com',
        projectId: 'clubhouse-550df',
        storageBucket: 'clubhouse-550df.appspot.com',
        messagingSenderId: '878045718276',
        appId: '1:878045718276:web:460332053b7071fb0fd251',
        measurementId: 'G-Y4YH7VXNVN'
    },
    storageKey: 'jsexpert:storage:user'
}
