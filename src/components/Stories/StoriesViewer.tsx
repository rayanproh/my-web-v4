import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react';
import { Story } from '../../types';

interface StoriesViewerProps {
  stories: Story[];
  initialStoryIndex: number;
  onClose: () => void;
}

export const StoriesViewer: React.FC<StoriesViewerProps> = ({ 
  stories, 
  initialStoryIndex, 
  onClose 
}) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const currentStory = stories[currentStoryIndex];
  const storyDuration = 5000; // 5 seconds per story

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Move to next story
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, stories.length, isPaused, onClose]);

  const goToPrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleReaction = () => {
    // Implement story reaction logic
    console.log('Story reaction');
  };

  const handleReply = () => {
    // Implement story reply logic
    console.log('Story reply');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-gray-600 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: index < currentStoryIndex ? '100%' : 
                       index === currentStoryIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img
            src={currentStory.user.photoURL || `https://ui-avatars.com/api/?name=${currentStory.user.displayName}&background=3b82f6&color=fff`}
            alt={currentStory.user.displayName}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div>
            <p className="text-white font-semibold">{currentStory.user.displayName}</p>
            <p className="text-gray-300 text-sm">
              {new Date(currentStory.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Story content */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {currentStory.type === 'image' ? (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            src={currentStory.mediaUrl}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            loop
          />
        )}

        {currentStory.text && (
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-lg font-medium text-center bg-black bg-opacity-50 p-4 rounded-lg">
              {currentStory.text}
            </p>
          </div>
        )}

        {/* Navigation areas */}
        <button
          onClick={goToPrevious}
          className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-start pl-4 text-white opacity-0 hover:opacity-100 transition-opacity"
          disabled={currentStoryIndex === 0}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-end pr-4 text-white opacity-0 hover:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Bottom actions */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 z-10">
        <div className="flex-1 bg-gray-800 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="Reply to story..."
            className="w-full bg-transparent text-white placeholder-gray-400 outline-none"
            onFocus={handleReply}
          />
        </div>
        
        <button
          onClick={handleReaction}
          className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
        >
          <Heart className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};