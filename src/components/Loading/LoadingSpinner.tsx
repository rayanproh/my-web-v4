import React from 'react';
import { MessageCircle, Users, Zap, Shield, Sparkles } from 'lucide-react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--aura-bg-primary)' }}>
      {/* Animated Aurora Background */}
      <div className="absolute inset-0 aura-aurora-bg"></div>

      <div className="relative z-10 text-center">
        {/* Premium Logo with Aura Design */}
        <div className="relative inline-block mb-12">
          <div className="w-40 h-40 aura-glass rounded-3xl flex items-center justify-center shadow-2xl aura-animate-float aura-glow-magenta">
            <span className="aura-gradient-text font-bold text-6xl">N</span>
          </div>
          <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center aura-animate-pulse">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        
        {/* Brand */}
        <h1 className="text-7xl font-bold aura-gradient-text mb-8 aura-animate-fade-in">
          Nokiatis
        </h1>
        
        {/* Loading animation */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="w-6 h-6 bg-purple-500 rounded-full aura-animate-pulse"></div>
          <div className="w-6 h-6 bg-cyan-500 rounded-full aura-animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-6 h-6 bg-magenta-500 rounded-full aura-animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        {/* Status */}
        <p className="text-3xl text-gray-300 font-medium mb-12 aura-animate-slide-in">
          Loading your conversations...
        </p>
        
        {/* Feature highlights with Aura styling */}
        <div className="flex items-center justify-center gap-12 text-gray-400 mb-12">
          <div className="flex items-center gap-3 group hover:text-purple-300 transition-all duration-300 aura-animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg">Real-time Chat</span>
          </div>
          <div className="flex items-center gap-3 group hover:text-cyan-300 transition-all duration-300 aura-animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Users className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg">Group Conversations</span>
          </div>
          <div className="flex items-center gap-3 group hover:text-yellow-300 transition-all duration-300 aura-animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Zap className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg">Lightning Fast</span>
          </div>
          <div className="flex items-center gap-3 group hover:text-green-300 transition-all duration-300 aura-animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Shield className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
            <span className="text-lg">Secure</span>
          </div>
        </div>
        
        {/* Progress bar with Aura styling */}
        <div className="w-96 aura-glass rounded-full h-3 mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-cyan-500 to-magenta-500 rounded-full animate-pulse"></div>
        </div>
        
        {/* Loading tips */}
        <div className="mt-12 text-gray-400 text-lg aura-animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p>💡 Tip: Use @ to mention users in group chats</p>
        </div>
      </div>
    </div>
  );
};