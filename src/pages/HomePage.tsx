import React from 'react';
import { Link } from 'react-router-dom';
import { Target, Zap, Trophy, Shield, Users, Clock, Settings } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Dot Burster</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-white hover:text-yellow-400 transition-colors">
              Login
            </Link>
            <Link to="/register" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105">
              Sign Up
            </Link>
            {/* Admin Access Button */}
            <Link 
              to="/admin/login" 
              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              title="Admin Login"
            >
              <Settings className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold text-white mb-6 leading-tight">
            India's Legal
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"> Reflex Game</span>
            <br />
            For Real Money!
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Test your reflexes, win real cash! Tap the moving green dot as fast as you can in this skill-based gaming experience. 
            Legal, secure, and exciting gameplay awaits.
          </p>
          <div className="flex justify-center">
            <Link to="/register" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-8 py-4 rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
              Start Playing Now
            </Link>
          </div>
        </div>
      </section>

      {/* Game Modes */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Game Modes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { players: 3, entry: 30, prize: 70, mode: "Quick Battle" },
              { players: 5, entry: 50, prize: 200, mode: "Standard" },
              { players: 8, entry: 80, prize: 540, mode: "Championship" }
            ].map((mode, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-yellow-400/50 transition-all duration-300 group">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{mode.mode}</h3>
                  <p className="text-gray-300 mb-4">{mode.players} Players</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry Fee:</span>
                      <span className="text-white font-bold">₹{mode.entry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Winner Gets:</span>
                      <span className="text-yellow-400 font-bold">₹{mode.prize}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Join Game", desc: "Choose your mode and join with other players" },
              { icon: Clock, title: "3s Countdown", desc: "Get ready as the game starts with a countdown" },
              { icon: Target, title: "Tap the Dot", desc: "Tap the green dot as fast as possible for 10 seconds" },
              { icon: Trophy, title: "Win Money", desc: "Player with most taps wins the prize money!" }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-gray-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">Why Choose Dot Burster?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "100% Legal", desc: "Skill-based gaming compliant with Indian laws" },
              { icon: Zap, title: "Instant Payouts", desc: "Quick withdrawals and secure transactions" },
              { icon: Trophy, title: "Fair Play", desc: "Transparent gameplay with real-time results" }
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 text-center hover:border-yellow-400/50 transition-all duration-300">
                <feature.icon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Test Your Reflexes?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of players and start winning real money today!</p>
          <Link to="/register" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-8 py-4 rounded-full hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2024 Dot Burster. Skill-based gaming platform. Play responsibly.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
