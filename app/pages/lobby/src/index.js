import LobbySocketBuilder from "./util/lobbySocketBuilder.js";
import LobbyController from "./controller.js";
import View from "./view.js";
import { constants } from "../../_shared/constants.js";
import UserDB from "../../_shared/userDB.js";

const user = UserDB.get();
if (!Object.keys(user).length) {
  View.redirectToLogin();
}

const socketBuilder = new LobbySocketBuilder({
  socketUrl: constants.socketUrl,
  namespace: constants.socketNamespaces.lobby
});

const dependencies = {
  socketBuilder,
  user,
  view: View
}

LobbyController.initialize(dependencies)
.catch(error => {
  console.error(error.message);
});
