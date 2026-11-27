import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured, OWNER_NOTIFICATION_EMAIL } from '../services/firebaseClient.js';
import { notifyOwnerAuthEvent, buildAuthEventId } from '../services/notificationService.js';

const AuthContext = createContext(null);

function friendlyAuthError(err) {
  const code = err?.code ?? '';
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled. You can try again anytime~';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Try signing in instead!';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters with a mix of letters and numbers.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please check and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    default:
      return err?.message ?? 'Authentication failed. Please try again.';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  // Restore authentication state on reload WITHOUT sending login notifications
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser && db) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          setUserProfile(snap.exists() ? snap.data() : null);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function syncUserProfileDoc(firebaseUser, provider, isNewUser) {
    if (!db || !firebaseUser) return null;
    const ref = doc(db, 'users', firebaseUser.uid);
    const nowIso = new Date().toISOString();
    const baseData = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Little Guardian',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      provider,
      emailVerified: Boolean(firebaseUser.emailVerified),
      lastLoginAt: nowIso,
    };

    try {
      const snap = await getDoc(ref);
      if (!snap.exists() || isNewUser) {
        const docData = {
          ...baseData,
          role: 'user',
          isOwner: false,
          createdAt: nowIso,
        };
        await setDoc(ref, docData, { merge: true });
        setUserProfile(docData);
        return docData;
      } else {
        await updateDoc(ref, baseData);
        const merged = { ...snap.data(), ...baseData };
        setUserProfile(merged);
        return merged;
      }
    } catch {
      return null;
    }
  }

  async function signInWithGoogle() {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      throw new Error('Firebase is not configured yet. Add your Firebase credentials to .env.');
    }
    let result;
    try {
      result = await signInWithPopup(auth, googleProvider);
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }

    const info = getAdditionalUserInfo(result);
    const isNewUser = Boolean(info?.isNewUser);
    const eventType = isNewUser ? 'NEW_REGISTRATION' : 'SUCCESSFUL_LOGIN';

    // Non-blocking profile sync & optional notification: never undo or interrupt successful auth
    try {
      await syncUserProfileDoc(result.user, 'google.com', isNewUser);
    } catch {}
    try {
      const eventId = buildAuthEventId(result.user.uid, eventType);
      await notifyOwnerAuthEvent({
        user: result.user,
        eventType,
        provider: 'google.com',
        eventId,
      });
    } catch {}

    return { user: result.user, isNewUser };
  }

  async function registerWithEmail({ displayName, email, password }) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet. Add your Firebase credentials to .env.');
    }
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (displayName?.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }

    try {
      await sendEmailVerification(cred.user);
    } catch {}
    try {
      await syncUserProfileDoc(cred.user, 'password', true);
    } catch {}
    try {
      const eventId = buildAuthEventId(cred.user.uid, 'NEW_REGISTRATION');
      await notifyOwnerAuthEvent({
        user: cred.user,
        eventType: 'NEW_REGISTRATION',
        provider: 'password',
        eventId,
      });
    } catch {}

    return cred.user;
  }

  async function loginWithEmail({ email, password }) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet. Add your Firebase credentials to .env.');
    }
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }

    try {
      await syncUserProfileDoc(cred.user, 'password', false);
    } catch {}
    try {
      const eventId = buildAuthEventId(cred.user.uid, 'SUCCESSFUL_LOGIN');
      await notifyOwnerAuthEvent({
        user: cred.user,
        eventType: 'SUCCESSFUL_LOGIN',
        provider: 'password',
        eventId,
      });
    } catch {}

    return cred.user;
  }

  async function resetPassword(email) {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase is not configured yet.');
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw new Error(friendlyAuthError(err));
    }
  }

  async function resendVerification() {
    if (!auth?.currentUser) return;
    await sendEmailVerification(auth.currentUser);
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
  }

  const isOwner = Boolean(
    user &&
    user.email === OWNER_NOTIFICATION_EMAIL &&
    user.emailVerified
  );

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isConfigured: isFirebaseConfigured,
      isOwner,
      signInWithGoogle,
      registerWithEmail,
      loginWithEmail,
      resetPassword,
      resendVerification,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
