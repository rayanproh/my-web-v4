import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import { User } from '../types';

export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    console.log('🚀 Starting sign up process...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName });
    
    // CRITICAL BUG FIX: Properly handle photoURL to prevent undefined values
    const userData: Partial<User> = {
      email: user.email!,
      displayName,
      photoURL: user.photoURL || null, // FIXED: Use null instead of undefined
      status: 'Available',
      isOnline: true,
      lastSeen: new Date(),
      createdAt: new Date(),
      theme: 'light',
      blockedUsers: [],
      profileCompleted: false // Triggers profile setup
    };
    
    // CRITICAL: Use setDoc to ensure document creation
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ User document created atomically for:', user.uid);
    
    return user;
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    throw new Error(error.message);
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('🔑 Signing in user...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await updateUserOnlineStatus(userCredential.user.uid, true);
    console.log('✅ Sign in successful');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    throw new Error(error.message);
  }
};

export const signInWithGoogle = async () => {
  try {
    console.log('🔑 Starting Google sign in...');
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // CRITICAL BUG FIX: Properly handle photoURL for Google users
      const userData: Partial<User> = {
        email: user.email!,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || null, // FIXED: Use null instead of undefined
        status: 'Available',
        isOnline: true,
        lastSeen: new Date(),
        createdAt: new Date(),
        theme: 'light',
        blockedUsers: [],
        profileCompleted: false // Triggers ProfileSetup
      };
      
      await setDoc(userDocRef, userData);
      console.log('✅ Google user document created atomically for:', user.uid);
    } else {
      // Existing user - update online status if profile complete
      const userData = userDoc.data();
      if (userData.profileCompleted) {
        await updateUserOnlineStatus(user.uid, true);
      }
      console.log('✅ Existing Google user signed in');
    }
    
    return user;
  } catch (error: any) {
    console.error('❌ Google sign in error:', error);
    throw new Error(error.message);
  }
};

export const signOut = async () => {
  try {
    if (auth.currentUser) {
      await updateUserOnlineStatus(auth.currentUser.uid, false);
    }
    await firebaseSignOut(auth);
    console.log('✅ Sign out successful');
  } catch (error: any) {
    console.error('❌ Sign out error:', error);
    throw new Error(error.message);
  }
};

export const updateUserOnlineStatus = async (userId: string, isOnline: boolean) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      await updateDoc(userRef, {
        isOnline,
        lastSeen: serverTimestamp()
      });
      console.log(`✅ Online status updated: ${isOnline}`);
    } else {
      console.warn('⚠️ User document missing for online status update:', userId);
    }
  } catch (error) {
    console.error('❌ Error updating online status:', error);
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // SAFE UPDATE: Always use setDoc with merge
    await setDoc(userRef, updates, { merge: true });
    console.log('✅ User profile updated successfully for:', userId);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};