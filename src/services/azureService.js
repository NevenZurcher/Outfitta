import { AzureOpenAI } from "openai";

const client = new AzureOpenAI({
    endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT,
    apiKey: import.meta.env.VITE_AZURE_OPENAI_KEY,
    apiVersion: "2024-05-01-preview",
    deployment: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT,
    dangerouslyAllowBrowser: true // Required for client-side usage
});

export const azureService = {
    // Analyze clothing item(s) from image - can detect multiple items
    async analyzeClothing(imageFile) {
        try {
            const base64Image = await fileToBase64(imageFile);
            const dataUrl = `data:${imageFile.type};base64,${base64Image}`;

            const response = await client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert fashion assistant capable of detecting and describing clothing items in detail. You output strict JSON."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Analyze this image and detect ALL individual clothing items visible.
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
- Detect ALL items
- Each item separate object
- Valid JSON only`
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: dataUrl
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT
            });

            const content = response.choices[0].message.content;
            const parsed = JSON.parse(content);
            return parsed.items || [parsed];
        } catch (error) {
            console.error('Error analyzing clothing:', error);
            throw error;
        }
    },

    // Generate outfit suggestions
    async generateOutfit(wardrobeItems, constraints = {}) {
        try {
            const { weather, occasion, anchorItem, style, userPreferences } = constraints;

            const wardrobeDescription = wardrobeItems.map(item =>
                `${item.category}: ${item.description} (${item.colors.join(', ')})`
            ).join('\n');

            let prompt = `You are a professional fashion stylist. Based on the following wardrobe items, suggest a complete outfit.

Available items:
${wardrobeDescription}

Constraints:`;

            if (weather) prompt += `\n- Weather: ${weather.temp}°F, ${weather.condition}`;
            if (occasion) prompt += `\n- Occasion: ${occasion}`;
            if (anchorItem) prompt += `\n- Must include: ${anchorItem.description}`;
            if (style) prompt += `\n- Style preference: ${style}`;

            if (userPreferences?.gender) {
                prompt += `\n- User Gender: ${userPreferences.gender}`;
                if (userPreferences.gender.toLowerCase() === 'male') {
                    prompt += `\n  IMPORTANT: Do NOT suggest dresses, skirts, or female-only items.`;
                }
            }

            if (userPreferences) {
                // Add preferences logic similar to original...
                if (userPreferences.topItems?.length > 0) {
                    prompt += `\n- Avoid: ${userPreferences.lowRatedItems?.map(i => i.description).join(', ') || 'None'}`;
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
        "reasoning": "brief explanation",
        "tips": "styling tips",
        "visualPrompt": "A detailed photorealistic description for image generation."
      }`;

            const response = await client.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful fashion stylist that outputs JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content);

        } catch (error) {
            console.error('Error generating outfit:', error);
            throw error;
        }
    },

    // Generate outfit image - Placeholder as GPT-4o doesn't generate images natively
    async generateOutfitImage(visualPrompt) {
        console.warn("Image generation requires DALL-E 3 deployment. Returning null.");
        return null;
    },

    // Generate shopping recommendations
    async generateShoppingRecommendations(wardrobeAnalysis, userPreferences, limit = 8) {
        try {
            let prompt = `You are a professional fashion stylist. Recommend ${limit} new clothing items.
WARDROBE ANALYSIS:
- Total items: ${wardrobeAnalysis.totalItems}
- Missing: ${wardrobeAnalysis.missingCategories.join(', ')}

USER PREFERENCES:
`;

            if (userPreferences?.gender) {
                prompt += `\n- User Gender: ${userPreferences.gender}`;
                if (userPreferences.gender.toLowerCase() === 'male') {
                    prompt += `\n  IMPORTANT: Do NOT suggest dresses, skirts, heels, blouses, bikinis, or other typically female-only items. Suggest MEN'S clothing only.`;
                }
            }

            if (userPreferences.totalRatings > 0) {
                if (userPreferences.topItems?.length > 0) {
                    const topItems = userPreferences.topItems.map(i => i.description).join(', ');
                    prompt += `\n- User likes: ${topItems}`;
                }
                if (userPreferences.lowRatedItems?.length > 0) {
                    const lowItems = userPreferences.lowRatedItems.map(i => i.description).join(', ');
                    prompt += `\n- User dislikes/avoids: ${lowItems}`;
                    prompt += `\n- AVOID recommending items similar to the dislikes (e.g., if checking formal wear is disliked, suggest casual).`;
                }
            }

            // Add style distribution if available to reinforce their usual style
            if (wardrobeAnalysis.styleDistribution) {
                const styles = Object.entries(wardrobeAnalysis.styleDistribution)
                    .map(([style, count]) => `${style} (${count})`)
                    .join(', ');
                prompt += `\n- Current Wardrobe Styles: ${styles}`;
                prompt += `\n- Match the user's existing style preferences unless they are missing basic essentials.`;
            }

            prompt += `\n\nReturn JSON:
{
  "recommendations": [
    {
      "category": "...",
      "itemType": "...",
      "description": "...",
      "suggestedColors": [],
      "suggestedStyle": [],
      "reasoning": "...",
      "pairsWith": [],
      "priority": "high/medium/low"
    }
  ]
}`;

            const response = await client.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a personal shopper that outputs JSON." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                model: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content).recommendations || [];
        } catch (error) {
            console.error('Error shopping recommendations:', error);
            throw error;
        }
    }
};

// Helper
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the data:image/xxx;base64, prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}
