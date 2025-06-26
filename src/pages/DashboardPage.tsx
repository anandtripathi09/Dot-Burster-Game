import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  Target, Wallet, Trophy, Clock, Users, Plus, 
  Play, History, LogOut, Upload, CreditCard, Crown 
} from 'lucide-react';

// Update this to your Render backend URL
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app-name.onrender.com/api'  // Replace with your actual Render URL
  : 'http://localhost:3001/api';

const DashboardPage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeGames, setActiveGames] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [recentWinners, setRecentWinners] = useState([]);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({ qrImage: '', upiId: '' });
  const [depositForm, setDepositForm] = useState({
    amount: '',
    transactionId: '',
    upiId: '',
    screenshot: null
  });
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    upiId: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveGames();
    fetchGameHistory();
    fetchPaymentDetails();
    fetchRecentWinners();
    
    // Refresh data every 5 seconds
    const interval = setInterval(() => {
      fetchActiveGames();
      fetchRecentWinners();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchActiveGames = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/active`);
      // Show only 3 active games
      setActiveGames(response.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching active games:', error);
    }
  };

  const fetchGameHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/history`);
      setGameHistory(response.data);
    } catch (error) {
      console.error('Error fetching game history:', error);
    }
  };

  const fetchRecentWinners = async () => {
    try {
      const response = await axios.get(`${API_URL}/game/recent-winners`);
      setRecentWinners(response.data);
    } catch (error) {
      console.error('Error fetching recent winners:', error);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/payment/details`);
      setPaymentDetails(response.data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const handleDemoPlay = async () => {
    if (user?.demoPlayed) {
      alert('Demo already played!');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/game/demo`);
      updateUser({ walletBalance: response.data.walletBalance, demoPlayed: true });
      alert(response.data.message);
      navigate('/game?demo=true');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Demo play failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('amount', depositForm.amount);
      formData.append('transactionId', depositForm.transactionId);
      formData.append('upiId', depositForm.upiId);
      if (depositForm.screenshot) {
        formData.append('screenshot', depositForm.screenshot);
      }

      await axios.post(`${API_URL}/payment/deposit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Deposit request submitted successfully!');
      setShowDepositModal(false);
      setDepositForm({ amount: '', transactionId: '', upiId: '', screenshot: null });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Deposit request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API_URL}/payment/withdraw`, withdrawForm);
      alert('Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: '', upiId: '' });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  const gameConfigs = {
    1: { maxPlayers: 3, entryFee: 30, prize: 70, name: 'Quick Battle' },
    2: { maxPlayers: 5, entryFee: 50, prize: 200, name: 'Standard' },
    3: { maxPlayers: 8, entryFee: 80, prize: 540, name: 'Championship' }
  };

  // Get the base URL for images (without /api)
  const getImageUrl = (imagePath: string) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-backend-app-name.onrender.com'  // Replace with your actual Render URL
      : 'http://localhost:3001';
    return `${baseUrl}/uploads/${imagePath}`;
  };

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Target className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome, {user?.name}!</h1>
              <p className="text-gray-300">Ready to test your reflexes?</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-400/20 px-4 py-2 rounded-lg border border-yellow-400/30">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-yellow-400" />
                <span className="text-white font-bold">₹{user?.walletBalance || 0}</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Demo Play Section */}
          {!user?.demoPlayed && (
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-6 border border-green-400/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Try Demo Play!</h3>
                  <p className="text-gray-300 mb-4">
                    Get ₹100 demo credit to understand the game before playing with real money.
                  </p>
                </div>
                <button
                  onClick={handleDemoPlay}
                  disabled={loading}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all disabled:opacity-50 flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Play Demo</span>
                </button>
              </div>
            </div>
          )}

          {/* Game Modes */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Users className="h-6 w-6 mr-2 text-yellow-400" />
              Game Modes
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {Object.entries(gameConfigs).map(([mode, config]) => (
                <div key={mode} className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-yellow-400/50 transition-all group">
                  <h3 className="text-lg font-bold text-white mb-2">{config.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Players:</span>
                      <span className="text-white">{config.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry:</span>
                      <span className="text-white">₹{config.entryFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Prize:</span>
                      <span className="text-yellow-400 font-bold">₹{config.prize}</span>
                    </div>
                  </div>
                  <Link
                    to={`/game?mode=${mode}`}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all mt-4 block text-center group-hover:scale-105 transform duration-200"
                  >
                    Join Game
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Active Games - Limited to 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-yellow-400" />
              Active Games
            </h2>
            {activeGames.length > 0 ? (
              <div className="space-y-3">
                {activeGames.map((game: any) => (
                  <div key={game._id} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-white font-bold">{gameConfigs[game.mode as keyof typeof gameConfigs]?.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {game.players.length}/{gameConfigs[game.mode as keyof typeof gameConfigs]?.maxPlayers} players
                      </p>
                    </div>
                    <span className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
                      {game.status === 'waiting' ? 'Waiting' : 'In Progress'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No active games at the moment</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Winners */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Crown className="h-5 w-5 mr-2 text-yellow-400" />
              Recent Winners
            </h3>
            {recentWinners.length > 0 ? (
              <div className="space-y-3">
                {recentWinners.map((winner: any, index: number) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-bold text-sm">{winner.userName}</p>
                        <p className="text-gray-400 text-xs">
                          {gameConfigs[winner.mode as keyof typeof gameConfigs]?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-yellow-400 font-bold text-sm">₹{winner.prize}</p>
                        <p className="text-gray-400 text-xs">{winner.taps} taps</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No recent winners</p>
            )}
          </div>

          {/* Wallet Actions */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-yellow-400" />
              Wallet Actions
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Money</span>
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!user || user.walletBalance < 400}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>Withdraw</span>
              </button>
            </div>
            {user && user.walletBalance < 400 && (
              <p className="text-yellow-400 text-xs mt-2">
                Minimum ₹400 required for withdrawal
              </p>
            )}
          </div>

          {/* Game Stats */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
              Your Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Games Played:</span>
                <span className="text-white font-bold">{user?.totalGamesPlayed || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Wins:</span>
                <span className="text-green-400 font-bold">{user?.totalWins || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Win Rate:</span>
                <span className="text-yellow-400 font-bold">
                  {user?.totalGamesPlayed ? Math.round((user.totalWins / user.totalGamesPlayed) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Recent Games */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <History className="h-5 w-5 mr-2 text-yellow-400" />
              Recent Games
            </h3>
            {gameHistory.length > 0 ? (
              <div className="space-y-2">
                {gameHistory.slice(0, 5).map((game: any) => (
                  <div key={game._id} className="bg-white/5 rounded-lg p-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">
                        {gameConfigs[game.mode as keyof typeof gameConfigs]?.name}
                      </span>
                      <span className={`font-bold ${
                        game.winner?.userId === user?.id ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {game.winner?.userId === user?.id ? 'Won' : 'Lost'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No games played yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Add Money to Wallet</h3>
            
            {paymentDetails.qrImage && (
              <div className="mb-4 text-center">
                <img 
                  src={getImageUrl(paymentDetails.qrImage)}
                  alt="Payment QR Code"
                  className="w-48 h-48 mx-auto rounded-lg"
                />
                <p className="text-gray-300 mt-2">UPI ID: {paymentDetails.upiId}</p>
              </div>
            )}

            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (Min ₹100)</label>
                <input
                  type="number"
                  min="100"
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({...depositForm, amount: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Transaction ID</label>
                <input
                  type="text"
                  value={depositForm.transactionId}
                  onChange={(e) => setDepositForm({...depositForm, transactionId: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your UPI ID</label>
                <input
                  type="text"
                  value={depositForm.upiId}
                  onChange={(e) => setDepositForm({...depositForm, upiId: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Screenshot</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setDepositForm({...depositForm, screenshot: e.target.files?.[0] || null})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-md border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Withdraw Money</h3>
            
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  min="1"
                  max={user?.walletBalance || 0}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
                <p className="text-gray-400 text-sm mt-1">Available: ₹{user?.walletBalance || 0}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Your UPI ID</label>
                <input
                  type="text"
                  value={withdrawForm.upiId}
                  onChange={(e) => setWithdrawForm({...withdrawForm, upiId: e.target.value})}
                  className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
