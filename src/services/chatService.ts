import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  getDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  setDoc // Import setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Message, Chat, TypingStatus, MessageReaction, Poll, LocationData } from '../types';

// FIX #3: Correctly handle message data to avoid 'undefined' values.
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  type: 'text' | 'image' | 'file' | 'voice' | 'gif' | 'sticker' | 'poll' | 'location' = 'text',
  file?: File,
  replyTo?: string,
  voiceDuration?: number,
  poll?: Partial<Poll>,
  location?: LocationData
) => {
  try {
    const messageData: any = {
      senderId,
      receiverId,
      content,
      type,
      timestamp: serverTimestamp(), // Use serverTimestamp for consistency
      isRead: false,
      isEdited: false,
      isDeleted: false,
      reactions: [],
      mentions: content.match(/@(\w+)/g)?.map(mention => mention.slice(1)) || [],
    };

    // Only add file-related fields if a file exists
    if (file) {
      const storageRef = ref(storage, `messages/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      messageData.fileUrl = await getDownloadURL(snapshot.ref);
      messageData.fileName = file.name;
      messageData.fileSize = file.size;
    }

    // Only add other optional fields if they have a value
    if (replyTo) messageData.replyTo = replyTo;
    if (voiceDuration) messageData.voiceDuration = voiceDuration;
    if (poll) messageData.poll = poll;
    if (location) messageData.location = location;

    await addDoc(collection(db, 'messages'), messageData);

    // Update or create chat document robustly
    const chatId = [senderId, receiverId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);

    // Use setDoc with merge to create the doc if it doesn't exist, or update it if it does.
    await setDoc(chatRef, {
      participants: [senderId, receiverId],
      lastMessageAt: serverTimestamp(),
      isGroup: false,
      // Only set createdAt on initial creation
      createdAt: serverTimestamp()
    }, { merge: true });


  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const editMessage = async (messageId: string, newContent: string) => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      content: newContent,
      isEdited: true,
      editedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    // Instead of keeping the doc, we can just delete it or clear content
    await updateDoc(doc(db, 'messages', messageId), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      content: 'This message was deleted',
      fileUrl: '',
      fileName: '',
      poll: null,
      location: null
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

export const addReaction = async (messageId: string, emoji: string, userId: string) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) return;

    const messageData = messageDoc.data() as Message;
    const reactions = messageData.reactions || [];

    const existingReaction = reactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      if (!existingReaction.users.includes(userId)) {
        existingReaction.users.push(userId);
        existingReaction.count = existingReaction.users.length;
      }
    } else {
      reactions.push({
        emoji,
        users: [userId],
        count: 1
      });
    }

    await updateDoc(messageRef, { reactions });
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

export const removeReaction = async (messageId: string, emoji: string, userId: string) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) return;

    const messageData = messageDoc.data() as Message;
    const reactions = messageData.reactions || [];

    const reactionIndex = reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex !== -1) {
      const reaction = reactions[reactionIndex];
      reaction.users = reaction.users.filter(id => id !== userId);
      reaction.count = reaction.users.length;

      if (reaction.count === 0) {
        reactions.splice(reactionIndex, 1);
      }
    }

    await updateDoc(messageRef, { reactions });
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};

export const getMessages = (senderId: string, receiverId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'messages'),
    where('senderId', 'in', [senderId, receiverId]),
    where('receiverId', 'in', [senderId, receiverId]),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date()
      } as Message);
    });
    callback(messages);
  });
};

export const markMessagesAsRead = async (messageIds: string[]) => {
  try {
    const batch = writeBatch(db);

    messageIds.forEach((messageId) => {
      const messageRef = doc(db, 'messages', messageId);
      batch.update(messageRef, {
        isRead: true,
        readAt: serverTimestamp()
      });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// FIX #2: Correctly create/update typing status to avoid 'No document to update' error.
export const setTypingStatus = async (userId: string, chatId: string, isTyping: boolean) => {
  try {
    // The document ID should be consistent for a given chat, not user-specific.
    const typingRef = doc(db, 'typing', chatId);

    if (isTyping) {
      // Use setDoc with merge to create or update the document.
      await setDoc(typingRef, {
        typingUsers: arrayUnion(userId), // Add user to an array of typing users
        lastUpdate: serverTimestamp()
      }, { merge: true });
    } else {
      // Use updateDoc with arrayRemove to remove the user from the typing array.
      await updateDoc(typingRef, {
        typingUsers: arrayRemove(userId)
      });
    }
  } catch (error) {
    console.error('Error setting typing status:', error);
  }
};

export const getTypingStatus = (chatId: string, callback: (typingUsers: string[]) => void) => {
  const typingRef = doc(db, 'typing', chatId);

  return onSnapshot(typingRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data.typingUsers || []);
    } else {
      callback([]);
    }
  });
};


export const enableDisappearingMessages = async (chatId: string, duration: number) => {
  try {
    await updateDoc(doc(db, 'chats', chatId), {
      disappearingMessages: {
        enabled: true,
        duration
      }
    });
  } catch (error) {
    console.error('Error enabling disappearing messages:', error);
    throw error;
  }
};

export const blockUser = async (userId: string, blockedUserId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      blockedUsers: arrayUnion(blockedUserId)
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const unblockUser = async (userId: string, unblockedUserId: string) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      blockedUsers: arrayRemove(unblockedUserId)
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

export const votePoll = async (messageId: string, optionIndex: number, userId: string) => {
  try {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);

    if (!messageDoc.exists()) return;

    const messageData = messageDoc.data() as Message;
    if (!messageData.poll) return;

    const poll = messageData.poll;
    const existingVoteIndex = poll.votes.findIndex(vote => vote.userId === userId);

    if (existingVoteIndex !== -1) {
      // User already voted, update their vote
      poll.votes[existingVoteIndex].optionIndex = optionIndex;
      poll.votes[existingVoteIndex].timestamp = new Date();
    } else {
      // New vote
      poll.votes.push({
        userId,
        optionIndex,
        timestamp: new Date()
      });
    }

    await updateDoc(messageRef, { poll });
  } catch (error) {
    console.error('Error voting on poll:', error);
    throw error;
  }
};
