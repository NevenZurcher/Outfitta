import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const geminiService = {
    // Analyze clothing item(s) from image - can detect multiple items
    async analyzeClothing(imageFile) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            // Convert image to base64
            const base64Image = await fileToBase64(imageFile);

            const prompt = `Analyze this image and detect ALL individual clothing items visible.

For EACH distinct clothing item found, provide:
{
  "items": [
    {
      "category": "one of: top, bottom, shoes, outerwear, accessory, dress, suit",
      "colors": ["primary color", "secondary color if any"],
      "season": ["spring", "summer", "fall", "winter"],
      "style": ["casual", "formal", "sporty", "elegant", etc.],
      "description": "brief description of the item",
      "confidence": 0.95
    }
  ]
}

Rules:
- Detect ALL items, even if worn together in an outfit
- Each item should be a separate object in the array
- If only one item is visible, return an array with one object
- Set confidence (0-1) based on visibility and clarity
- Only respond with valid JSON, no additional text`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        mimeType: imageFile.type,
                        data: base64Image
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text();

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                // Ensure we always return an array
                return parsed.items || [parsed];
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Error analyzing clothing:', error);
            throw error;
        }
    },

    // Generate outfit suggestions
    async generateOutfit(wardrobeItems, constraints = {}) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

            const { weather, occasion, anchorItem, style, userPreferences } = constraints;

            const wardrobeDescription = wardrobeItems.map(item =>
                `${item.category}: ${item.description} (${item.colors.join(', ')})${item.favorite ? ' [FAVORITE]' : ''}`
            ).join('\n');

            let prompt = `You are a professional fashion stylist. Based on the following wardrobe items, suggest a complete outfit.

Available items:
${wardrobeDescription}

Constraints:`;

            if (weather) {
                prompt += `\n- Weather: ${weather.temp}°F, ${weather.condition}`;
            }
            if (occasion) {
                prompt += `\n- Occasion: ${occasion}`;
            }
            if (anchorItem) {
                prompt += `\n- Must include: ${anchorItem.description}`;
            }
            if (style) {
                prompt += `\n- Style preference: ${style}`;
            }

            // Add learned preferences from ratings
            if (userPreferences) {
                prompt += `\n\nUser Preferences (learned from ${userPreferences.totalRatings || 0} rated outfits):`;

                if (userPreferences.topItems && userPreferences.topItems.length > 0) {
                    const topItemsDesc = userPreferences.topItems
                        .map(item => `${item.description} (${item.avgRating.toFixed(1)}★)`)
                        .join(', ');
                    prompt += `\n- Highly rated items: ${topItemsDesc}`;
                    prompt += `\n  → STRONGLY PREFER these items in the outfit`;
                }

                if (userPreferences.topColorCombos && userPreferences.topColorCombos.length > 0) {
                    const colorCombos = userPreferences.topColorCombos
                        .map(combo => `${combo.colors} (${combo.avgRating.toFixed(1)}★)`)
                        .join(', ');
                    prompt += `\n- Successful color combinations: ${colorCombos}`;
                    prompt += `\n  → Try to use these color pairings`;
                }

                if (userPreferences.lowRatedItems && userPreferences.lowRatedItems.length > 0) {
                    const lowItemsDesc = userPreferences.lowRatedItems
                        .map(item => `${item.description} (${item.avgRating.toFixed(1)}★)`)
                        .join(', ');
                    prompt += `\n- Items to avoid: ${lowItemsDesc}`;
                    prompt += `\n  → AVOID using these items unless absolutely necessary`;
                }
            }

            prompt += `\n\nProvide a JSON response with:
      {
        "outfit": {
          "top": "item description or null",
          "bottom": "item description or null",
          "shoes": "item description or null",
          "outerwear": "item description or null",
          "accessories": ["item descriptions"]
        },
        "reasoning": "brief explanation of why this outfit works",
        "tips": "styling tips",
        "visualPrompt": "A detailed, photorealistic description of this complete outfit for image generation. Describe a fashion model wearing the exact outfit in a setting appropriate for the occasion. Include specific details about each clothing item, colors, and the overall aesthetic."
      }
      
      Only respond with valid JSON.`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            throw new Error('Failed to parse AI response');
        } catch (error) {
            console.error('Error generating outfit:', error);
            throw error;
        }
    },

    // Generate outfit image using Gemini 2.5 Flash Image
    async generateOutfitImage(visualPrompt) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

            // Create a detailed prompt for image generation
            const imagePrompt = `Professional fashion photography: ${visualPrompt}. Studio lighting, high quality, detailed, 4k resolution, fashion magazine style.`;

            const result = await model.generateContent(imagePrompt);
            const response = await result.response;

            // Check if response contains image data
            if (response.candidates && response.candidates[0]) {
                const candidate = response.candidates[0];

                // Try to extract image from response
                if (candidate.content && candidate.content.parts) {
                    for (const part of candidate.content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            // Return base64 image data
                            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        }
                    }
                }
            }

            console.warn('No image data found in response');
            return null;
        } catch (error) {
            console.warn('Image generation unavailable:', error.message);
            return null;
        }
    }
};

// Helper function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}
