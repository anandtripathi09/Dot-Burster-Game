export class GameManager {
  constructor(io) {
    this.io = io;
    this.activeGames = new Map();
    this.playerSockets = new Map();
    this.waitingPlayers = new Map(); // Track players waiting for games
    this.gameConfigs = {
      1: { maxPlayers: 3, entryFee: 30, totalPool: 90, platformFee: 20, winnerPrize: 70 },
      2: { maxPlayers: 5, entryFee: 50, totalPool: 250, platformFee: 50, winnerPrize: 200 },
      3: { maxPlayers: 8, entryFee: 80, totalPool: 640, platformFee: 100, winnerPrize: 540 }
    };
  }

  generateGameId() {
    return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async joinGame(socket, { userId, userName, mode }) {
    try {
      const config = this.gameConfigs[mode];
      if (!config) return;

      // Find existing waiting game or create new one
      let game = Array.from(this.activeGames.values()).find(
        g => g.mode === mode && g.status === 'waiting' && g.players.length < config.maxPlayers
      );

      if (!game) {
        game = {
          gameId: this.generateGameId(),
          mode,
          players: [],
          status: 'waiting',
          ...config,
          startTime: null,
          taps: new Map(),
          waitingTimeout: null
        };
        this.activeGames.set(game.gameId, game);
      }

      // Add player to game
      game.players.push({ userId, userName, socketId: socket.id });
      this.playerSockets.set(socket.id, { userId, gameId: game.gameId });
      this.waitingPlayers.set(userId, { gameId: game.gameId, mode, socketId: socket.id });

      socket.join(game.gameId);
      
      // Set 60-second timeout for game cancellation
      if (!game.waitingTimeout) {
        game.waitingTimeout = setTimeout(() => {
          this.handleGameTimeout(game);
        }, 60000);
      }
      
      // Broadcast updated game state
      this.io.to(game.gameId).emit('game-updated', {
        gameId: game.gameId,
        players: game.players,
        status: game.status,
        playersNeeded: config.maxPlayers - game.players.length
      });

      // Start game if full
      if (game.players.length === config.maxPlayers) {
        clearTimeout(game.waitingTimeout);
        this.startGame(game);
      } else {
        // Check for merge opportunities after 30 seconds
        setTimeout(() => {
          if (game.status === 'waiting' && game.players.length < config.maxPlayers) {
            this.checkForMergeOpportunities(game);
          }
        }, 30000);
      }

    } catch (error) {
      console.error('Join game error:', error);
    }
  }

  checkForMergeOpportunities(currentGame) {
    const waitingGames = Array.from(this.activeGames.values())
      .filter(g => g.status === 'waiting' && g.gameId !== currentGame.gameId);

    if (waitingGames.length === 0) return;

    // Find best merge option
    let bestMerge = null;
    let totalPlayers = currentGame.players.length;

    for (const game of waitingGames) {
      const combined = totalPlayers + game.players.length;
      
      // Check if we can fill a game mode
      for (const [mode, config] of Object.entries(this.gameConfigs)) {
        if (combined >= config.maxPlayers) {
          bestMerge = {
            targetMode: parseInt(mode),
            games: [currentGame, game],
            totalPlayers: combined
          };
          break;
        }
      }
      
      if (bestMerge) break;
    }

    if (bestMerge) {
      // Propose merge to all players
      const allPlayers = [...currentGame.players, ...bestMerge.games[1].players];
      allPlayers.forEach(player => {
        this.io.to(player.socketId).emit('merge-proposal', {
          id: `merge_${Date.now()}`,
          targetMode: bestMerge.targetMode,
          currentPlayers: allPlayers.length,
          requiredPlayers: this.gameConfigs[bestMerge.targetMode].maxPlayers
        });
      });
    }
  }

  handleMergeResponse(socket, { userId, accept, proposalId }) {
    // Implementation for handling merge responses
    // This would track responses and execute merge if all players accept
    console.log(`Player ${userId} ${accept ? 'accepted' : 'declined'} merge proposal ${proposalId}`);
  }

  handleGameTimeout(game) {
    // Cancel game and refund players
    this.io.to(game.gameId).emit('game-cancelled', {
      message: 'Game cancelled due to insufficient players. Entry fee refunded.'
    });

    // Remove players from waiting list
    game.players.forEach(player => {
      this.waitingPlayers.delete(player.userId);
      this.playerSockets.delete(player.socketId);
    });

    // Remove game
    this.activeGames.delete(game.gameId);
  }

  handleCancelGame(socket, { userId }) {
    const playerData = this.playerSockets.get(socket.id);
    if (!playerData) return;

    const game = this.activeGames.get(playerData.gameId);
    if (!game || game.status !== 'waiting') return;

    // Remove player from game
    game.players = game.players.filter(p => p.socketId !== socket.id);
    this.waitingPlayers.delete(userId);
    this.playerSockets.delete(socket.id);

    // If no players left, cancel game
    if (game.players.length === 0) {
      clearTimeout(game.waitingTimeout);
      this.activeGames.delete(game.gameId);
    } else {
      // Broadcast updated game state
      this.io.to(game.gameId).emit('game-updated', {
        gameId: game.gameId,
        players: game.players,
        status: game.status
      });
    }

    socket.leave(playerData.gameId);
  }

  async startGame(game) {
    game.status = 'countdown';
    
    // 3-second countdown
    this.io.to(game.gameId).emit('game-countdown', { countdown: 3 });
    
    setTimeout(() => {
      this.io.to(game.gameId).emit('game-countdown', { countdown: 2 });
    }, 1000);

    setTimeout(() => {
      this.io.to(game.gameId).emit('game-countdown', { countdown: 1 });
    }, 2000);

    setTimeout(() => {
      game.status = 'playing';
      game.startTime = new Date();
      
      // Initialize taps for all players
      game.players.forEach(player => {
        game.taps.set(player.userId, 0);
      });

      this.io.to(game.gameId).emit('game-started', {
        gameId: game.gameId,
        duration: 10000 // 10 seconds
      });

      // End game after 10 seconds
      setTimeout(() => {
        this.endGame(game);
      }, 10000);
    }, 3000);
  }

  handleTap(socket, { userId, gameId }) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'playing') return;

    const currentTaps = game.taps.get(userId) || 0;
    game.taps.set(userId, currentTaps + 1);

    // Broadcast tap update
    this.io.to(gameId).emit('tap-update', {
      userId,
      taps: currentTaps + 1
    });
  }

  async endGame(game) {
    game.status = 'finished';
    game.endTime = new Date();
    
    // Calculate winner
    let maxTaps = 0;
    let winner = null;

    game.taps.forEach((taps, userId) => {
      if (taps > maxTaps) {
        maxTaps = taps;
        winner = game.players.find(p => p.userId === userId);
      }
    });

    const results = Array.from(game.taps.entries()).map(([userId, taps]) => {
      const player = game.players.find(p => p.userId === userId);
      return {
        userId,
        userName: player.userName,
        taps,
        isWinner: userId === winner?.userId
      };
    }).sort((a, b) => b.taps - a.taps);

    // Broadcast game results
    this.io.to(game.gameId).emit('game-ended', {
      gameId: game.gameId,
      winner: winner ? {
        userId: winner.userId,
        userName: winner.userName,
        taps: maxTaps,
        prize: game.winnerPrize
      } : null,
      results
    });

    // Clean up player tracking
    game.players.forEach(player => {
      this.waitingPlayers.delete(player.userId);
      this.playerSockets.delete(player.socketId);
    });

    // Schedule next round
    setTimeout(() => {
      this.io.to(game.gameId).emit('next-round', { countdown: 45 });
      
      // Clean up current game after 45 seconds
      setTimeout(() => {
        this.activeGames.delete(game.gameId);
      }, 45000);
    }, 5000);
  }

  handleDisconnect(socket) {
    const playerData = this.playerSockets.get(socket.id);
    if (!playerData) return;

    const game = this.activeGames.get(playerData.gameId);
    if (game) {
      // Remove player from game
      game.players = game.players.filter(p => p.socketId !== socket.id);
      this.waitingPlayers.delete(playerData.userId);
      
      // If game was waiting and now empty, remove it
      if (game.status === 'waiting' && game.players.length === 0) {
        clearTimeout(game.waitingTimeout);
        this.activeGames.delete(game.gameId);
      } else if (game.status === 'waiting') {
        // Broadcast updated game state
        this.io.to(game.gameId).emit('game-updated', {
          gameId: game.gameId,
          players: game.players,
          status: game.status
        });
      }
    }

    this.playerSockets.delete(socket.id);
  }
}