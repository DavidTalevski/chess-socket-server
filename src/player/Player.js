import { Socket } from "socket.io";
import SocketEvents from "../enum/SocketEvents.enum";

export default class Player {
    userName = "player";
    isInGame = false;

    /**
     * @param {number} id 
     * @param {Socket} socket 
     */
    constructor(id, socket) {
        this.id = id;
        this.socket = socket;
    }

    onGameStarted() {

    }

    /**
     * @param {string} userName 
     */
    setUserName(userName) {
        this.userName = userName;
    }

    joinGame() {
        this.isInGame = true;
    }

    leaveGame() {
        this.isInGame = false;
    }

    destroy() {
        this.leaveGame();
        this.userName = null;
        if (this.socket) {
            this.socket.disconnect(true);
            this.socket = null;
        }
    }
}
