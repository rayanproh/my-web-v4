import React, { useState, lazy, Suspense } from 'react';

// Lazy load auth components for better performance
const LoginForm = lazy(() => import('../components/Auth/LoginForm').then(module => ({ default: module.LoginForm })));
const SignupForm = lazy(() => import('../components/Auth/SignupForm').then(module => ({ default: module.SignupForm })));

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--aura-bg-primary)' }}>
      {/* Animated Aurora Background */}
      <div className="absolute inset-0 aura-aurora-bg"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12 aura-animate-fade-in">
          <div className="w-20 h-20 aura-glass rounded-3xl flex items-center justify-center mx-auto mb-6 aura-glow-magenta aura-animate-float">
            <span className="aura-gradient-text font-bold text-3xl">N</span>
          </div>
          <h1 className="text-5xl font-bold aura-gradient-text mb-4">Nokiatis</h1>
          <p className="text-gray-400 text-xl">Connect, chat, and collaborate seamlessly</p>
        </div>

        <Suspense fallback={
          <div className="aura-modal p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-6 aura-skeleton w-3/4"></div>
              <div className="h-12 aura-skeleton"></div>
              <div className="h-12 aura-skeleton"></div>
              <div className="h-12 aura-skeleton"></div>
            </div>
          </div>
        }>
          {isLogin ? (
            <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </Suspense>
      </div>
    </div>
  );
};