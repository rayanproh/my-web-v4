import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Group, GroupMember, Channel, GroupInvite, ChannelCategory } from '../types/groups';

// Group Management
export const createGroup = async (
  ownerId: string,
  name: string,
  description?: string,
  iconFile?: File
): Promise<string> => {
  try {
    let iconURL = '';
    
    if (iconFile) {
      const iconRef = ref(storage, `group-icons/${Date.now()}_${iconFile.name}`);
      const snapshot = await uploadBytes(iconRef, iconFile);
      iconURL = await getDownloadURL(snapshot.ref);
    }

    const groupData: Omit<Group, 'id'> = {
      name,
      description: description || '', // CRITICAL FIX: Ensure description is never undefined
      iconURL,
      ownerId,
      createdAt: new Date(),
      memberCount: 1,
      isPublic: false,
      inviteCode: generateInviteCode(),
      settings: {
        defaultNotifications: true,
        explicitContentFilter: 'members_without_roles',
        verificationLevel: 'none'
      }
    };

    const groupRef = await addDoc(collection(db, 'groups'), groupData);
    
    // Add owner as member
    await addGroupMember(groupRef.id, ownerId, 'owner');
    
    // Create default channels
    await createDefaultChannels(groupRef.id, ownerId);
    
    return groupRef.id;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const joinGroupByInvite = async (inviteCode: string, userId: string): Promise<string> => {
  try {
    // Find invite
    const invitesQuery = query(
      collection(db, 'invites'),
      where('code', '==', inviteCode),
      where('isActive', '==', true)
    );
    
    const inviteSnapshot = await getDocs(invitesQuery);
    
    if (inviteSnapshot.empty) {
      throw new Error('Invalid or expired invite code');
    }
    
    const inviteDoc = inviteSnapshot.docs[0];
    const invite = inviteDoc.data() as GroupInvite;
    
    // Check if invite is still valid
    if (invite.expiresAt && invite.expiresAt.toDate() < new Date()) {
      throw new Error('Invite has expired');
    }
    
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      throw new Error('Invite has reached maximum uses');
    }
    
    // Check if user is already a member
    const memberQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', invite.groupId),
      where('userId', '==', userId)
    );
    
    const memberSnapshot = await getDocs(memberQuery);
    
    if (!memberSnapshot.empty) {
      throw new Error('You are already a member of this group');
    }
    
    // Add user as member
    await addGroupMember(invite.groupId, userId, 'member');
    
    // Update invite usage
    await updateDoc(doc(db, 'invites', inviteDoc.id), {
      uses: invite.uses + 1
    });
    
    // Update group member count
    const groupRef = doc(db, 'groups', invite.groupId);
    const groupDoc = await getDoc(groupRef);
    if (groupDoc.exists()) {
      await updateDoc(groupRef, {
        memberCount: (groupDoc.data().memberCount || 0) + 1
      });
    }
    
    return invite.groupId;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

export const addGroupMember = async (
  groupId: string,
  userId: string,
  role: 'owner' | 'admin' | 'moderator' | 'member'
) => {
  try {
    const memberData: Omit<GroupMember, 'id'> = {
      userId,
      groupId,
      role,
      joinedAt: new Date(),
      permissions: getDefaultPermissions(role),
      isMuted: false,
      isDeafened: false
    };

    await addDoc(collection(db, 'groupMembers'), memberData);
  } catch (error) {
    console.error('Error adding group member:', error);
    throw error;
  }
};

export const removeGroupMember = async (groupId: string, userId: string, removedBy: string) => {
  try {
    // Check permissions
    const removerMember = await getGroupMember(groupId, removedBy);
    if (!removerMember || !canManageMembers(removerMember.role)) {
      throw new Error('Insufficient permissions');
    }
    
    // Find and remove member
    const memberQuery = query(
      collection(db, 'groupMembers'),
      where('groupId', '==', groupId),
      where('userId', '==', userId)
    );
    
    const memberSnapshot = await getDocs(memberQuery);
    
    if (!memberSnapshot.empty) {
      await deleteDoc(memberSnapshot.docs[0].ref);
      
      // Update group member count
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      if (groupDoc.exists()) {
        await updateDoc(groupRef, {
          memberCount: Math.max(0, (groupDoc.data().memberCount || 1) - 1)
        });
      }
    }
  } catch (error) {
    console.error('Error removing group member:', error);
    throw error;
  }
};

// Channel Management - CRITICAL BUG FIX
export const createChannel = async (
  groupId: string,
  name: string,
  type: 'text' | 'voice' | 'announcement',
  createdBy: string,
  categoryId?: string,
  description?: string
): Promise<string> => {
  try {
    // Check permissions
    const member = await getGroupMember(groupId, createdBy);
    if (!member || !canManageChannels(member.role)) {
      throw new Error('Insufficient permissions');
    }
    
    // FIXED: Simple position calculation without complex query
    const channelsSnapshot = await getDocs(
      query(collection(db, 'channels'), where('groupId', '==', groupId))
    );
    const nextPosition = channelsSnapshot.size;
    
    // CRITICAL BUG FIX: Properly handle categoryId and description fields
    const channelData: Omit<Channel, 'id'> = {
      groupId,
      name: name.toLowerCase().replace(/\s+/g, '-'),
      type,
      position: nextPosition,
      createdAt: new Date(),
      createdBy,
      permissions: [],
      settings: {
        nsfw: false,
        ...(type === 'voice' && {
          bitrate: 64000,
          userLimit: 0
        })
      }
    };

    // CRITICAL FIX: Only add optional fields if they have valid values
    if (description && description.trim()) {
      channelData.description = description.trim();
    }
    
    if (categoryId && categoryId.trim()) {
      channelData.categoryId = categoryId.trim();
    }

    const channelRef = await addDoc(collection(db, 'channels'), channelData);
    return channelRef.id;
  } catch (error) {
    console.error('Error creating channel:', error);
    throw error;
  }
};

export const deleteChannel = async (channelId: string, deletedBy: string) => {
  try {
    const channelDoc = await getDoc(doc(db, 'channels', channelId));
    if (!channelDoc.exists()) {
      throw new Error('Channel not found');
    }
    
    const channel = channelDoc.data() as Channel;
    
    // Check permissions
    const member = await getGroupMember(channel.groupId, deletedBy);
    if (!member || !canManageChannels(member.role)) {
      throw new Error('Insufficient permissions');
    }
    
    await deleteDoc(doc(db, 'channels', channelId));
  } catch (error) {
    console.error('Error deleting channel:', error);
    throw error;
  }
};

// Invite Management
export const createGroupInvite = async (
  groupId: string,
  createdBy: string,
  expiresIn?: number, // hours
  maxUses?: number
): Promise<string> => {
  try {
    const member = await getGroupMember(groupId, createdBy);
    if (!member || !canCreateInvite(member.role)) {
      throw new Error('Insufficient permissions');
    }
    
    const code = generateInviteCode();
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : undefined;
    
    const inviteData: Omit<GroupInvite, 'id'> = {
      groupId,
      code,
      createdBy,
      createdAt: new Date(),
      expiresAt,
      maxUses,
      uses: 0,
      isActive: true
    };

    await addDoc(collection(db, 'invites'), inviteData);
    return code;
  } catch (error) {
    console.error('Error creating invite:', error);
    throw error;
  }
};

// Real-time listeners - FIXED: Simplified queries to avoid index requirements
export const getUserGroups = (userId: string, callback: (groups: Group[]) => void) => {
  // FIXED: Simple query without complex ordering
  const memberQuery = query(
    collection(db, 'groupMembers'),
    where('userId', '==', userId)
  );

  return onSnapshot(memberQuery, async (memberSnapshot) => {
    const groupIds = memberSnapshot.docs.map(doc => doc.data().groupId);
    
    if (groupIds.length === 0) {
      callback([]);
      return;
    }
    
    // FIXED: Fetch groups one by one to avoid complex queries
    const groups: Group[] = [];
    for (const groupId of groupIds) {
      try {
        const groupDoc = await getDoc(doc(db, 'groups', groupId));
        if (groupDoc.exists()) {
          const data = groupDoc.data();
          groups.push({
            id: groupDoc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date()
          } as Group);
        }
      } catch (error) {
        console.error('Error fetching group:', groupId, error);
      }
    }
    
    callback(groups);
  });
};

export const getGroupChannels = (groupId: string, callback: (channels: Channel[]) => void) => {
  // FIXED: Simple query without ordering to avoid index requirement
  const q = query(
    collection(db, 'channels'),
    where('groupId', '==', groupId)
  );

  return onSnapshot(q, (snapshot) => {
    const channels: Channel[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      channels.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date()
      } as Channel);
    });
    
    // FIXED: Sort in memory instead of using Firestore orderBy
    channels.sort((a, b) => a.position - b.position);
    callback(channels);
  });
};

