import { constants } from '../../_shared/constants.js';
import RoomController from './controller.js';
import RoomSocketBuilder from './util/roomSocket.js';
import View from './view.js';

const urlParams = new URLSearchParams(window.location.search);
const keys = ['id', 'topic'];
const urlData = keys.map((key) => [key, urlParams.get(key)]);

const room = {
    ...Object.fromEntries(urlData)
}

const user = {
    img: 'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/muslim_man_avatar-512.png',
    username: 'Juan Versolato ' + Date.now()
};

const roomInfo = { user, room };

const socketBuilder = new RoomSocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNamespaces.room
});

const dependencies = {
    socketBuilder,
    roomInfo,
    view: View
}

await RoomController.initialize(dependencies);