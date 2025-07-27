import GameServer from './server/GameServer.js';

const PORT = process.env.PORT || 3000;
const gameServer = new GameServer();

gameServer.listen(PORT);