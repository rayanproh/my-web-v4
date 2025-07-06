import React, { useState } from 'react';
import { X, Users, ArrowRight } from 'lucide-react';
import { joinGroupByInvite } from '../../services/groupService';
import { useAuthContext } from '../../contexts/AuthContext';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupJoined: (groupId: string) => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupJoined
}) => {
  const { user } = useAuthContext();
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !inviteCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const groupId = await joinGroupByInvite(inviteCode.trim(), user.uid);
      onGroupJoined(groupId);
      setInviteCode('');
    } catch (error: any) {
      setError(error.message || 'Failed to join server');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInviteCode('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 aura-modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="aura-modal w-full max-w-md aura-animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-cyan-500/20 to-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 aura-glass rounded-xl flex items-center justify-center aura-glow-cyan">
                <Users className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Join a Server</h2>
                <p className="text-cyan-200 text-sm">Enter an invite below to join an existing server</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 aura-animate-slide-in">
              <p className="text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Invite Code */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Invite Link or Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="aura-input w-full"
              placeholder="Enter invite code (e.g., abc123XY)"
              required
            />
            <p className="text-xs text-gray-400 mt-2">
              Invites look like: <code className="aura-code">abc123XY</code>
            </p>
          </div>

          {/* Example */}
          <div className="aura-glass rounded-xl p-4 border border-cyan-500/30">
            <h3 className="text-sm font-semibold text-cyan-300 mb-2">
              Don't have an invite?
            </h3>
            <p className="text-cyan-200 text-sm">
              Ask a friend to send you an invite link, or create your own server to get started!
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !inviteCode.trim()}
            className="aura-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Joining Server...
              </>
            ) : (
              <>
                Join Server
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};