import { db, storage } from '../firebase.config';
import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { azureService as geminiService } from './azureService';

export const outfitService = {
    // Generate outfit
    async generateOutfit(userId, wardrobeItems, constraints) {
        try {
            const outfitSuggestion = await geminiService.generateOutfit(wardrobeItems, constraints);

            // Match AI suggestions to actual wardrobe items
            const selectedItems = this.matchOutfitItems(outfitSuggestion.outfit, wardrobeItems, constraints.anchorItem);

            // Save outfit to history
            const outfitData = {
                userId,
                items: wardrobeItems.map(item => item.id),
                selectedItems: selectedItems.map(item => ({
                    id: item.id,
                    imageUrl: item.imageUrl,
                    description: item.description,
                    category: item.category,
                    colors: item.colors || []
                })),
                occasion: constraints.occasion || '',
                weather: constraints.weather || null,
                aiSuggestion: outfitSuggestion,
                imageUrl: null, // Will be updated after image generation
                favorite: false,
                rating: null,        // NEW: 1-5 stars or null
                ratedAt: null,       // NEW: timestamp when rated
                wornAt: null,        // NEW: when user wore this outfit
                createdAt: new Date()
            };

            const docRef = await addDoc(collection(db, 'outfits'), outfitData);
            return { success: true, id: docRef.id, outfit: outfitSuggestion, selectedItems };
        } catch (error) {
            console.error('Error generating outfit:', error);
            return { success: false, error: error.message };
        }
    },

    // Match AI outfit suggestions to actual wardrobe items
    matchOutfitItems(outfitSuggestion, wardrobeItems, anchorItem) {
        const matched = [];

        // Helper function to find best match for a category
        const findBestMatch = (category, aiDescription) => {
            const categoryItems = wardrobeItems.filter(item => item.category === category);

            if (categoryItems.length === 0) return null;

            // If anchor item matches this category, use it
            if (anchorItem && anchorItem.category === category) {
                return anchorItem;
            }

            // If we have AI description, try to match by keywords
            if (aiDescription) {
                const keywords = aiDescription.toLowerCase().split(' ');

                // Score each item based on description and color matches
                const scoredItems = categoryItems.map(item => {
                    let score = 0;
                    const itemDesc = (item.description || '').toLowerCase();
                    const itemColors = (item.colors || []).map(c => c.toLowerCase());

                    // Check description keywords
                    keywords.forEach(keyword => {
                        if (itemDesc.includes(keyword)) score += 2;
                        if (itemColors.some(color => color.includes(keyword) || keyword.includes(color))) score += 3;
                    });

                    // Boost favorites
                    if (item.favorite) score += 1;

                    return { item, score };
                });

                // Sort by score and return best match
                scoredItems.sort((a, b) => b.score - a.score);
                if (scoredItems[0].score > 0) {
                    return scoredItems[0].item;
                }
            }

            // Fallback: return favorite or first item
            return categoryItems.find(item => item.favorite) || categoryItems[0];
        };

        // Match each category from AI suggestion
        if (outfitSuggestion.top) {
            const match = findBestMatch('top', outfitSuggestion.top);
            if (match) matched.push(match);
        }

        if (outfitSuggestion.bottom) {
            const match = findBestMatch('bottom', outfitSuggestion.bottom);
            if (match) matched.push(match);
        }

        if (outfitSuggestion.shoes) {
            const match = findBestMatch('shoes', outfitSuggestion.shoes);
            if (match) matched.push(match);
        }

        if (outfitSuggestion.outerwear) {
            const match = findBestMatch('outerwear', outfitSuggestion.outerwear);
            if (match) matched.push(match);
        }

        // Handle accessories (can be multiple)
        if (outfitSuggestion.accessories && outfitSuggestion.accessories.length > 0) {
            const accessoryItems = wardrobeItems.filter(item => item.category === 'accessory');
            // Add up to 2 accessories
            matched.push(...accessoryItems.slice(0, Math.min(2, outfitSuggestion.accessories.length)));
        }

        return matched;
    },

    // Get outfit history
    async getOutfitHistory(userId) {
        try {
            const q = query(
                collection(db, 'outfits'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const outfits = [];

            querySnapshot.forEach((doc) => {
                outfits.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, outfits };
        } catch (error) {
            console.error('Error getting outfit history:', error);
            return { success: false, error: error.message, outfits: [] };
        }
    },

    // Toggle favorite
    async toggleFavorite(outfitId, currentFavoriteStatus) {
        try {
            const outfitRef = doc(db, 'outfits', outfitId);
            await updateDoc(outfitRef, { favorite: !currentFavoriteStatus });
            return { success: true };
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return { success: false, error: error.message };
        }
    },

    // Update outfit with generated image
    async updateOutfitImage(outfitId, imageUrl) {
        try {
            console.log('updateOutfitImage called with:', { outfitId, imageUrlLength: imageUrl?.length });

            // Check if image data is too large (Firestore has 1MB limit per document)
            const imageSizeKB = imageUrl ? (imageUrl.length * 3 / 4) / 1024 : 0;
            console.log('Image size:', imageSizeKB.toFixed(2), 'KB');

            let finalImageUrl = imageUrl;

            // If image is too large, upload to Firebase Storage instead
            if (imageSizeKB > 900) {
                console.log('Image too large for Firestore, uploading to Storage...');

                try {
                    // Convert base64 to blob
                    const base64Data = imageUrl.split(',')[1];
                    const mimeType = imageUrl.match(/data:([^;]+);/)[1];
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: mimeType });

                    // Upload to Firebase Storage
                    const storageRef = ref(storage, `outfit-images/${outfitId}.png`);
                    await uploadBytes(storageRef, blob);
                    finalImageUrl = await getDownloadURL(storageRef);

                    console.log('Image uploaded to Storage, URL:', finalImageUrl);
                } catch (storageError) {
                    console.error('Error uploading to Storage:', storageError);
                    return { success: false, error: storageError.message };
                }
            }

            const outfitRef = doc(db, 'outfits', outfitId);
            await updateDoc(outfitRef, { imageUrl: finalImageUrl });
            console.log('Image URL successfully saved to Firestore');
            return { success: true };
        } catch (error) {
            console.error('Error updating outfit image:', error);
            return { success: false, error: error.message };
        }
    },

    // Rate an outfit
    async rateOutfit(outfitId, rating, wornAt = null) {
        try {
            const outfitRef = doc(db, 'outfits', outfitId);
            const updates = {
                rating,
                ratedAt: new Date()
            };

            if (wornAt) {
                updates.wornAt = wornAt;
            }

            await updateDoc(outfitRef, updates);
            return { success: true };
        } catch (error) {
            console.error('Error rating outfit:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete an outfit
    async deleteOutfit(outfitId) {
        try {
            const outfitRef = doc(db, 'outfits', outfitId);
            await deleteDoc(outfitRef);
            return { success: true };
        } catch (error) {
            console.error('Error deleting outfit:', error);
            return { success: false, error: error.message };
        }
    }
};
