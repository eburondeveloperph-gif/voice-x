import React, { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './lib/state';
import App from './App';

export default function FirebaseAuthWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { googleAccessToken, setGoogleAccessToken } = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            await setDoc(userRef, {
              displayName: u.displayName || 'Unknown',
              email: u.email || '',
              authProvider: 'google',
              googleServicesConnected: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              settings: {}
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        setGoogleAccessToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setGoogleAccessToken]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive');
    provider.addScope('https://mail.google.com/');
    provider.addScope('https://www.googleapis.com/auth/calendar');
    provider.addScope('https://www.googleapis.com/auth/tasks');
    provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
    provider.addScope('https://www.googleapis.com/auth/youtube.readonly');
    provider.addScope('https://www.googleapis.com/auth/forms.body');
    provider.addScope('https://www.googleapis.com/auth/analytics.readonly');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <div className="rounded-xl bg-zinc-800 p-8 shadow-2xl">
          <h1 className="mb-4 text-2xl font-bold text-lime-300">Welcome</h1>
          <p className="mb-6 text-zinc-400">Please sign in to continue using the application.</p>
          <button 
            onClick={login}
            className="rounded-lg bg-lime-300 px-6 py-2 pb-2.5 font-bold text-black hover:bg-lime-200 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute right-4 top-4 z-50 flex gap-2">
        <button 
          onClick={login}
          className={`rounded px-4 py-2 font-bold transition-all ${
            googleAccessToken 
              ? 'bg-lime-500/10 text-lime-500 hover:bg-lime-500/20' 
              : 'bg-amber-500/10 text-amber-500 animate-pulse hover:bg-amber-500/20'
          }`}
          title={googleAccessToken ? "Google Services Connected" : "Connect Google Services"}
        >
          {googleAccessToken ? "Google Connected" : "Connect Google"}
        </button>
        <button 
          onClick={() => {
            setGoogleAccessToken(null);
            signOut(auth);
          }}
          className="rounded bg-red-500/10 px-4 py-2 font-bold text-red-500 hover:bg-red-500/20 transition-colors"
        >
          Logout
        </button>
      </div>
      <App />
    </>
  );
}
