import { constants } from '../../_shared/constants.js';
import RoomSocketBuilder from './util/roomSocket.js';

const socketBuilder = new RoomSocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNamespaces.room
});

const socket = socketBuilder
    .setOnUserConnected((user) => console.log('User connected!', user))
    .setOnUserDisconnected((user) => console.log('User disconnected.', user))
    .setOnRoomUpdated((room) => console.log('Room list', room))
    .build();

const room = {
    id: '0001',
    topic: 'JS Expert'
};

const user = {
    img: 'https://www.iconfinder.com/icons/4043262/avatar_man_muslim_icon',
    username: 'Juan Versolato ' + Date.now()
};

socket.emit(constants.events.JOIN_ROOM, { user, room });