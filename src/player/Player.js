import { Socket } from "socket.io";

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
     * @param {string} username 
     */
    setUsername(username) {
        this.username = username;
    }

    joinGame() {
        this.isInGame = true;
    }

    leaveGame() {
        this.isInGame = false;
    }

    destroy() {
        this.leaveGame();
        this.username = null;
        if (this.socket) {
            this.socket.disconnect(true);
            this.socket = null;
        }
    }
}
