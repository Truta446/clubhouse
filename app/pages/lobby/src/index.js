import LobbySocketBuilder from "./util/lobbySocketBuilder.js";
import LobbyController from "./controller.js";
import View from "./view.js";
import { constants } from "../../_shared/constants.js";

const user = {
    img: 'https://cdn4.iconfinder.com/data/icons/avatars-xmas-giveaway/128/muslim_man_avatar-512.png',
    username: 'Juan Versolato ' + Date.now()
};

const socketBuilder = new LobbySocketBuilder({
    socketUrl: constants.socketUrl,
    namespace: constants.socketNamespaces.lobby
});

const dependencies = {
    socketBuilder,
    user,
    view: View
}

await LobbyController.initialize(dependencies);