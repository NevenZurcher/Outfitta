import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase.config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

export const authService = {
    // Sign up with email and password
    async signUp(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                displayName: displayName || email.split('@')[0],
                createdAt: new Date(),
                setupCompleted: false,
                gender: '',
                stylePreferences: [],
                favoriteColors: [],
                sizes: {
                    top: '',
                    bottom: '',
                    shoes: ''
                },
                location: ''
            });

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Check if user document exists, create if not
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    createdAt: new Date(),
                    setupCompleted: false,
                    gender: '',
                    stylePreferences: [],
                    favoriteColors: [],
                    sizes: {
                        top: '',
                        bottom: '',
                        shoes: ''
                    },
                    location: ''
                });
            }

            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};
