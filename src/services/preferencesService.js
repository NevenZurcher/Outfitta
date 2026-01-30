import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.config';

export const preferencesService = {
    // Get user preferences
    async getPreferences(userId) {
        try {
            const prefRef = doc(db, 'preferences', userId);
            const prefDoc = await getDoc(prefRef);

            if (prefDoc.exists()) {
                return { success: true, preferences: prefDoc.data() };
            }

            // Return default preferences if none exist
            return {
                success: true,
                preferences: {
                    userId,
                    itemPreferences: {},
                    colorCombinations: {},
                    stylePairings: {},
                    categoryPairings: {},
                    updatedAt: new Date()
                }
            };
        } catch (error) {
            console.error('Error getting preferences:', error);
            return { success: false, error: error.message };
        }
    },

    // Update preferences after rating an outfit
    async updatePreferences(userId, outfit, rating) {
        try {
            const prefRef = doc(db, 'preferences', userId);
            const prefResult = await this.getPreferences(userId);

            if (!prefResult.success) {
                throw new Error('Failed to get preferences');
            }

            const prefs = prefResult.preferences;

            // Update item preferences
            if (outfit.selectedItems && outfit.selectedItems.length > 0) {
                outfit.selectedItems.forEach(item => {
                    if (!prefs.itemPreferences[item.id]) {
                        prefs.itemPreferences[item.id] = {
                            successRate: 0,
                            timesWorn: 0,
                            avgRating: 0,
                            totalRating: 0
                        };
                    }

                    const itemPref = prefs.itemPreferences[item.id];
                    itemPref.timesWorn += 1;
                    itemPref.totalRating += rating;
                    itemPref.avgRating = itemPref.totalRating / itemPref.timesWorn;
                    itemPref.successRate = itemPref.avgRating / 5; // Normalize to 0-1
                });
            }

            // Update color combination preferences
            if (outfit.selectedItems && outfit.selectedItems.length > 1) {
                const colors = outfit.selectedItems
                    .flatMap(item => item.colors || [])
                    .filter((v, i, a) => a.indexOf(v) === i) // Unique colors
                    .sort()
                    .join('-');

                if (colors) {
                    if (!prefs.colorCombinations[colors]) {
                        prefs.colorCombinations[colors] = {
                            avgRating: 0,
                            count: 0,
                            totalRating: 0
                        };
                    }

                    const colorPref = prefs.colorCombinations[colors];
                    colorPref.count += 1;
                    colorPref.totalRating += rating;
                    colorPref.avgRating = colorPref.totalRating / colorPref.count;
                }
            }

            // Update style pairings
            if (outfit.aiSuggestion && outfit.aiSuggestion.styleNotes) {
                const styles = outfit.selectedItems
                    .flatMap(item => item.style || [])
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort()
                    .join('-');

                if (styles) {
                    if (!prefs.stylePairings[styles]) {
                        prefs.stylePairings[styles] = {
                            avgRating: 0,
                            count: 0,
                            totalRating: 0
                        };
                    }

                    const stylePref = prefs.stylePairings[styles];
                    stylePref.count += 1;
                    stylePref.totalRating += rating;
                    stylePref.avgRating = stylePref.totalRating / stylePref.count;
                }
            }

            // Update category pairings
            if (outfit.selectedItems && outfit.selectedItems.length > 1) {
                const categories = outfit.selectedItems
                    .map(item => item.category)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .sort()
                    .join('-');

                if (categories) {
                    if (!prefs.categoryPairings[categories]) {
                        prefs.categoryPairings[categories] = {
                            avgRating: 0,
                            count: 0,
                            totalRating: 0
                        };
                    }

                    const catPref = prefs.categoryPairings[categories];
                    catPref.count += 1;
                    catPref.totalRating += rating;
                    catPref.avgRating = catPref.totalRating / catPref.count;
                }
            }

            prefs.updatedAt = new Date();

            // Save updated preferences
            await setDoc(prefRef, prefs);

            return { success: true };
        } catch (error) {
            console.error('Error updating preferences:', error);
            return { success: false, error: error.message };
        }
    },

    // Get top-rated items for AI bias
    async getTopRatedItems(userId, limit = 10) {
        try {
            const prefResult = await this.getPreferences(userId);

            if (!prefResult.success) {
                return { success: false, error: prefResult.error };
            }

            const prefs = prefResult.preferences;
            const items = Object.entries(prefs.itemPreferences || {})
                .map(([id, data]) => ({ id, ...data }))
                .filter(item => item.avgRating >= 4) // Only highly rated items
                .sort((a, b) => b.avgRating - a.avgRating)
                .slice(0, limit);

            return { success: true, items };
        } catch (error) {
            console.error('Error getting top-rated items:', error);
            return { success: false, error: error.message };
        }
    },

    // Get successful color combinations
    async getTopColorCombinations(userId, limit = 5) {
        try {
            const prefResult = await this.getPreferences(userId);

            if (!prefResult.success) {
                return { success: false, error: prefResult.error };
            }

            const prefs = prefResult.preferences;
            const combos = Object.entries(prefs.colorCombinations || {})
                .map(([colors, data]) => ({ colors, ...data }))
                .filter(combo => combo.avgRating >= 4)
                .sort((a, b) => b.avgRating - a.avgRating)
                .slice(0, limit);

            return { success: true, combinations: combos };
        } catch (error) {
            console.error('Error getting color combinations:', error);
            return { success: false, error: error.message };
        }
    },

    // Get items to avoid (low-rated)
    async getLowRatedItems(userId, limit = 5) {
        try {
            const prefResult = await this.getPreferences(userId);

            if (!prefResult.success) {
                return { success: false, error: prefResult.error };
            }

            const prefs = prefResult.preferences;
            const items = Object.entries(prefs.itemPreferences || {})
                .map(([id, data]) => ({ id, ...data }))
                .filter(item => item.avgRating < 3 && item.timesWorn >= 2) // Consistently low-rated
                .sort((a, b) => a.avgRating - b.avgRating)
                .slice(0, limit);

            return { success: true, items };
        } catch (error) {
            console.error('Error getting low-rated items:', error);
            return { success: false, error: error.message };
        }
    },

    // Calculate item success rate
    async calculateItemSuccessRate(userId, itemId) {
        try {
            const prefResult = await this.getPreferences(userId);

            if (!prefResult.success) {
                return { success: false, error: prefResult.error };
            }

            const prefs = prefResult.preferences;
            const itemPref = prefs.itemPreferences[itemId];

            if (!itemPref) {
                return { success: true, successRate: 0, timesWorn: 0 };
            }

            return {
                success: true,
                successRate: itemPref.successRate,
                avgRating: itemPref.avgRating,
                timesWorn: itemPref.timesWorn
            };
        } catch (error) {
            console.error('Error calculating success rate:', error);
            return { success: false, error: error.message };
        }
    }
};
