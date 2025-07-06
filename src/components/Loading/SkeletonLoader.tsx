import React from 'react';

interface SkeletonLoaderProps {
  type: 'chatList' | 'chatWindow' | 'sidebar';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type }) => {
  if (type === 'chatList') {
    return (
      <div className="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-xl">
        {/* Header Skeleton */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-lg w-20 skeleton"></div>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-xl skeleton"></div>
          </div>
          <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl skeleton"></div>
        </div>

        {/* Chat Items Skeleton */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-700 dark:to-blue-700 rounded-2xl flex-shrink-0 skeleton"></div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-24 skeleton"></div>
                  <div className="h-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-12 skeleton"></div>
                </div>
                <div className="h-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-32 skeleton"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chatWindow') {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Header Skeleton */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 p-6 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-700 dark:to-blue-700 rounded-2xl skeleton"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-24 skeleton"></div>
              <div className="h-3 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-16 skeleton"></div>
            </div>
          </div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-10 h-10 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-xl skeleton"></div>
            ))}
          </div>
        </div>

        {/* Messages Skeleton */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} animate-fade-in`} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className={`max-w-xs p-4 rounded-2xl space-y-2 shadow-lg ${
                i % 2 === 0 
                  ? 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600' 
                  : 'bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800'
              } skeleton`}>
                <div className="h-4 bg-white/50 dark:bg-gray-800/50 rounded w-32"></div>
                <div className="h-4 bg-white/50 dark:bg-gray-800/50 rounded w-24"></div>
                <div className="h-3 bg-white/50 dark:bg-gray-800/50 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Skeleton */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-10 h-10 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-xl skeleton"></div>
              ))}
            </div>
            <div className="flex-1 h-12 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl skeleton"></div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-300 to-blue-300 dark:from-purple-700 dark:to-blue-700 rounded-2xl skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'sidebar') {
    return (
      <div className="w-80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-700/50 flex flex-col shadow-xl">
        {/* Header Skeleton */}
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded w-20 skeleton"></div>
            <div className="w-8 h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg skeleton"></div>
          </div>
        </div>

        {/* Profile Section Skeleton */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="w-32 h-32 bg-gradient-to-br from-purple-300 to-blue-300 dark:from-purple-700 dark:to-blue-700 rounded-2xl mx-auto skeleton"></div>
            <div className="h-6 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-32 mx-auto skeleton"></div>
            <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-20 mx-auto skeleton"></div>
          </div>

          {/* Form Fields Skeleton */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-500 rounded w-24 skeleton"></div>
              <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-xl skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};