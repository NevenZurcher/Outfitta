import { db, storage } from '../firebase.config';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { geminiService } from './geminiService';

export const wardrobeService = {
    // Add new clothing item
    async addItem(userId, imageFile, additionalData = {}) {
        try {
            // Upload image to Firebase Storage
            const imageRef = ref(storage, `wardrobe/${userId}/${Date.now()}_${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(imageRef);

            // Analyze clothing with Gemini Vision - now returns array
            const detectedItems = await geminiService.analyzeClothing(imageFile);

            // If multiple items detected, only use the first one for single upload
            const aiAnalysis = Array.isArray(detectedItems) ? detectedItems[0] : detectedItems;

            // Create wardrobe item document
            const itemData = {
                userId,
                imageUrl,
                imagePath: imageRef.fullPath,
                category: aiAnalysis.category || additionalData.category || 'other',
                colors: aiAnalysis.colors || [],
                season: aiAnalysis.season || [],
                style: aiAnalysis.style || [],
                description: aiAnalysis.description || '',
                confidence: aiAnalysis.confidence || 1.0,
                aiAnalysis,
                favorite: false,
                createdAt: new Date(),
                ...additionalData
            };

            const docRef = await addDoc(collection(db, 'wardrobe'), itemData);
            return {
                success: true,
                id: docRef.id,
                data: itemData,
                detectedCount: Array.isArray(detectedItems) ? detectedItems.length : 1
            };
        } catch (error) {
            console.error('Error adding item:', error);
            return { success: false, error: error.message };
        }
    },

    // Get all wardrobe items for a user
    async getItems(userId) {
        try {
            const q = query(
                collection(db, 'wardrobe'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(q);
            const items = [];

            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            return { success: true, items };
        } catch (error) {
            console.error('Error getting items:', error);
            return { success: false, error: error.message, items: [] };
        }
    },

    // Update wardrobe item
    async updateItem(itemId, updates) {
        try {
            const itemRef = doc(db, 'wardrobe', itemId);
            await updateDoc(itemRef, updates);
            return { success: true };
        } catch (error) {
            console.error('Error updating item:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete wardrobe item
    // Delete wardrobe item
    async deleteItem(itemId, imagePath) {
        try {
            // Delete document from Firestore FIRST
            await deleteDoc(doc(db, 'wardrobe', itemId));

            // Check if any OTHER items use the same image path
            if (imagePath) {
                const q = query(
                    collection(db, 'wardrobe'),
                    where('imagePath', '==', imagePath)
                );
                const snapshot = await getDocs(q);

                // If no other documents use this image, delete it from storage
                if (snapshot.empty) {
                    const imageRef = ref(storage, imagePath);
                    await deleteObject(imageRef);
                } else {
                    console.log('Image preserved as it is used by other items');
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting item:', error);
            return { success: false, error: error.message };
        }
    },

    // Toggle favorite status
    async toggleFavorite(itemId, currentFavoriteStatus) {
        try {
            const itemRef = doc(db, 'wardrobe', itemId);
            await updateDoc(itemRef, { favorite: !currentFavoriteStatus });
            return { success: true };
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return { success: false, error: error.message };
        }
    },

    // Toggle laundry status
    async toggleLaundry(itemId, currentLaundryStatus) {
        try {
            const itemRef = doc(db, 'wardrobe', itemId);
            const updates = {
                inLaundry: !currentLaundryStatus,
                laundryDate: !currentLaundryStatus ? new Date() : null
            };
            await updateDoc(itemRef, updates);
            return { success: true };
        } catch (error) {
            console.error('Error toggling laundry:', error);
            return { success: false, error: error.message };
        }
    },

    // Bulk upload multiple images with multi-item detection
    // Step 1: Analyze images without saving
    async analyzeImages(imageFiles, onProgress = null) {
        const results = {
            success: true,
            totalFiles: imageFiles.length,
            detectedItems: [],
            errors: []
        };

        for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];

            try {
                if (onProgress) {
                    onProgress({
                        currentFile: i + 1,
                        totalFiles: imageFiles.length,
                        fileName: file.name,
                        status: 'analyzing'
                    });
                }

                const detectedItems = await geminiService.analyzeClothing(file);

                // Add file reference to each detected item for later saving
                const itemsWithFile = detectedItems.map(item => ({
                    ...item,
                    originalFile: file,
                    fileName: file.name
                }));

                results.detectedItems.push(...itemsWithFile);

                if (onProgress) {
                    onProgress({
                        currentFile: i + 1,
                        totalFiles: imageFiles.length,
                        fileName: file.name,
                        status: 'detected',
                        detectedCount: detectedItems.length
                    });
                }

            } catch (error) {
                console.error(`Error analyzing file ${file.name}:`, error);
                results.errors.push({
                    fileName: file.name,
                    error: error.message
                });

                if (onProgress) {
                    onProgress({
                        currentFile: i + 1,
                        totalFiles: imageFiles.length,
                        fileName: file.name,
                        status: 'error',
                        error: error.message
                    });
                }
            }
        }

        results.success = results.errors.length === 0;
        return results;
    },

    // Step 2: Save analyzed items to Wardrobe
    async saveMultipleItems(userId, itemsToSave, onProgress = null) {
        const results = {
            success: true,
            totalItems: itemsToSave.length,
            savedItems: [],
            errors: []
        };

        // Group items by file to avoid re-uploading the same image multiple times
        const fileMap = new Map();
        itemsToSave.forEach(item => {
            if (!fileMap.has(item.fileName)) {
                fileMap.set(item.fileName, item.originalFile);
            }
        });

        const uploadedImages = new Map(); // fileName -> { imageUrl, imagePath }

        // Process uploads first (unique files)
        const uniqueFiles = Array.from(fileMap.entries());

        for (let i = 0; i < uniqueFiles.length; i++) {
            const [fileName, file] = uniqueFiles[i];

            try {
                if (onProgress) {
                    onProgress({
                        status: 'uploading',
                        fileName,
                        current: i + 1,
                        total: uniqueFiles.length
                    });
                }

                // Check if we already have the URL (e.g. from previous step if we passed it? No, we analyze raw files)
                // Upload image
                const imageRef = ref(storage, `wardrobe/${userId}/${Date.now()}_${fileName}`);
                await uploadBytes(imageRef, file);
                const imageUrl = await getDownloadURL(imageRef);

                uploadedImages.set(fileName, { imageUrl, imagePath: imageRef.fullPath });

            } catch (error) {
                console.error(`Error uploading file ${fileName}:`, error);
                results.errors.push({ fileName, error: 'Failed to upload image' });
            }
        }

        // Now save items to Firestore
        for (let i = 0; i < itemsToSave.length; i++) {
            const item = itemsToSave[i];
            const uploadInfo = uploadedImages.get(item.fileName);

            if (!uploadInfo) {
                // Skip items whose image failed to upload
                continue;
            }

            try {
                if (onProgress) {
                    onProgress({
                        status: 'saving',
                        itemDesc: item.description,
                        current: i + 1,
                        total: itemsToSave.length
                    });
                }

                // Create a clean copy of analysis data without the File object
                const { originalFile, ...cleanAnalysis } = item;

                const itemData = {
                    userId,
                    imageUrl: uploadInfo.imageUrl,
                    imagePath: uploadInfo.imagePath,
                    category: item.category || 'other',
                    colors: item.colors || [],
                    season: item.season || [],
                    style: item.style || [],
                    description: item.description || '',
                    confidence: item.confidence || 1.0,
                    aiAnalysis: cleanAnalysis, // Store sanitized analysis
                    favorite: false,
                    createdAt: new Date()
                };

                const docRef = await addDoc(collection(db, 'wardrobe'), itemData);
                results.savedItems.push({ id: docRef.id, ...itemData });

            } catch (error) {
                console.error('Error saving item:', error);
                results.errors.push({ itemDex: item.description, error: error.message });
            }
        }

        results.success = results.errors.length === 0;
        return results;
    },

    // Legacy/Combined method (can be kept for simplistic usage)
    async addMultipleItems(userId, imageFiles, onProgress = null) {
        // ... (implementation using above methods could be done, but for now leave as is or remove?)
        // Let's replace it with a wrapper that calls both
        const analysis = await this.analyzeImages(imageFiles, onProgress);
        if (analysis.detectedItems.length > 0) {
            return await this.saveMultipleItems(userId, analysis.detectedItems, onProgress);
        }
        return analysis;
    }
};
