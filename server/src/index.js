import SocketServer from "./util/socket.js";
import RoomsController from "./controllers/roomsController.js";
import Events from 'events';
import { constants } from "./util/constants.js";
import LobbyController from "./controllers/lobbyController.js";

const port = process.env.PORT || 3000;
const socketServer = new SocketServer({ port });
const server = await socketServer.start();
const roomsPubSub = new Events();

const roomsController = new RoomsController({
    roomsPubSub
});
const lobbyController = new LobbyController({
    activeRooms: roomsController.rooms,
    roomsListener: roomsPubSub
});

const namespaces = {
    room: {
        controller: roomsController,
        eventEmitter: new Events()
    },
    lobby: {
        controller: lobbyController,
        eventEmitter: roomsPubSub
    }
}

const routeConfig = Object.entries(namespaces)
    .map(([namespace, { controller, eventEmitter }]) => {
        const controllerEvents = controller.getEvents();
        eventEmitter.on(
            constants.event.USER_CONNECTED,
            controller.onNewConnection.bind(controller)
        );

        return {
            [namespace]: {
                events: controllerEvents,
                eventEmitter
            }
        }
    });

socketServer.attachEvents({ routeConfig });

console.log('Socket server is running at', server.address().port);