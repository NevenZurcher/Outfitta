import { wardrobeService } from './wardrobeService';
import { preferencesService } from './preferencesService';
import { geminiService } from './geminiService';

export const recommendationService = {
    // Analyze wardrobe to identify gaps and patterns
    analyzeWardrobe(wardrobeItems) {
        const analysis = {
            totalItems: wardrobeItems.length,
            categoryCounts: {},
            colorDistribution: {},
            styleDistribution: {},
            seasonalGaps: [],
            missingCategories: [],
            strengths: []
        };

        // Count items by category
        const categories = ['top', 'bottom', 'shoes', 'outerwear', 'accessory', 'dress', 'suit'];
        categories.forEach(cat => {
            analysis.categoryCounts[cat] = wardrobeItems.filter(item => item.category === cat).length;
        });

        // Identify missing or underrepresented categories
        categories.forEach(cat => {
            if (analysis.categoryCounts[cat] === 0) {
                analysis.missingCategories.push(cat);
            }
        });

        // Analyze color distribution
        wardrobeItems.forEach(item => {
            const colors = Array.isArray(item.colors) ? item.colors : [];
            colors.forEach(color => {
                analysis.colorDistribution[color] = (analysis.colorDistribution[color] || 0) + 1;
            });
        });

        // Analyze style distribution
        wardrobeItems.forEach(item => {
            const styles = Array.isArray(item.style) ? item.style : [];
            styles.forEach(style => {
                analysis.styleDistribution[style] = (analysis.styleDistribution[style] || 0) + 1;
            });
        });

        // Identify strengths (well-represented categories)
        Object.entries(analysis.categoryCounts).forEach(([cat, count]) => {
            if (count >= 3) {
                analysis.strengths.push(cat);
            }
        });

        // Check seasonal coverage
        const seasons = ['spring', 'summer', 'fall', 'winter'];
        seasons.forEach(season => {
            const seasonalItems = wardrobeItems.filter(item => {
                const itemSeasons = Array.isArray(item.season) ? item.season : [];
                return itemSeasons.includes(season);
            });
            if (seasonalItems.length < 3) {
                analysis.seasonalGaps.push(season);
            }
        });

        return analysis;
    },

    // Generate shopping recommendations using AI
    async generateRecommendations(userId, wardrobeItems, limit = 8) {
        try {
            // Analyze current wardrobe
            const wardrobeAnalysis = this.analyzeWardrobe(wardrobeItems);

            // Get user preferences
            const prefsResult = await preferencesService.getPreferences(userId);
            const topItemsResult = await preferencesService.getTopRatedItems(userId, 5);
            const topColorsResult = await preferencesService.getTopColorCombinations(userId, 3);

            const userPreferences = {
                totalRatings: prefsResult.success ? Object.keys(prefsResult.preferences.itemPreferences || {}).length : 0,
                topItems: topItemsResult.success ? topItemsResult.items.map(item => {
                    const wardrobeItem = wardrobeItems.find(wi => wi.id === item.id);
                    return {
                        ...item,
                        description: wardrobeItem?.description || 'Unknown item',
                        category: wardrobeItem?.category,
                        colors: wardrobeItem?.colors,
                        style: wardrobeItem?.style
                    };
                }) : [],
                topColorCombos: topColorsResult.success ? topColorsResult.combinations : [],
                favoriteItems: wardrobeItems.filter(item => item.favorite).map(item => ({
                    description: item.description,
                    category: item.category,
                    colors: item.colors,
                    style: item.style
                }))
            };

            // Generate recommendations using Gemini AI
            const recommendations = await geminiService.generateShoppingRecommendations(
                wardrobeAnalysis,
                userPreferences,
                limit
            );

            return {
                success: true,
                recommendations,
                wardrobeAnalysis
            };
        } catch (error) {
            console.error('Error generating recommendations:', error);
            return {
                success: false,
                error: error.message,
                recommendations: [],
                wardrobeAnalysis: null
            };
        }
    },

    // Filter recommendations by category
    getRecommendationsByCategory(recommendations, category) {
        if (!category || category === 'all') {
            return recommendations;
        }
        return recommendations.filter(rec => rec.category === category);
    },

    // Get current season based on month
    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }
};
