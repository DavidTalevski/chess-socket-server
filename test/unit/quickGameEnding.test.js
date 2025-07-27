import { setupServerAndClient, createClient, makeMove, waitForGameOver, joinAndAwaitStart } from '../helpers/server.helper.js';

describe('Quick Game Ending Tests', () => {

    const getClientSocket = setupServerAndClient();

    // Helper: Resign game
    const resign = (socket) => {
        socket.emit('leave_game');
    };

    // 1. Test Fool's Mate (Quickest Checkmate)
    it('should end with checkmate via Fool\'s Mate', async () => {
        const [player1, player2] = await Promise.all([
            joinAndAwaitStart(),
            joinAndAwaitStart(),
        ]);

        const white = player1.color === 'w' ? player1 : player2;
        const black = player1.color === 'b' ? player1 : player2;
        const gameOverPromise = waitForGameOver(white.socket);

        try {
            await makeMove(white.socket, 'f3');
            await makeMove(black.socket, 'e5');
            await makeMove(white.socket, 'g4');
            await makeMove(black.socket, 'Qh4'); // Checkmate

            const result = await gameOverPromise;

            expect(result.reason).toBe('checkmate');
            expect(result.winner).toBe('b');
        } finally {
            white.socket.disconnect();
            black.socket.disconnect();
        }
    });

    // 2. Test Scholar's Mate (4-Move Checkmate)
    it('should end with checkmate via Scholar\'s Mate', async () => {
        const [player1, player2] = await Promise.all([
            joinAndAwaitStart(),
            joinAndAwaitStart(),
        ]);

        const white = player1.color === 'w' ? player1 : player2;
        const black = player1.color === 'b' ? player1 : player2;
        const gameOverPromise = waitForGameOver(black.socket);

        try {
            await makeMove(white.socket, 'e4');
            await makeMove(black.socket, 'e5');
            await makeMove(white.socket, 'Bc4');
            await makeMove(black.socket, 'Nc6');
            await makeMove(white.socket, 'Qh5');
            await makeMove(black.socket, 'Nf6'); // Doesn't block mate
            await makeMove(white.socket, 'Qxf7'); // Checkmate

            const result = await gameOverPromise;
            expect(result.reason).toBe('checkmate');
            expect(result.winner).toBe('w');
        } finally {
            white.socket.disconnect();
            black.socket.disconnect();
        }
    });

    it('should end in stalemate', async () => {
        const [player1, player2] = await Promise.all([
            joinAndAwaitStart(),
            joinAndAwaitStart(),
        ]);

        const white = player1.color === 'w' ? player1 : player2;
        const black = player1.color === 'b' ? player1 : player2;

        const gameOverPromise = waitForGameOver(white.socket);

        const moves = [
            ['e3', 'a5'],
            ['Qh5', 'Ra6'],
            ['Qxa5', 'h5'],
            ['h4', 'Rah6'],
            ['Qxc7', 'f6'],
            ['Qxd7+', 'Kf7'],
            ['Qxb7', 'Qd3'],
            ['Qxb8', 'Qh7'],
            ['Qxc8', 'Kg6'],
            ['Qe6', null], // Now it's Black's turn and it's stalemate
        ];

        try {
            for (const [wMove, bMove] of moves) {
                await makeMove(white.socket, wMove);
                if (bMove) await makeMove(black.socket, bMove);
            }

            const result = await gameOverPromise;
            expect(result.reason).toBe('stalemate');
            expect(result.winner).toBeNull();
        } finally {
            white.socket.disconnect();
            black.socket.disconnect();
        }
    });


    // 4. Test Resignation
    it('should end when a player resigns', async () => {
        const [player1, player2] = await Promise.all([
            joinAndAwaitStart(),
            joinAndAwaitStart(),
        ]);

        const white = player1.color === 'w' ? player1 : player2;
        const black = player1.color === 'b' ? player1 : player2;
        const gameOverPromise = waitForGameOver(white.socket);

        try {
            await makeMove(white.socket, 'e4');
            resign(black.socket); // Black resigns

            const result = await gameOverPromise;
            expect(result.reason).toBe('resignation');
            expect(result.winner).toBe('w');
        } finally {
            white.socket.disconnect();
            black.socket.disconnect();
        }
    });

    it('should play full game ending in checkmate', async () => {
        const [player1, player2] = await Promise.all([
            joinAndAwaitStart(),
            joinAndAwaitStart(),
        ]);

        const white = player1.color === 'w' ? player1 : player2;
        const black = player1.color === 'b' ? player1 : player2;

        const gameOverPromise = Promise.race([
            waitForGameOver(white.socket),
            waitForGameOver(black.socket),
        ]);

        const moves = [
            'e4', 'e5', 'Nf3', 'd6', 'd4', 'Bg4', 'dxe5', 'Bxf3',
            'Qxf3', 'dxe5', 'Bc4', 'Nf6', 'Qb3', 'Qe7', 'Nc3', 'c6',
            'Bg5', 'b5', 'Nxb5', 'cxb5', 'Bxb5+', 'Nbd7', 'O-O-O', 'Rd8',
            'Rxd7', 'Rxd7', 'Rd1', 'Qe6', 'Bxd7+', 'Nxd7', 'Qb8+', 'Nxb8',
            'Rd8' // Checkmate
        ];

        try {
            for (let i = 0; i < moves.length; i++) {
                const isWhiteTurn = i % 2 === 0;
                const player = isWhiteTurn ? white : black;
                await makeMove(player.socket, moves[i]);
            }

            const result = await gameOverPromise;

            expect(result.reason).toBe('checkmate');
            expect(result.winner).toBe(white.color); // White wins in this sequence
        } finally {
            white.socket.disconnect();
            black.socket.disconnect();
        }
    });

});