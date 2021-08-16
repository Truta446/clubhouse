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
    this.view.configureOnMicrophoneActivatedButton(this.onMicrophoneActivation());
    this.view.configureLeaveButton();
    this.view.configureClapButton(this.onClapPressed());
    this.view.updateUserImage(this.roomInfo.user);
    this.view.updateRoomTopic(this.roomInfo.room);
  }

  onMicrophoneActivation() {
    return async () => {
      await this.roomService.toggleAudioActivation();
    }
  }

  onClapPressed() {
    return () => {
      this.socket.emit(constants.events.SPEAK_REQUEST, this.roomInfo.user);
    }
  }

  _setupSocket() {
    return this.socketBuilder
      .setOnUserConnected(this.onUserConnected())
      .setOnUserDisconnected(this.onUserDisconnected())
      .setOnRoomUpdated(this.onRoomUpdated())
      .setOnUserProfileUpgrade(this.onUserProfileUpgrade())
      .setOnSpeakRequested(this.onSpeakRequested())
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
      .build();
  }

  onSpeakRequested() {
    return (data) => {
      const user = new Attendee(data);
      const result = prompt(`${user.username} pediu para falar!, Aceitar? 1 - sim; 0 - não`);
      this.socket.emit(constants.events.SPEAK_ANSWER, { answer: !!Number(result), user });
    }
  }

  onStreamReceived() {
    return (call, stream) => {
      const calledId = call.peer;
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
      const peerId = call.peer;
      this.roomService.disconnectPeer({ peerId });
    };
  }

  onCallError() {
    return (call, error) => {
      const peerId = call.peer;
      this.roomService.disconnectPeer({ peerId });
    };
  }

  onCallReceived() {
    return async (call) => {
      const stream = await this.roomService.getCurrentStream();
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
      this.roomInfo.user.peerId = peer.id;
      this.socket.emit(constants.events.JOIN_ROOM, this.roomInfo);
    }
  }

  onUserProfileUpgrade() {
    return (data) => {
      const attendee = new Attendee(data);

      if (attendee.isSpeaker) {
        this.roomService.upgradeUserPermission(attendee);
        this.view.addAttendeeOnGrid(attendee, true);
      }

      this.activateUserFeatures();
    };
  }

  onRoomUpdated() {
    return (data) => {
      const users = data.map(item => new Attendee(item));

      this.view.updateAttendeesOnGrid(users);
      this.roomService.updateCurrentUserProfile(users);
      this.activateUserFeatures();
    };
  }

  onUserDisconnected() {
    return (data) => {
      const attendee = new Attendee(data);
      this.view.removeItemFromGrid(attendee.id);

      this.roomService.disconnectPeer(attendee);
    }
  }

  onUserConnected() {
    return (data) => {
      const attendee = new Attendee(data);
      this.view.addAttendeeOnGrid(attendee);

      this.roomService.callNewUser(attendee);
    }
  }

  activateUserFeatures() {
    const currentUser = this.roomService.getCurrentUser();
    this.view.showUserFeatures(currentUser.isSpeaker);
  }
}
