const GameStatus = Object.freeze({
    ONGOING: 'Ongoing',
    CHECKMATE: 'Checkmate',
    STALEMATE: 'Stalemate',
    DRAW: 'Draw',
    INSUFF_MATERIAL: 'Insufficient Material',
    THREEFOLD_REP: 'Threefold Repetition',
    CHECK: 'Check'
});

export default GameStatus;