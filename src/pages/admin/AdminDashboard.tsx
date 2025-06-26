import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { 
  Shield, Users, CreditCard, Settings, LogOut, 
  Check, X, Upload, Eye, TrendingUp, GamepadIcon 
} from 'lucide-react';

// Update this to your Render backend URL
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-app-name.onrender.com/api'  // Replace with your actual Render URL
  : 'http://localhost:3001/api';

const AdminDashboard = () => {
  const { admin, adminLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    pendingPayments: 0,
    totalRevenue: 0
  });
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentDetails, setPaymentDetails] = useState({ qrImage: '', upiId: '' });
  const [uploadForm, setUploadForm] = useState({ upiId: '', qrImage: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'payments') fetchPayments();
    if (activeTab === 'settings') fetchPaymentDetails();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/payments`);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchPaymentDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/payment-details`);
      setPaymentDetails(response.data);
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const handlePaymentStatus = async (paymentId: string, status: string, adminNotes = '') => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/admin/payments/${paymentId}/status`, {
        status,
        adminNotes
      });
      fetchPayments();
      alert(`Payment ${status} successfully!`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('upiId', uploadForm.upiId);
      if (uploadForm.qrImage) {
        formData.append('qrImage', uploadForm.qrImage);
      }

      await axios.post(`${API_URL}/admin/payment-details`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Payment details updated successfully!');
      fetchPaymentDetails();
      setUploadForm({ upiId: '', qrImage: null });
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error updating payment details');
    } finally {
      setLoading(false);
    }
  };

  // Get the base URL for images (without /api)
  const getImageUrl = (imagePath: string) => {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://your-backend-app-name.onrender.com'  // Replace with your actual Render URL
      : 'http://localhost:3001';
    return `${baseUrl}/uploads/${imagePath}`;
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <Users className="h-12 w-12 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Games</p>
              <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
            </div>
            <GamepadIcon className="h-12 w-12 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Pending Payments</p>
              <p className="text-3xl font-bold text-white">{stats.pendingPayments}</p>
            </div>
            <CreditCard className="h-12 w-12 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Revenue</p>
              <p className="text-3xl font-bold text-white">₹{stats.totalRevenue}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <p className="text-gray-400">Dashboard overview and recent activities will be displayed here.</p>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-6">All Users</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left text-gray-400 pb-3">Name</th>
              <th className="text-left text-gray-400 pb-3">Email</th>
              <th className="text-left text-gray-400 pb-3">Wallet Balance</th>
              <th className="text-left text-gray-400 pb-3">Games Played</th>
              <th className="text-left text-gray-400 pb-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user: any) => (
              <tr key={user._id} className="border-b border-white/10">
                <td className="py-3 text-white">{user.name}</td>
                <td className="py-3 text-gray-300">{user.email}</td>
                <td className="py-3 text-yellow-400 font-bold">₹{user.walletBalance}</td>
                <td className="py-3 text-white">{user.totalGamesPlayed}</td>
                <td className="py-3 text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-6">Payment Requests</h3>
      <div className="space-y-4">
        {payments.map((payment: any) => (
          <div key={payment._id} className="bg-white/5 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h4 className="text-white font-bold">{payment.userId?.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payment.type === 'deposit' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {payment.type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payment.status === 'pending' 
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : payment.status === 'approved'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {payment.status}
                  </span>
                </div>
                <p className="text-gray-300">Amount: ₹{payment.amount}</p>
                <p className="text-gray-400 text-sm">UPI ID: {payment.upiId}</p>
                {payment.transactionId && (
                  <p className="text-gray-400 text-sm">Transaction ID: {payment.transactionId}</p>
                )}
                <p className="text-gray-400 text-sm">
                  {new Date(payment.createdAt).toLocaleString()}
                </p>
              </div>
              
              {payment.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePaymentStatus(payment._id, 'approved')}
                    disabled={loading}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handlePaymentStatus(payment._id, 'rejected', 'Rejected by admin')}
                    disabled={loading}
                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {payment.screenshot && (
                    <button
                      onClick={() => window.open(getImageUrl(`payments/${payment.screenshot}`), '_blank')}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-6">Payment Settings</h3>
        
        {/* Current Payment Details */}
        {paymentDetails.qrImage && (
          <div className="mb-6">
            <h4 className="text-lg font-bold text-white mb-4">Current Payment Details</h4>
            <div className="flex items-start space-x-6">
              <img 
                src={getImageUrl(paymentDetails.qrImage)}
                alt="Current QR Code"
                className="w-32 h-32 rounded-lg"
              />
              <div>
                <p className="text-gray-300">UPI ID: {paymentDetails.upiId}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload New Details */}
        <form onSubmit={handleUploadPaymentDetails} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">UPI ID</label>
            <input
              type="text"
              value={uploadForm.upiId}
              onChange={(e) => setUploadForm({...uploadForm, upiId: e.target.value})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
              placeholder="Enter UPI ID"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">QR Code Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setUploadForm({...uploadForm, qrImage: e.target.files?.[0] || null})}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center space-x-2"
          >
            <Upload className="h-5 w-5" />
            <span>{loading ? 'Updating...' : 'Update Payment Details'}</span>
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-red-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-gray-300">Welcome, {admin?.name}</p>
            </div>
          </div>
          <button
            onClick={adminLogout}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-2 mb-6 border border-white/20">
        <div className="flex space-x-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'payments' && renderPayments()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default AdminDashboard;
