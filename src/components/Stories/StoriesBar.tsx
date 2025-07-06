import React, { useState, useEffect } from 'react';
import { Plus, Camera } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { useAuthContext } from '../../contexts/AuthContext';
import { Story, User } from '../../types';
import { StoriesViewer } from './StoriesViewer';

export const StoriesBar: React.FC = () => {
  const { user, userData } = useAuthContext();
  const [stories, setStories] = useState<{ [userId: string]: Story[] }>({});
  const [users, setUsers] = useState<{ [userId: string]: User }>({});
  const [selectedStories, setSelectedStories] = useState<Story[]>([]);
  const [showViewer, setShowViewer] = useState(false);
  const [initialStoryIndex, setInitialStoryIndex] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Get stories from last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const q = query(
      collection(db, 'stories'),
      where('createdAt', '>', yesterday),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData: { [userId: string]: Story[] } = {};
      const usersData: { [userId: string]: User } = {};

      snapshot.forEach((doc) => {
        const story = { id: doc.id, ...doc.data() } as Story;
        
        if (!storiesData[story.userId]) {
          storiesData[story.userId] = [];
        }
        storiesData[story.userId].push(story);
        
        if (story.user) {
          usersData[story.userId] = story.user;
        }
      });

      setStories(storiesData);
      setUsers(usersData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddStory = async (file: File, text?: string) => {
    if (!user || !userData) return;

    try {
      // Upload media
      const storageRef = ref(storage, `stories/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const mediaUrl = await getDownloadURL(snapshot.ref);

      // Create story
      const storyData: Omit<Story, 'id'> = {
        userId: user.uid,
        user: userData,
        type: file.type.startsWith('image/') ? 'image' : 'video',
        mediaUrl,
        text,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        views: [],
        reactions: []
      };

      await addDoc(collection(db, 'stories'), storyData);
    } catch (error) {
      console.error('Error adding story:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAddStory(file);
    }
  };

  const openStoriesViewer = (userId: string, storyIndex: number = 0) => {
    const userStories = stories[userId] || [];
    setSelectedStories(userStories);
    setInitialStoryIndex(storyIndex);
    setShowViewer(true);
  };

  const userStoryIds = Object.keys(stories);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4 overflow-x-auto">
          {/* Add Story Button */}
          <div className="flex-shrink-0">
            <label htmlFor="story-upload" className="cursor-pointer">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </div>
              <p className="text-xs text-center mt-2 text-gray-600 dark:text-gray-400">Your Story</p>
            </label>
            <input
              id="story-upload"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* User Stories */}
          {userStoryIds.map((userId) => {
            const userStories = stories[userId];
            const user = users[userId];
            const hasUnviewedStories = userStories.some(story => 
              !story.views.includes(userData?.id || '')
            );

            return (
              <div key={userId} className="flex-shrink-0">
                <button
                  onClick={() => openStoriesViewer(userId)}
                  className="relative"
                >
                  <div className={`w-16 h-16 rounded-full p-0.5 ${
                    hasUnviewedStories 
                      ? 'bg-gradient-to-br from-pink-500 to-orange-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}>
                    <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 p-0.5">
                      <img
                        src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=3b82f6&color=fff`}
                        alt={user?.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                    <span className="text-xs text-white font-bold">{userStories.length}</span>
                  </div>
                </button>
                <p className="text-xs text-center mt-2 text-gray-600 dark:text-gray-400 truncate w-16">
                  {user?.displayName}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stories Viewer */}
      {showViewer && (
        <StoriesViewer
          stories={selectedStories}
          initialStoryIndex={initialStoryIndex}
          onClose={() => setShowViewer(false)}
        />
      )}
    </>
  );
};