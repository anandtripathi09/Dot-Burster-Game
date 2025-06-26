import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Target, Trophy, Users, Clock, CheckCircle, X } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const GamePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { socket } = useSocket();
  
  const mode = parseInt(searchParams.get('mode') || '1');
  const isDemo = searchParams.get('demo') === 'true';
  
  const [gameState, setGameState] = useState<'waiting' | 'terms' | 'countdown' | 'playing' | 'finished'>('terms');
  const [players, setPlayers] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [taps, setTaps] = useState(0);
  const [dotPosition, setDotPosition] = useState({ x: 50, y: 50 });
  const [results, setResults] = useState<any[]>([]);
  const [winner, setWinner] = useState<any>(null);
  const [nextRoundCountdown, setNextRoundCountdown] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showCancelButton, setShowCancelButton] = useState(false);
  const [waitingTimer, setWaitingTimer] = useState(60);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeProposal, setMergeProposal] = useState<any>(null);
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const dotMoveInterval = useRef<NodeJS.Timeout>();
  const gameTimer = useRef<NodeJS.Timeout>();
  const waitingTimeout = useRef<NodeJS.Timeout>();

  const gameConfigs = {
    1: { maxPlayers: 3, entryFee: 30, prize: 70, name: 'Quick Battle' },
    2: { maxPlayers: 5, entryFee: 50, prize: 200, name: 'Standard' },
    3: { maxPlayers: 8, entryFee: 80, prize: 540, name: 'Championship' }
  };

  const config = gameConfigs[mode as keyof typeof gameConfigs];

  useEffect(() => {
    if (!user || !socket) return;

    // Socket event listeners
    socket.on('game-updated', (data) => {
      setPlayers(data.players);
      if (data.status === 'waiting') {
        setGameState('waiting');
        // Show cancel button after 5 seconds
        setTimeout(() => setShowCancelButton(true), 5000);
        
        // Start 60-second waiting timer
        setWaitingTimer(60);
        waitingTimeout.current = setInterval(() => {
          setWaitingTimer(prev => {
            if (prev <= 1) {
              // Auto-cancel if not enough players
              handleCancelGame();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    });

    socket.on('game-countdown', (data) => {
      setGameState('countdown');
      setCountdown(data.countdown);
      clearInterval(waitingTimeout.current);
    });

    socket.on('game-started', () => {
      setGameState('playing');
      setGameTime(10);
      startGame();
    });

    socket.on('game-ended', (data) => {
      setGameState('finished');
      setResults(data.results);
      setWinner(data.winner);
      clearInterval(dotMoveInterval.current);
      clearInterval(gameTimer.current);
    });

    socket.on('game-cancelled', (data) => {
      alert(data.message);
      navigate('/dashboard');
    });

    socket.on('merge-proposal', (data) => {
      setMergeProposal(data);
      setShowMergeModal(true);
    });

    socket.on('next-round', (data) => {
      setNextRoundCountdown(data.countdown);
      const interval = setInterval(() => {
        setNextRoundCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    return () => {
      socket.off('game-updated');
      socket.off('game-countdown');
      socket.off('game-started');
      socket.off('game-ended');
      socket.off('game-cancelled');
      socket.off('merge-proposal');
      socket.off('next-round');
      clearInterval(waitingTimeout.current);
    };
  }, [socket, user]);

  const startGame = () => {
    moveDot();
    
    // Game timer
    gameTimer.current = setInterval(() => {
      setGameTime(prev => {
        if (prev <= 1) {
          clearInterval(gameTimer.current);
          clearInterval(dotMoveInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Dot movement with increasing speed
    let currentSpeed = 1000;
    dotMoveInterval.current = setInterval(() => {
      moveDot();
      currentSpeed = Math.max(300, currentSpeed - 70);
      clearInterval(dotMoveInterval.current);
      dotMoveInterval.current = setInterval(moveDot, currentSpeed);
    }, 1000);
  };

  const moveDot = () => {
    if (!gameAreaRef.current) return;
    
    const area = gameAreaRef.current.getBoundingClientRect();
    const dotSize = 50;
    
    const maxX = 100 - (dotSize / area.width) * 100;
    const maxY = 100 - (dotSize / area.height) * 100;
    
    setDotPosition({
      x: Math.random() * maxX,
      y: Math.random() * maxY
    });
  };

  const handleDotTap = () => {
    if (gameState !== 'playing') return;
    
    setTaps(prev => prev + 1);
    
    if (socket && !isDemo) {
      socket.emit('game-tap', {
        userId: user?.id,
        gameId: 'current-game-id'
      });
    }
    
    moveDot();
  };

  const handleCancelGame = () => {
    if (socket) {
      socket.emit('cancel-game', { userId: user?.id });
    }
    navigate('/dashboard');
  };

  const handleMergeResponse = (accept: boolean) => {
    if (socket) {
      socket.emit('merge-response', { 
        userId: user?.id, 
        accept,
        proposalId: mergeProposal?.id 
      });
    }
    setShowMergeModal(false);
  };

  const joinGame = () => {
    if (!acceptedTerms) {
      alert('Please accept the Terms & Conditions to continue');
      return;
    }

    if (isDemo) {
      // Start demo game directly
      setGameState('countdown');
      setCountdown(3);
      
      setTimeout(() => setCountdown(2), 1000);
      setTimeout(() => setCountdown(1), 2000);
      setTimeout(() => {
        setGameState('playing');
        setGameTime(10);
        startGame();
        
        // Auto-end demo game after 10 seconds
        setTimeout(async () => {
          setGameState('finished');
          setWinner({ userName: user?.name, taps, prize: 0 });
          setResults([{ userName: user?.name, taps, isWinner: true }]);
          clearInterval(dotMoveInterval.current);
          clearInterval(gameTimer.current);
          
          // Remove demo amount after demo completion
          try {
            const response = await axios.post(`${API_URL}/game/demo/complete`);
            updateUser({ walletBalance: response.data.walletBalance });
          } catch (error) {
            console.error('Demo completion error:', error);
          }
        }, 10000);
      }, 3000);
    } else {
      // Join real game
      if (socket && user) {
        socket.emit('join-game', {
          userId: user.id,
          userName: user.name,
          mode
        });
      }
      setGameState('waiting');
    }
  };

  if (gameState === 'terms') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-2xl border border-white/20">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            {isDemo ? 'Demo Game' : `${config.name} - Terms & Conditions`}
          </h2>
          
          {!isDemo && (
            <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-gray-300">Entry Fee</p>
                  <p className="text-2xl font-bold text-white">₹{config.entryFee}</p>
                </div>
                <div>
                  <p className="text-gray-300">Winner Prize</p>
                  <p className="text-2xl font-bold text-yellow-400">₹{config.prize}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Game Rules</h3>
            <ul className="text-gray-300 space-y-2">
              <li>• Tap the green dot as many times as possible in 10 seconds</li>
              <li>• The dot will move faster as the game progresses</li>
              <li>• Player with the most taps wins the prize money</li>
              <li>• This is a skill-based game under Indian law</li>
              {!isDemo && <li>• Entry fee will be deducted from your wallet</li>}
              <li>• Game will auto-cancel if not enough players join within 60 seconds</li>
            </ul>
          </div>

          <div className="flex items-start space-x-3 mb-6">
            <div className="relative mt-1">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="sr-only"
              />
              <div
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={`w-5 h-5 rounded border-2 cursor-pointer transition-all ${
                  acceptedTerms 
                    ? 'bg-yellow-400 border-yellow-400' 
                    : 'border-gray-400 hover:border-yellow-400'
                }`}
              >
                {acceptedTerms && <CheckCircle className="w-full h-full text-black" />}
              </div>
            </div>
            <label htmlFor="acceptTerms" className="text-sm text-gray-300 cursor-pointer">
              I understand and accept that Dot Burster is a skill-based game under Indian law, 
              and I am 18+ years old playing voluntarily. I understand the risks and rewards 
              of {isDemo ? 'demo' : 'real-money'} gameplay.
            </label>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={joinGame}
              disabled={!acceptedTerms}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDemo ? 'Start Demo' : 'Join Game'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full border border-white/20 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-4">Waiting for Players</h2>
          <p className="text-gray-300 mb-4">
            {players.length}/{config.maxPlayers} players joined
          </p>
          
          {/* Waiting Timer */}
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-red-300 text-sm">Auto-cancel in: {waitingTimer}s</p>
          </div>

          <div className="space-y-2 mb-6">
            {players.map((player, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-2 text-white">
                {player.userName}
              </div>
            ))}
          </div>

          {/* Cancel Button - Shows after 5 seconds */}
          {showCancelButton && (
            <button
              onClick={handleCancelGame}
              className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
            >
              <X className="h-5 w-5" />
              <span>Cancel & Leave</span>
            </button>
          )}
        </div>

        {/* Merge Modal */}
        {showMergeModal && mergeProposal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 max-w-md border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Game Mode Merge</h3>
              <p className="text-gray-300 mb-6">
                Not enough players for your current mode. Would you like to merge with other waiting players 
                to start a {mergeProposal.targetMode} game?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleMergeResponse(true)}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all"
                >
                  Accept Merge
                </button>
                <button
                  onClick={() => handleMergeResponse(false)}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-all"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'countdown') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-8xl font-bold text-yellow-400 mb-4 animate-pulse">
            {countdown}
          </div>
          <p className="text-2xl text-white">Get Ready!</p>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen p-4">
        {/* Game Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 border border-white/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-gray-300">Time Left</p>
                <p className="text-2xl font-bold text-white">{gameTime}s</p>
              </div>
              <div className="text-center">
                <p className="text-gray-300">Your Taps</p>
                <p className="text-2xl font-bold text-yellow-400">{taps}</p>
              </div>
            </div>
            <Target className="h-8 w-8 text-yellow-400" />
          </div>
        </div>

        {/* Game Area */}
        <div className="flex justify-center">
          <div 
            ref={gameAreaRef}
            className="relative w-full max-w-2xl h-96 bg-white/5 rounded-xl border-2 border-white/20 overflow-hidden"
            style={{ aspectRatio: '16/9' }}
          >
            <div
              className="absolute w-12 h-12 bg-green-500 rounded-full cursor-pointer animate-pulse shadow-lg transition-all duration-200 hover:scale-110"
              style={{
                left: `${dotPosition.x}%`,
                top: `${dotPosition.y}%`,
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.6)'
              }}
              onClick={handleDotTap}
            />
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-300">Tap the green dot as fast as you can!</p>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-6">
            <Trophy className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
            
            {winner && (
              <div className="bg-yellow-400/20 border border-yellow-400/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-400 font-bold text-lg">Winner: {winner.userName}</p>
                <p className="text-white">Taps: {winner.taps}</p>
                {winner.prize > 0 && (
                  <p className="text-green-400 font-bold">Prize: ₹{winner.prize}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="text-lg font-bold text-white">Final Results:</h3>
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-3 rounded-lg ${
                  result.isWinner ? 'bg-yellow-400/20' : 'bg-white/5'
                }`}
              >
                <span className="text-white">{result.userName}</span>
                <span className={`font-bold ${result.isWinner ? 'text-yellow-400' : 'text-gray-300'}`}>
                  {result.taps} taps
                </span>
              </div>
            ))}
          </div>

          {nextRoundCountdown > 0 && (
            <div className="text-center mb-4">
              <p className="text-gray-300">Next round in: {nextRoundCountdown}s</p>
            </div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default GamePage;