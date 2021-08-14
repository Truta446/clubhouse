import { constants } from '../../_shared/constants.js';
import Attendee from './entities/attendee.js';

export default class RoomController {
    constructor({
        socketBuilder,
        roomInfo,
        view,
        peerBuilder,
        roomService
    }) {
        this.socketBuilder = socketBuilder;
        this.roomInfo = roomInfo;
        this.view = view;
        this.peerBuilder = peerBuilder;
        this.roomService = roomService;

        this.socket = {};
    }

    static async initialize(deps) {
        return new RoomController(deps)._initialize();
    }

    async _initialize() {
        this._setupViewEvents();
        this.roomService.init();
        
        this.socket = this._setupSocket();
        this.roomService.setCurrentPeer(await this._setupWebRTC());
    }

    _setupViewEvents() {
        this.view.updateUserImage(this.roomInfo.user);
        this.view.updateRoomTopic(this.roomInfo.room);
    }

    _setupSocket() {
        return this.socketBuilder
            .setOnUserConnected(this.onUserConnected())
            .setOnUserDisconnected(this.onUserDisconnected())
            .setOnRoomUpdated(this.onRoomUpdated())
            .setOnUserProfileUpgrade(this.onUserProfileUpgrade())
            .build();
    }

    async _setupWebRTC() {
        return this.peerBuilder
            .setOnError(this.onPeerError())
            .setOnConnectionOpened(this.onPeerConnectionOpened())
            .setOnCallReceived(this.onCallReceived())
            .setOnCallError(this.onCallError())
            .setOnCallClose(this.onCallClose())
            .setOnStreamReceived(this.onStreamReceived())
            .build()
    }

    onStreamReceived() {
        return (call, stream) => {
            const calledId = call.peer;
            console.log('onStreamReceived', call, stream);
            const { isCurrentId } = this.roomService.addReceivedPeer(call);
            this.view.renderAudioElement({
                calledId,
                stream,
                isCurrentId,
            });
        };
    }

    onCallClose() {
        return (call) => {
            console.log('onCallClose', call);
            const peerId = call.peer;
            this.roomService.disconnectPeer({ peerId });
        };
    }

    onCallError() {
        return (call, error) => {
            console.log('onCallError', call, error);
            const peerId = call.peer;
            this.roomService.disconnectPeer({ peerId });
        };
    }

    onCallReceived() {
        return async (call) => {
            const stream = await this.roomService.getCurrentStream();
            console.log('Answering call', call);
            call.answer(stream);
        };
    }

    onPeerError() {
        return (error) => {
            console.error('deu ruim', error);
        };
    }

    /**
     * When opening the connection, it asks to enter the socket room.
     */
    onPeerConnectionOpened() {
        return (peer) => {
            console.log('peeeeeer', peer);
            this.roomInfo.user.peerId = peer.id;
            this.socket.emit(constants.events.JOIN_ROOM, this.roomInfo);
        }
    }

    onUserProfileUpgrade() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log('onUserProfileUpgrade', attendee);

            this.roomService.upgradeUserPermission(attendee);

            if (attendee.isSpeaker) {
                this.view.addAttendeeOnGrid(attendee, true);
            }

            this.activateUserFeatures();
        };
    }

    onRoomUpdated() {
        return (data) => {
            const users = data.map(item => new Attendee(item)); 
            console.log('Room list', users);

            this.view.updateAttendeesOnGrid(users);
            this.roomService.updateCurrentUserProfile(users);
            this.activateUserFeatures();
        };
    }

    onUserDisconnected() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log(`${attendee.username} disconnected.`);
            this.view.removeItemFromGrid(attendee.id);

            this.roomService.disconnectPeer(attendee);
        }
    }

    onUserConnected() {
        return (data) => {
            const attendee = new Attendee(data);
            console.log(`${attendee.username} connected!`);
            this.view.addAttendeeOnGrid(attendee);

            this.roomService.callNewUser(attendee);
        }
    }

    activateUserFeatures() {
        const currentUser = this.roomService.getCurrentUser();
        console.log(currentUser);
        this.view.showUserFeatures(currentUser.isSpeaker);
    }
}