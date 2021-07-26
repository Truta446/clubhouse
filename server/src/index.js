import SocketServer from "./util/socket.js";
import RoomsController from "./controllers/roomsController.js";
import Events from 'events';
import { constants } from "./util/constants.js";

const port = process.env.PORT || 3001;
const socketServer = new SocketServer({ port });
const server = await socketServer.start();

const roomsController = new RoomsController();

const namespaces = {
    room: {
        controller: roomsController,
        eventEmitter: new Events()
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