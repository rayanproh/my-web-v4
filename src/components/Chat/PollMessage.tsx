import React, { useState } from 'react';
import { BarChart3, Users, Check } from 'lucide-react';
import { Poll, PollVote } from '../../types';
import { useAuthContext } from '../../contexts/AuthContext';

interface PollMessageProps {
  poll: Poll;
  onVote: (optionIndex: number) => void;
}

export const PollMessage: React.FC<PollMessageProps> = ({ poll, onVote }) => {
  const { user } = useAuthContext();
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  const userVotes = poll.votes.filter(vote => vote.userId === user?.uid);
  const hasVoted = userVotes.length > 0;
  const totalVotes = poll.votes.length;

  const getOptionVotes = (optionIndex: number) => {
    return poll.votes.filter(vote => vote.optionIndex === optionIndex).length;
  };

  const getOptionPercentage = (optionIndex: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((getOptionVotes(optionIndex) / totalVotes) * 100);
  };

  const handleOptionToggle = (optionIndex: number) => {
    if (hasVoted) return;

    if (poll.allowMultiple) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex)
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
      onVote(optionIndex);
    }
  };

  const handleSubmitVote = () => {
    selectedOptions.forEach(optionIndex => {
      onVote(optionIndex);
    });
    setSelectedOptions([]);
  };

  const isOptionSelected = (optionIndex: number) => {
    return hasVoted 
      ? userVotes.some(vote => vote.optionIndex === optionIndex)
      : selectedOptions.includes(optionIndex);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Poll</span>
      </div>

      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
        {poll.question}
      </h4>

      <div className="space-y-2 mb-4">
        {poll.options.map((option, index) => {
          const votes = getOptionVotes(index);
          const percentage = getOptionPercentage(index);
          const isSelected = isOptionSelected(index);

          return (
            <button
              key={index}
              onClick={() => handleOptionToggle(index)}
              disabled={hasVoted}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
              } ${hasVoted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  <span className="text-sm text-gray-900 dark:text-gray-100">{option}</span>
                </div>
                {hasVoted && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {percentage}%
                  </span>
                )}
              </div>
              
              {hasVoted && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!hasVoted && poll.allowMultiple && selectedOptions.length > 0 && (
        <button
          onClick={handleSubmitVote}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Submit Vote
        </button>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        </div>
        {poll.allowMultiple && (
          <span>Multiple choices allowed</span>
        )}
      </div>
    </div>
  );
};