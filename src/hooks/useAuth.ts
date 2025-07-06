import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser?.uid);
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          
          // CRITICAL FIX: Check document existence with timeout
          const userDoc = await Promise.race([
            getDoc(userDocRef),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]) as any;
          
          if (!userDoc.exists()) {
            console.log('❌ User document missing, triggering profile setup');
            setNeedsProfileSetup(true);
            setLoading(false);
            return;
          }

          const userData = userDoc.data();
          
          if (!userData?.profileCompleted) {
            console.log('⚠️ Profile incomplete, needs setup');
            setNeedsProfileSetup(true);
            setLoading(false);
            return;
          }

          // OPTIMIZED: Real-time listener with error handling
          const unsubscribeUserDoc = onSnapshot(
            userDocRef, 
            (doc) => {
              if (doc.exists()) {
                const data = doc.data();
                console.log('✅ User data loaded successfully');
                setUserData({
                  id: doc.id,
                  ...data,
                  lastSeen: data.lastSeen?.toDate() || new Date(),
                  createdAt: data.createdAt?.toDate() || new Date()
                } as User);
                setNeedsProfileSetup(!data.profileCompleted);
                setLoading(false); // CRITICAL: Set loading false here
              } else {
                console.log('❌ User document deleted');
                setUserData(null);
                setNeedsProfileSetup(true);
                setLoading(false);
              }
            }, 
            (error) => {
              console.error('❌ Error listening to user document:', error);
              setLoading(false); // CRITICAL: Always set loading false
            }
          );

          return () => {
            console.log('🧹 Cleaning up user document listener');
            unsubscribeUserDoc();
          };
        } catch (error) {
          console.error('❌ Error fetching user data:', error);
          setNeedsProfileSetup(true);
          setLoading(false); // CRITICAL: Set loading false on error
        }
      } else {
        console.log('🚪 No user, clearing data');
        setUserData(null);
        setNeedsProfileSetup(false);
        setLoading(false); // CRITICAL: Set loading false
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  return { user, userData, loading, needsProfileSetup };
};