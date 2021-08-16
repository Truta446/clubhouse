import { constants } from "../util/constants.js";
import Attendee from "../entities/attendee.js";
import Room from "../entities/room.js";
import CustomMap from "../util/customMap.js";

export default class RoomsController {
    #users = new Map();

    constructor({ roomsPubSub }) {
        this.roomsPubSub = roomsPubSub;
        this.rooms = new CustomMap({
            observer: this.#roomObserver(),
            customMapper: this.#mapRoom.bind(this)
        });
    }

    #roomObserver() {
        return {
            notify: (rooms) => this.notifyRoomSubscribers(rooms)
        }
    }

    speakAnswer(socket, { answer, user }) {
        const userId = user.id;
        const currentUser = this.#users.get(user.id);
        const updatedUser = new Attendee({
            ...currentUser,
            isSpeaker: answer
        });
        this.#users.set(userId, updatedUser);

        const roomId = user.roomId;
        const room = this.rooms.get(roomId);
        const userOnRoom = [...room.users.values()].find(({ id }) => id === userId);
        room.users.delete(userOnRoom);
        room.users.add(updatedUser);
        this.rooms.set(roomId, room);

        /**
         * Come back to himself
         */
        socket.emit(constants.event.UPGRADE_USER_PERMISSION, updatedUser);

        /**
         * Notify the entire room to call this new speaker.
         */
        this.#notifyUserProfileUpgrade(socket, roomId, updatedUser);
    }

    speakRequest(socket) {
        const userId = socket.id;
        const user = this.#users.get(userId);
        const roomId = user.roomId;
        const owner = this.rooms.get(roomId)?.owner;

        socket.to(owner.id).emit(constants.event.SPEAK_REQUEST, user);
    }

    notifyRoomSubscribers(rooms) {
        this.roomsPubSub.emit(constants.event.LOBBY_UPDATED, [...rooms.values()]);
    }

    onNewConnection(socket) {
        const { id } = socket;
        this.#updateGlobalUserData(id);
    }

    disconnect(socket) {
        this.#logoutUser(socket);
    }

    #logoutUser(socket) {
        const userId = socket.id;
        const user = this.#users.get(userId);
        const roomId = user.roomId;

        /* Remove user from active users list. */
        this.#users.delete(userId);

        /* Know if user stay on dirty room. */
        if (!this.rooms.has(roomId)) {
            return;
        }

        const room = this.rooms.get(roomId);
        const toBeRemoved = [...room.users].find(({ id }) => id === userId);

        /* we remove the user from the room. */
        room.users.delete(toBeRemoved);

        /* If there are no more users in the room, we kill the room. */
        if (!room.users.size) {
            this.rooms.delete(roomId);
            return;
        }

        const disconnectedUserWasAnOwner = userId === room.owner.id;
        const onlyOneUserLeft = room.users.size === 1;

        /* Validate if there is only one user or if the user was the owner of the room. */
        if (onlyOneUserLeft || disconnectedUserWasAnOwner) {
            room.owner = this.#getNewRoomOwner(room, socket);
        }

        /* Update the room at the end. */
        this.rooms.set(roomId, room);

        /* Notifies the room that the user logs out. */
        socket.to(roomId).emit(constants.event.USER_DISCONNECTED, user);
    }

    #notifyUserProfileUpgrade(socket, roomId, user) {
        socket.to(roomId).emit(constants.event.UPGRADE_USER_PERMISSION, user);
    }

    #getNewRoomOwner(room, socket) {
        const users = [...room.users.values()];
        const activeSpeakers = users.find(user => user.isSpeaker);

        /**
         * If the person who disconnected was the owner, it passes the lead to the next one.
         * If there are no speakers, it takes the oldest attendee (first prosition).
         */
        const [newOwner] = activeSpeakers ? [activeSpeakers] : users;
        newOwner.isSpeaker = true;

        const outdatedUser = this.#users.get(newOwner.id);
        const updatedUser = new Attendee({
            ...outdatedUser,
            ...newOwner,
        });

        this.#users.set(newOwner.id, updatedUser);

        this.#notifyUserProfileUpgrade(socket, room.id, newOwner);

        return newOwner;
    }

    joinRoom(socket, { user, room }) {
        const userId = user.id = socket.id;
        const roomId = room.id;

        const updatedUserData = this.#updateGlobalUserData(userId, user, roomId);

        const updatedRoom = this.#joinUserRoom(socket, updatedUserData, room);

        this.#notifyUsersOnRoom(socket, roomId, updatedUserData);

        this.#replyWithActiveUsers(socket, updatedRoom.users);
    }

    #replyWithActiveUsers(socket, users) {
        const event = constants.event.LOBBY_UPDATED;
        socket.emit(event, [...users.values()]);
    }

    #notifyUsersOnRoom(socket, roomId, user) {
        const event = constants.event.USER_CONNECTED;
        socket.to(roomId).emit(event, user);
    }

    #joinUserRoom(socket, user, room) {
        const roomId = room.id;
        const existingRoom = this.rooms.has(roomId);
        const currentRoom = existingRoom ? this.rooms.get(roomId) : {};
        const currentUser = new Attendee({
            ...user,
            roomId
        });

        // Define who owns the room.
        const [owner, users] = existingRoom ?
            [currentRoom.owner, currentRoom.users] :
            [currentUser, new Set()];

        const updatedRoom = this.#mapRoom({
            ...currentRoom,
            ...room,
            owner,
            users: new Set([...users, ...[currentUser]])
        });

        this.rooms.set(roomId, updatedRoom);

        socket.join(roomId);

        return this.rooms.get(roomId);
    }

    #mapRoom(room) {
        const users = [...room.users.values()];
        const speakersCount = users.filter(user => user.isSpeaker).length;
        const featuredAttendees = users.slice(0, 3);
        const mappedRoom = new Room({
            ...room,
            featuredAttendees,
            speakersCount,
            attendeesCount: room.users.size
        });

        return mappedRoom;
    }

    #updateGlobalUserData(userId, userData = {}, roomId = '') {
        const user = this.#users.get(userId) ?? {};
        const existingRoom = this.rooms.has(roomId);

        const updatedUserData = new Attendee({
            ...user,
            ...userData,
            roomId,
            // if you are the only one in the room.
            isSpeaker: !existingRoom
        });

        this.#users.set(userId, updatedUserData);

        return this.#users.get(userId);
    }

    getEvents() {
        const functions = Reflect.ownKeys(RoomsController.prototype)
        .filter(fn => fn !== 'constructor')
        .map(name => [name, this[name].bind(this)])

        return new Map(functions);
    }
}
