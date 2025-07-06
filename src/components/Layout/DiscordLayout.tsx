import React, { useState, Suspense, lazy } from 'react';
import { Plus, Compass, Settings, Mic, MicOff, Headphones, Headphones as HeadphonesOff, Hash, Volume2, Crown, Shield, User as UserIcon, Search, Pin, Users, Bell, HelpCircle, Upload } from 'lucide-react';
import { Group, Channel, GroupMember } from '../../types/groups';
import { useAuthContext } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { signOut } from '../../services/authService';
import { getUserGroups, getGroupChannels, getGroupMembers } from '../../services/groupService';
import { SkeletonLoader } from '../Loading/SkeletonLoader';

// Lazy load modals
const CreateGroupModal = lazy(() => import('../Groups/CreateGroupModal').then(module => ({ default: module.CreateGroupModal })));
const JoinGroupModal = lazy(() => import('../Groups/JoinGroupModal').then(module => ({ default: module.JoinGroupModal })));
const CreateChannelModal = lazy(() => import('../Groups/CreateChannelModal').then(module => ({ default: module.CreateChannelModal })));
const InviteModal = lazy(() => import('../Groups/InviteModal').then(module => ({ default: module.InviteModal })));

export const DiscordLayout: React.FC = () => {
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

  const handleFileUploadDisabled = () => {
    alert('File upload functionality is not available in this version.');
  };

  const currentUserMember = members.find(m => m.userId === user?.uid);
  const canManageChannels = currentUserMember && ['owner', 'admin'].includes(currentUserMember.role);
  const canInvite = currentUserMember && ['owner', 'admin', 'moderator'].includes(currentUserMember.role);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-3 h-3 text-red-500" />;
      case 'moderator':
        return <Shield className="w-3 h-3 text-blue-500" />;
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
    <div className="h-screen flex bg-gray-800 text-white overflow-hidden">
      {/* COLUMN 1: Server Rail (Far Left) */}
      <div className="w-18 bg-gray-900 flex flex-col items-center py-3 space-y-2">
        {/* Direct Messages Button */}
        <div className="relative group">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl hover:rounded-xl flex items-center justify-center text-white font-bold text-sm transition-all duration-300 cursor-pointer">
            DM
          </div>
          <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            Direct Messages
          </div>
        </div>
        
        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-700 rounded-full"></div>
        
        {/* Server Icons */}
        {groups.map((group) => (
          <div key={group.id} className="relative group">
            <button
              onClick={() => handleGroupSelect(group)}
              className={`w-12 h-12 rounded-2xl hover:rounded-xl flex items-center justify-center text-white font-bold text-sm transition-all duration-300 relative ${
                selectedGroup?.id === group.id 
                  ? 'rounded-xl bg-gradient-to-br from-purple-600 to-blue-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {group.iconURL ? (
                <img
                  src={group.iconURL}
                  alt={group.name}
                  className="w-full h-full rounded-2xl hover:rounded-xl transition-all duration-300 object-cover"
                />
              ) : (
                <span>{group.name.charAt(0).toUpperCase()}</span>
              )}
              
              {/* Active indicator */}
              {selectedGroup?.id === group.id && (
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
              )}
            </button>
            
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
              {group.name}
            </div>
          </div>
        ))}
        
        {/* Add Server Button */}
        <div className="relative group">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-12 h-12 bg-gray-700 hover:bg-green-600 rounded-2xl hover:rounded-xl flex items-center justify-center text-green-500 hover:text-white transition-all duration-300"
          >
            <Plus className="w-6 h-6" />
          </button>
          <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            Add a Server
          </div>
        </div>
        
        {/* Explore Servers Button */}
        <div className="relative group">
          <button
            onClick={() => setShowJoinGroup(true)}
            className="w-12 h-12 bg-gray-700 hover:bg-green-600 rounded-2xl hover:rounded-xl flex items-center justify-center text-green-500 hover:text-white transition-all duration-300"
          >
            <Compass className="w-6 h-6" />
          </button>
          <div className="absolute left-full ml-4 px-3 py-2 bg-black text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap z-50">
            Explore Discoverable Servers
          </div>
        </div>
      </div>

      {/* COLUMN 2: Channel & User Panel (Left) */}
      <div className="w-60 bg-gray-800 flex flex-col">
        {/* Server Header */}
        {selectedGroup && (
          <div className="h-12 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-800/95 backdrop-blur-sm shadow-sm">
            <h2 className="text-white font-semibold truncate text-sm">{selectedGroup.name}</h2>
            <div className="flex items-center gap-1">
              {canInvite && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  title="Create Invite"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
              <button
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Server Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto p-2">
          {selectedGroup ? (
            <>
              {/* Text Channels */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
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
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors text-sm ${
                        selectedChannel?.id === channel.id
                          ? 'bg-gray-700/60 text-white'
                          : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
                      }`}
                    >
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{channel.name}</span>
                    </button>
                  ))}
              </div>

              {/* Voice Channels */}
              <div>
                <div className="flex items-center justify-between px-2 py-1 mb-1">
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
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors text-sm ${
                        selectedChannel?.id === channel.id
                          ? 'bg-gray-700/60 text-white'
                          : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'
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
        <div className="h-14 bg-gray-900/50 border-t border-gray-700 flex items-center px-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.displayName}&background=6366f1&color=fff`}
                  alt={userData?.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
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
              className={`p-1.5 rounded transition-colors ${
                isMuted ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setIsDeafened(!isDeafened)}
              className={`p-1.5 rounded transition-colors ${
                isDeafened ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? <HeadphonesOff className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => setShowUserSettings(!showUserSettings)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="User Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* COLUMN 3: Main Content Panel (Center) */}
      <div className="flex-1 flex flex-col bg-gray-700">
        {/* Channel Header */}
        {selectedChannel ? (
          <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shadow-sm">
            <div className="flex items-center gap-2">
              {getChannelIcon(selectedChannel.type)}
              <h3 className="text-white font-semibold text-sm">
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
            
            <div className="flex items-center gap-1">
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <Bell className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <Pin className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMemberList(!showMemberList)}
                className={`p-2 rounded transition-colors ${
                  showMemberList 
                    ? 'text-white bg-gray-700' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-600 mx-1"></div>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <Search className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4">
            <h3 className="text-gray-400 text-sm">Select a channel</h3>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedChannel ? (
            selectedChannel.type === 'voice' ? (
              /* Voice Channel Content */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Volume2 className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {selectedChannel.name}
                  </h3>
                  <p className="text-gray-400 mb-8">
                    {selectedChannel.description || 'No one is in this voice channel yet.'}
                  </p>
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-semibold transition-colors">
                    Join Voice Channel
                  </button>
                </div>
              </div>
            ) : (
              /* Text Channel Content */
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Hash className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Welcome to #{selectedChannel.name}!
                    </h3>
                    <p className="text-gray-400">
                      This is the start of the #{selectedChannel.name} channel.
                    </p>
                    {selectedChannel.description && (
                      <p className="text-gray-500 text-sm mt-2">{selectedChannel.description}</p>
                    )}
                  </div>
                </div>

                {/* Message Input */}
                <div className="p-4">
                  <div className="bg-gray-600 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleFileUploadDisabled}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Upload a file"
                      >
                        <Upload className="w-5 h-5" />
                      </button>
                      
                      <input
                        type="text"
                        placeholder={`Message #${selectedChannel.name}`}
                        className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
                      />
                      
                      <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                        😊
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )
          ) : (
            /* No Channel Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Hash className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Welcome to Nokiatis
                </h3>
                <p className="text-gray-400">
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

      {/* COLUMN 4: Member List (Right) */}
      {showMemberList && selectedGroup && (
        <div className="w-60 bg-gray-800 border-l border-gray-700">
          <div className="h-12 border-b border-gray-700 flex items-center px-4">
            <h3 className="text-white font-semibold text-sm">Members — {members.length}</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {/* Online Members */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 py-1 mb-2">
                Online — {members.filter(m => m.userId).length}
              </h4>
              
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-gray-700/30 transition-colors"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {member.nickname?.charAt(0) || 'U'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
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
        <div className="absolute bottom-16 left-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-2">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors text-sm"
            >
              <Settings className="w-4 h-4" />
              Toggle Theme
            </button>
            <div className="border-t border-gray-700 my-2"></div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded transition-colors text-sm"
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