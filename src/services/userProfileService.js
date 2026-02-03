import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

export const userProfileService = {
    // Get user profile
    async getUserProfile(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                return { success: true, profile: userDoc.data() };
            }

            // Return default profile if none exists
            return {
                success: true,
                profile: {
                    email: '',
                    displayName: '',
                    gender: '',
                    stylePreferences: [],
                    favoriteColors: [],
                    sizes: {
                        top: '',
                        bottom: '',
                        shoes: ''
                    },
                    location: '',
                    setupCompleted: false,
                    createdAt: new Date()
                }
            };
        } catch (error) {
            console.error('Error getting user profile:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user profile
    async updateUserProfile(userId, updates) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: error.message };
        }
    },

    // Complete setup
    async completeSetup(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                setupCompleted: true,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Error completing setup:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if user has completed setup
    async hasCompletedSetup(userId) {
        try {
            const result = await this.getUserProfile(userId);

            if (!result.success) {
                return { success: false, error: result.error };
            }

            return {
                success: true,
                completed: result.profile.setupCompleted || false
            };
        } catch (error) {
            console.error('Error checking setup status:', error);
            return { success: false, error: error.message };
        }
    },

    // Save setup step (for progressive saving during wizard)
    async saveSetupStep(userId, stepData) {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                ...stepData,
                updatedAt: new Date()
            });

            return { success: true };
        } catch (error) {
            console.error('Error saving setup step:', error);
            return { success: false, error: error.message };
        }
    }
};
