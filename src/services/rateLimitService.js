import { db } from '../firebase.config';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

export const rateLimitService = {
    // Limits configuration
    LIMITS: {
        OUTFIT_GENERATION: 10,       // 10 outfits per day
        SHOPPING_RECOMMENDATIONS: 5  // 5 recommendation sets per day
    },

    // Get today's document ID (YYYY-MM-DD)
    getTodayId() {
        const now = new Date();
        return `daily_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    },

    // Check if user has quota remaining
    async checkLimit(userId, actionType) {
        try {
            const todayId = this.getTodayId();
            const usageRef = doc(db, 'users', userId, 'usage', todayId);
            const usageDoc = await getDoc(usageRef);

            if (!usageDoc.exists()) {
                // No usage today yet
                return { allowed: true, remaining: this.LIMITS[actionType] };
            }

            const data = usageDoc.data();
            const currentUsage = data[actionType] || 0;
            const limit = this.LIMITS[actionType];

            return {
                allowed: currentUsage < limit,
                remaining: Math.max(0, limit - currentUsage),
                current: currentUsage,
                limit: limit
            };
        } catch (error) {
            console.error('Error checking rate limit:', error);
            // Default to allowed in case of error (fail open)
            return { allowed: true, remaining: 1, error: error.message };
        }
    },

    // Increment usage counter
    async incrementUsage(userId, actionType) {
        try {
            const todayId = this.getTodayId();
            const usageRef = doc(db, 'users', userId, 'usage', todayId);
            const usageDoc = await getDoc(usageRef);

            if (!usageDoc.exists()) {
                // Create new daily usage doc
                await setDoc(usageRef, {
                    [actionType]: 1,
                    lastUpdated: serverTimestamp()
                });
            } else {
                // Increment existing doc
                await updateDoc(usageRef, {
                    [actionType]: increment(1),
                    lastUpdated: serverTimestamp()
                });
            }

            return { success: true };
        } catch (error) {
            console.error('Error incrementing usage:', error);
            return { success: false, error: error.message };
        }
    },

    // Get full usage stats for today
    async getDailyUsage(userId) {
        try {
            const todayId = this.getTodayId();
            const usageRef = doc(db, 'users', userId, 'usage', todayId);
            const usageDoc = await getDoc(usageRef);

            const limits = this.LIMITS;
            let usage = {
                OUTFIT_GENERATION: 0,
                SHOPPING_RECOMMENDATIONS: 0
            };

            if (usageDoc.exists()) {
                const data = usageDoc.data();
                usage = {
                    OUTFIT_GENERATION: data.OUTFIT_GENERATION || 0,
                    SHOPPING_RECOMMENDATIONS: data.SHOPPING_RECOMMENDATIONS || 0
                };
            }

            return {
                success: true,
                usage,
                limits,
                remaining: {
                    OUTFIT_GENERATION: Math.max(0, limits.OUTFIT_GENERATION - usage.OUTFIT_GENERATION),
                    SHOPPING_RECOMMENDATIONS: Math.max(0, limits.SHOPPING_RECOMMENDATIONS - usage.SHOPPING_RECOMMENDATIONS)
                }
            };
        } catch (error) {
            console.error('Error getting daily usage:', error);
            return { success: false, error: error.message };
        }
    }
};
