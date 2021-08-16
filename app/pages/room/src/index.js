import PeerBuilder from '../../_shared/peerBuilder.js';
import RoomController from './controller.js';
import RoomService from './service.js';
import RoomSocketBuilder from './util/roomSocket.js';
import View from './view.js';
import { constants } from '../../_shared/constants.js';
import UserDB from "../../_shared/userDB.js";
import Media from '../../_shared/media.js';

const user = UserDB.get();
if (!Object.keys(user).length) {
  View.redirectToLogin();
}

const urlParams = new URLSearchParams(window.location.search);
const keys = ['id', 'topic'];
const urlData = keys.map((key) => [key, urlParams.get(key)]);

const room = {
  ...Object.fromEntries(urlData)
}

const roomInfo = { user, room };

const peerBuilder = new PeerBuilder({
    peerConfig: constants.peerConfig
});

const socketBuilder = new RoomSocketBuilder({
  socketUrl: constants.socketUrl,
  namespace: constants.socketNamespaces.room
});

const roomService = new RoomService({
  media: Media
});

const dependencies = {
  socketBuilder,
  roomInfo,
  view: View,
  peerBuilder,
  roomService
}

RoomController.initialize(dependencies)
.catch(error => {
  console.error(error.message);
});
