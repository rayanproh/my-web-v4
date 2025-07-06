import React, { useState } from 'react';
import { X, Edit, Camera, Phone, Mail, Calendar } from 'lucide-react';
import { useAuthContext } from '../../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface ProfileSidebarProps {
  onClose: () => void;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ onClose }) => {
  const { user, userData } = useAuthContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(userData?.status || '');

  const handleStatusUpdate = async () => {
    if (!user || !editStatus.trim()) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        status: editStatus.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile Picture Section */}
        <div className="p-6 text-center border-b border-gray-200">
          <div className="relative inline-block">
            <img
              src={userData?.photoURL || `https://ui-avatars.com/api/?name=${userData?.displayName}&background=3b82f6&color=fff&size=128`}
              alt={userData?.displayName}
              className="w-32 h-32 rounded-full mx-auto mb-4"
            />
            <button className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {userData?.displayName}
          </h3>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Online</span>
          </div>
        </div>

        {/* Status Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Status</h4>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          
          {isEditing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your status"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleStatusUpdate}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditStatus(userData?.status || '');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              {userData?.status || 'Available'}
            </p>
          )}
        </div>

        {/* Contact Info Section */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Contact Info</h4>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Mail className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{userData?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-900">
                  {userData?.createdAt ? formatDate(userData.createdAt) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Section */}
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Activity</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Last seen: {userData?.lastSeen ? formatDate(userData.lastSeen) : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};