export const getGroupMembers = (groupId: string, callback: (members: GroupMember[]) => void) => {
  // FIXED: Simple query without ordering to avoid index requirement
  const q = query(
    collection(db, 'groupMembers'),
    where('groupId', '==', groupId)
  );

  return onSnapshot(q, (snapshot) => {
    const members: GroupMember[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      members.push({
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt?.toDate() || new Date()
      } as GroupMember);
    });
    
    // FIXED: Sort in memory instead of using Firestore orderBy
    members.sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());
    callback(members);
  });
};

// Helper functions
const generateInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const getGroupMember = async (groupId: string, userId: string): Promise<GroupMember | null> => {
  const memberQuery = query(
    collection(db, 'groupMembers'),
    where('groupId', '==', groupId),
    where('userId', '==', userId)
  );
  
  const memberSnapshot = await getDocs(memberQuery);
  
  if (memberSnapshot.empty) {
    return null;
  }
  
  const data = memberSnapshot.docs[0].data();
  return {
    id: memberSnapshot.docs[0].id,
    ...data,
    joinedAt: data.joinedAt?.toDate() || new Date()
  } as GroupMember;
};

const getDefaultPermissions = (role: string) => {
  // Simplified permission system for now
  switch (role) {
    case 'owner':
      return [
        { type: 'manage_group', granted: true },
        { type: 'manage_channels', granted: true },
        { type: 'manage_members', granted: true },
        { type: 'kick_members', granted: true },
        { type: 'ban_members', granted: true },
        { type: 'create_invite', granted: true }
      ];
    case 'admin':
      return [
        { type: 'manage_channels', granted: true },
        { type: 'manage_members', granted: true },
        { type: 'kick_members', granted: true },
        { type: 'create_invite', granted: true }
      ];
    case 'moderator':
      return [
        { type: 'kick_members', granted: true },
        { type: 'create_invite', granted: true }
      ];
    default:
      return [
        { type: 'create_invite', granted: false }
      ];
  }
};

const canManageMembers = (role: string): boolean => {
  return ['owner', 'admin'].includes(role);
};

const canManageChannels = (role: string): boolean => {
  return ['owner', 'admin'].includes(role);
};

const canCreateInvite = (role: string): boolean => {
  return ['owner', 'admin', 'moderator'].includes(role);
};

const createDefaultChannels = async (groupId: string, ownerId: string) => {
  try {
    // Create general text channel
    await createChannel(groupId, 'general', 'text', ownerId, undefined, 'General discussion');
    
    // Create general voice channel
    await createChannel(groupId, 'General', 'voice', ownerId, undefined, 'General voice chat');
  } catch (error) {
    console.error('Error creating default channels:', error);
  }
};