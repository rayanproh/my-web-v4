import React, { useState, Suspense, lazy } from 'react';
import { Plus, Hash, Volume2, Crown, Shield, User as UserIcon, Settings, Mic, MicOff, Headphones, Headphones as HeadphonesOff, Users, Bell, Search, Pin, HelpCircle } from 'lucide-react';
import { Group, Channel, GroupMember } from '../../types/groups';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { signOut } from '../../services/authService';
import { getUserGroups, getGroupChannels, getGroupMembers } from '../../services/groupService';

// Lazy load modals
const CreateGroupModal = lazy(() => import('../Groups/CreateGroupModal').then(module => ({ default: module.CreateGroupModal })));
const JoinGroupModal = lazy(() => import('../Groups/JoinGroupModal').then(module => ({ default: module.JoinGroupModal })));
const CreateChannelModal = lazy(() => import('../Groups/CreateChannelModal').then(module => ({ default: module.CreateChannelModal })));
const InviteModal = lazy(() => import('../Groups/InviteModal').then(module => ({ default: module.InviteModal })));

export const AuraLayout: React.FC = () => {
  const { user, userData } = useAuthContext();
  const { isDark, toggleTheme } = useTheme();
  
  // State management
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showMemberList, setShowMemberList] = useState(true);
  
  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // User states
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Load user groups
  React.useEffect(() => {
    if (!user) return;

    const unsubscribe = getUserGroups(user.uid, (userGroups) => {
      setGroups(userGroups);
      
      // Auto-select first group if none selected
      if (userGroups.length > 0 && !selectedGroup) {
        setSelectedGroup(userGroups[0]);
      }
    });

    return () => unsubscribe();
  }, [user, selectedGroup]);

  // Load channels and members for selected group
  React.useEffect(() => {
    if (!selectedGroup) return;

    const unsubscribeChannels = getGroupChannels(selectedGroup.id, (groupChannels) => {
      setChannels(groupChannels);
      
      // Auto-select first text channel if none selected
      if (groupChannels.length > 0 && !selectedChannel) {
        const firstTextChannel = groupChannels.find(c => c.type === 'text');
        if (firstTextChannel) {
          setSelectedChannel(firstTextChannel);
        }
      }
    });

    const unsubscribeMembers = getGroupMembers(selectedGroup.id, setMembers);

    return () => {
      unsubscribeChannels();
      unsubscribeMembers();
    };
  }, [selectedGroup, selectedChannel]);

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setSelectedChannel(null); // Reset channel selection
  };

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const currentUserMember = members.find(m => m.userId === user?.uid);
  const canManageChannels = currentUserMember && ['owner', 'admin'].includes(currentUserMember.role);
  const canInvite = currentUserMember && ['owner', 'admin', 'moderator'].includes(currentUserMember.role);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3 text-yellow-400" />;
      case 'admin':
        return <Shield className="w-3 h-3 text-red-400" />;
      case 'moderator':
        return <Shield className="w-3 h-3 text-blue-400" />;
      default:
        return <UserIcon className="w-3 h-3 text-gray-400" />;
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <Hash className="w-4 h-4 text-gray-400" />;
      case 'voice':
        return <Volume2 className="w-4 h-4 text-gray-400" />;
      default:
        return <Hash className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: 'var(--aura-bg-primary)' }}>
      {/* COLUMN 1: Server Rail (Far Left) - Aura Glass */}
      <div className="w-20 aura-glass flex flex-col items-center py-6 space-y-3 border-r border-white/10">
        {/* Direct Messages Button */}
        <div className="relative group">
          <div className="aura-server-icon aura-glow-hover cursor-pointer">
            <span className="aura-gradient-text font-bold text-lg">DM</span>
          </div>
          <div className="aura-tooltip absolute left-full ml-4 px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            Direct Messages
          </div>
        </div>
        
        {/* Separator */}
        <div className="aura-divider w-8"></div>
        
        {/* Server Icons */}
        {groups.map((group) => (
          <div key={group.id} className="relative group">
            <button
              onClick={() => handleGroupSelect(group)}
              className={`aura-server-icon ${selectedGroup?.id === group.id ? 'active' : ''}`}
            >
              {group.iconURL ? (
                <img
                  src={group.iconURL}
                  alt={group.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="aura-gradient-text font-bold text-lg">
                  {group.name.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            
            {/* Tooltip */}
            <div className="aura-tooltip absolute left-full ml-4 px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
              {group.name}
            </div>
          </div>
        ))}
        
        {/* Add Server Button */}
        <div className="relative group">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="aura-server-icon hover:border-green-400 hover:text-green-400 aura-glow-hover"
          >
            <Plus className="w-6 h-6" />
          </button>
          <div className="aura-tooltip absolute left-full ml-4 px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            Add a Server
          </div>
        </div>
        
        {/* Explore Servers Button */}
        <div className="relative group">
          <button
            onClick={() => setShowJoinGroup(true)}
            className="aura-server-icon hover:border-green-400 hover:text-green-400 aura-glow-hover"
          >
            <Search className="w-6 h-6" />
          </button>
          <div className="aura-tooltip absolute left-full ml-4 px-3 py-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            Explore Servers
          </div>
        </div>
      </div>

      {/* COLUMN 2: Channel & User Panel (Left) - Aura Glass */}
      <div className="w-64 aura-glass flex flex-col border-r border-white/10">
        {/* Server Header */}
        {selectedGroup && (
          <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 aura-glass-hover">
            <h2 className="text-white font-semibold truncate text-sm">{selectedGroup.name}</h2>
            <div className="flex items-center gap-1">
              {canInvite && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Create Invite"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
              <button
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Server Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-3">
          {selectedGroup ? (
            <>
              {/* Text Channels */}
              <div className="mb-6">
                <div className="flex items-center justify-between px-2 py-2 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Text Channels
                  </h3>
                  {canManageChannels && (
                    <button
                      onClick={() => setShowCreateChannel(true)}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {channels
                  .filter(channel => channel.type === 'text')
                  .map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel)}
                      className={`aura-channel-item w-full text-left text-sm ${
                        selectedChannel?.id === channel.id ? 'active' : ''
                      }`}
                    >
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
              </div>

              {/* Voice Channels */}
              <div>
                <div className="flex items-center justify-between px-2 py-2 mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Voice Channels
                  </h3>
                  {canManageChannels && (
                    <button
                      onClick={() => setShowCreateChannel(true)}
                      className="p-1 text-gray-400 hover:text-white rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {channels
                  .filter(channel => channel.type === 'voice')
                  .map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel)}
                      className={`aura-channel-item w-full text-left text-sm ${
                        selectedChannel?.id === channel.id ? 'active' : ''
                      }`}
                    >
                      <Volume2 className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">Select a server to view channels</p>
            </div>
          )}
        </div>

        {/* User Panel (Footer) */}
        <div className="h-16 border-t border-white/10 flex items-center px-3 aura-glass-hover">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.displayName}&background=E024D8&color=fff`}
                  alt={userData?.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 aura-status-online rounded-full border-2 border-gray-900"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {userData?.displayName}
              </p>
              <p className="text-gray-400 text-xs truncate">
                #{userData?.username || '0000'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded transition-all duration-200 ${
                isMuted ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`p-2 rounded transition-all duration-200 ${
                isDeafened ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? <HeadphonesOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setShowUserSettings(!showUserSettings)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200"
              title="User Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 3: Main Content Panel (Center) - Aurora Background */}
      <div className="flex-1 flex flex-col aura-aurora-bg">
        {/* Channel Header */}
        {selectedChannel ? (
          <div className="h-14 aura-glass border-b border-white/10 flex items-center justify-between px-6 shadow-lg">
            <div className="flex items-center gap-3">
              {getChannelIcon(selectedChannel.type)}
              <h3 className="text-white font-semibold text-lg">
                {selectedChannel.name}
              </h3>
              {selectedChannel.description && (
                <>
                  <div className="w-px h-4 bg-gray-600"></div>
                  <p className="text-gray-400 text-sm truncate max-w-md">
                    {selectedChannel.description}
                  </p>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Pin className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowMemberList(!showMemberList)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showMemberList 
                    ? 'text-white bg-white/10' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-gray-600 mx-2"></div>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <Search className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-14 aura-glass border-b border-white/10 flex items-center px-6">
            <h3 className="text-gray-400 text-lg">Select a channel</h3>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col relative z-10">
          {selectedChannel ? (
            selectedChannel.type === 'voice' ? (
              /* Voice Channel Content */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center aura-animate-fade-in">
                  <div className="w-32 h-32 aura-glass rounded-full flex items-center justify-center mx-auto mb-8 aura-glow-cyan">
                    <Volume2 className="w-16 h-16 text-cyan-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 aura-gradient-text">
                    {selectedChannel.name}
                  </h3>
                  <p className="text-gray-400 mb-12 text-lg">
                    {selectedChannel.description || 'No one is in this voice channel yet.'}
                  </p>
                  <button className="aura-btn-primary text-lg px-8 py-4">
                    Join Voice Channel
                  </button>
                </div>
              </div>
            ) : (
              /* Text Channel Content */
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="text-center py-12 aura-animate-fade-in">
                    <div className="w-20 h-20 aura-glass rounded-full flex items-center justify-center mx-auto mb-6 aura-glow-magenta">
                      <Hash className="w-10 h-10 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Welcome to <span className="aura-gradient-text">#{selectedChannel.name}</span>!
                    </h3>
                    <p className="text-gray-400 text-lg">
                      This is the start of the #{selectedChannel.name} channel.
                    </p>
                    {selectedChannel.description && (
                      <p className="text-gray-500 text-sm mt-3">{selectedChannel.description}</p>
                    )}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-6">
                  <div className="aura-glass rounded-2xl p-4">
                    <div className="flex items-center gap-4">
                      <button
                        className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        title="Upload disabled in demo"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      
                      <input
                        type="text"
                        placeholder={`Message #${selectedChannel.name}`}
                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                      />
                      
                      <button className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200">
                        <span className="text-xl">😊</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )
          ) : (
            /* No Channel Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center aura-animate-fade-in">
                <div className="w-32 h-32 aura-glass rounded-full flex items-center justify-center mx-auto mb-8 aura-animate-float">
                  <span className="aura-gradient-text font-bold text-6xl">N</span>
                </div>
                <h3 className="text-4xl font-bold text-white mb-4 aura-gradient-text">
                  Welcome to Nokiatis
                </h3>
                <p className="text-gray-400 text-xl">
                  {selectedGroup 
                    ? 'Select a channel to start chatting'
                    : 'Select a server to get started'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 4: Member List (Right) - Aura Glass */}
      {showMemberList && selectedGroup && (
        <div className="w-64 aura-glass border-l border-white/10">
          <div className="h-14 border-b border-white/10 flex items-center px-4">
            <h3 className="text-white font-semibold text-sm">Members — {members.length}</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {/* Online Members */}
            <div className="mb-6">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-2 mb-3">
                Online — {members.filter(m => m.userId).length}
              </h4>
              
              {members.map((member) => (
                <div
                  key={member.id}
                  className="aura-member-item flex items-center gap-3"
                >
                  <div className="relative">
                    <div className="w-8 h-8 aura-glass rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.nickname?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 aura-status-online rounded-full border-2 border-gray-900"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(member.role)}
                      <span className="text-sm text-white truncate">
                        {member.nickname || `User ${member.userId.slice(-4)}`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Suspense fallback={null}>
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(group) => {
            setShowCreateGroup(false);
            handleGroupSelect(group);
          }}
        />

        <JoinGroupModal
          isOpen={showJoinGroup}
          onClose={() => setShowJoinGroup(false)}
          onGroupJoined={(groupId) => {
            setShowJoinGroup(false);
            const group = groups.find(g => g.id === groupId);
            if (group) {
              handleGroupSelect(group);
            }
          }}
        />

        {selectedGroup && (
          <>
            <CreateChannelModal
              isOpen={showCreateChannel}
              onClose={() => setShowCreateChannel(false)}
              groupId={selectedGroup.id}
            />

            <InviteModal
              isOpen={showInviteModal}
              onClose={() => setShowInviteModal(false)}
              group={selectedGroup}
            />
          </>
        )}
      </Suspense>

      {/* User Settings Dropdown */}
      {showUserSettings && (
        <div className="absolute bottom-20 left-4 w-56 aura-modal rounded-2xl shadow-2xl z-50 aura-animate-scale-in">
          <div className="p-3">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 text-sm"
            >
              <Settings className="w-4 h-4" />
              Toggle Theme
            </button>
            <div className="aura-divider my-2"></div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200 text-sm"
            >
              <UserIcon className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};