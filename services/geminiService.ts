import { GoogleGenAI, Modality } from "@google/genai";
import type { LegoBlueprint, LegoBuildSize } from '../types';

// Fallback data in case of a JSON parsing failure from the API
const fallbackBlueprint: Omit<LegoBlueprint, 'legoImageData' | 'size'> = {
  title: "My Custom Brick Model",
  partsList: [
    { pieceId: "3001", pieceName: "2x4 Brick", color: "Red", quantity: 10, estimatedPrice: 0.12 },
    { pieceId: "3002", pieceName: "2x3 Brick", color: "Blue", quantity: 8, estimatedPrice: 0.10 },
    { pieceId: "3003", pieceName: "2x2 Brick", color: "Yellow", quantity: 15, estimatedPrice: 0.08 },
  ],
  totalPieces: 33,
  estimatedCost: 3.5,
  difficultyLevel: 'Intermediate',
  buildTime: '30-45 minutes',
  description: 'A creative brick model. The AI was unable to provide a detailed parts list, so this is an example breakdown.',
};

const createInitialImagePrompt = (size: LegoBuildSize): string => {
    let sizeDescription = '';
    switch (size) {
        case 'Micro':
            sizeDescription = `a "Micro" version, like a small desk toy. Drastically simplify the design, use a very low piece count (under 75 parts), and capture only the most essential features of the uploaded object.`;
            break;
        case 'Medium':
            sizeDescription = `a "Medium" version, suitable for a shelf display. This should look like a standard, official LEGO set with a balanced level of detail and a piece count between 100-300. It should be recognizable and well-proportioned.`;
            break;
        case 'Large':
            sizeDescription = `a "Large" version, a true room centerpiece. This should be a highly detailed and complex build, using a large number of pieces (400-1000 parts). Focus on accuracy and intricate building techniques. The final result must be clearly identifiable as a model built from standard LEGO bricks.`;
            break;
    }
    return `You are a LEGO expert. Your task is to generate a new image that recreates the uploaded object as a realistic, ${sizeDescription}. The final image must be clearly identifiable as a model built from standard LEGO bricks. The generated image MUST have a clean, white background, an isometric perspective, and should look like a photograph of a real LEGO model. Do not include any text in your response, only the generated image.`;
}

const getSizeConstraints = (size: LegoBuildSize) => {
  switch (size) {
    case 'Micro':
      return 'The model should be a "Micro" desk toy version. The total piece count must be under 75 parts. The parts list should reflect a simplified design, using fewer, common pieces.';
    case 'Medium':
      return 'The model should be a "Medium" display piece version. The total piece count must be between 100 and 300 parts. The parts list should be detailed, similar to an official LEGO set.';
    case 'Large':
      return 'The model should be a "Large" centerpiece version. The total piece count must be between 400 and 1000 parts. The parts list must reflect a highly detailed and complex build, prioritizing accuracy and intricate construction.';
    default:
      return 'The total piece count should be under 250 parts.';
  }
};

const createPartsListPrompt = (size: LegoBuildSize): string => `You are a LEGO building expert. The user has provided an image of a LEGO model. Your task is to analyze this image and provide a detailed parts list in JSON format. ${getSizeConstraints(size)}

IMPORTANT: The text part of your response MUST ONLY be the JSON object. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. Your entire text output must be the raw JSON string starting with { and ending with }.

The JSON must be valid and adhere to this exact structure:
{
  "title": "string",
  "partsList": [{ "pieceId": "string", "pieceName": "string", "color": "string", "quantity": number, "estimatedPrice": number }],
  "totalPieces": number,
  "estimatedCost": number,
  "difficultyLevel": "Beginner" | "Intermediate" | "Advanced",
  "buildTime": "string",
  "description": "string"
}
Generate a creative and descriptive title for the model. Ensure the estimatedPrice for each part is a number representing the price in USD. Calculate totalPieces and estimatedCost accurately based on the partsList.`;


const cleanJsonString = (str: string): string => {
  // Find the first '{' and the last '}' to reliably extract the JSON object,
  // ignoring markdown fences or other extraneous text.
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    // Return an empty object string if no valid JSON object is found.
    // This will cause a controlled failure in JSON.parse and trigger the fallback.
    console.error("Could not find a valid JSON object in the AI response.");
    return '{}';
  }
  
  return str.substring(firstBrace, lastBrace + 1);
};

export const generateLegoBlueprint = async (
    base64Image: string, 
    mimeType: string,
    initialSize: LegoBuildSize,
    setProgress: (message: string) => void
): Promise<LegoBlueprint> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1];

  // --- Step 1: Generate the LEGO Image from the original user upload ---
  setProgress(`Generating ${initialSize} LEGO version...`);
  const imageGenResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: createInitialImagePrompt(initialSize) },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  });

  const imageGenParts = imageGenResponse.candidates?.[0]?.content?.parts ?? [];
  const imagePart = imageGenParts.find(part => part.inlineData);

  if (!imagePart || !imagePart.inlineData) {
    throw new Error('AI failed to generate a LEGO image. Please try a different image.');
  }

  const legoImageData = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  const legoImageBase64 = imagePart.inlineData.data;
  const legoImageMimeType = imagePart.inlineData.mimeType;
  
  // Update progress for the user before starting the next AI call
  setProgress('Analyzing LEGO image for parts...');

  // --- Step 2: Generate the Parts List from the newly generated LEGO image ---
  const partsListResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
          parts: [
              { inlineData: { data: legoImageBase64, mimeType: legoImageMimeType } },
              { text: createPartsListPrompt(initialSize) },
          ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      }
  });

  const textPart = partsListResponse.candidates?.[0]?.content?.parts?.find(part => part.text);
  
  const fallbackResult = { ...fallbackBlueprint, legoImageData, size: initialSize };
  if (!textPart || !textPart.text) {
     return fallbackResult;
  }
  
  try {
    const cleanedJson = cleanJsonString(textPart.text);
    const parsedJson = JSON.parse(cleanedJson);
     // Basic validation to ensure we have a partsList and title
    if (!parsedJson.partsList || !Array.isArray(parsedJson.partsList) || !parsedJson.title) {
        throw new Error("Parsed JSON is missing 'partsList' array or 'title'.");
    }
    return {
      ...parsedJson,
      legoImageData: legoImageData,
      size: initialSize,
    };
  } catch (error) {
    console.error("Failed to parse JSON from AI response:", textPart.text);
    return fallbackResult;
  }
};

export const resizeLegoBlueprint = async (
    originalBase64Image: string,
    originalMimeType: string,
    targetSize: LegoBuildSize,
    setProgress: (message: string) => void
): Promise<LegoBlueprint> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const originalBase64Data = originalBase64Image.split(',')[1];
    
    // --- Step 1: Generate the NEW LEGO Image from the original user upload ---
    setProgress(`Generating ${targetSize} version...`);
    const imageGenResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: originalBase64Data, mimeType: originalMimeType } },
                { text: createInitialImagePrompt(targetSize) },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    const imageGenParts = imageGenResponse.candidates?.[0]?.content?.parts ?? [];
    const imagePart = imageGenParts.find(part => part.inlineData);

    if (!imagePart || !imagePart.inlineData) {
        throw new Error(`AI failed to generate the ${targetSize} LEGO image.`);
    }

    const legoImageData = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    const legoImageBase64 = imagePart.inlineData.data;
    const legoImageMimeType = imagePart.inlineData.mimeType;

    // --- Step 2: Generate the Parts List from the newly generated LEGO image ---
    setProgress('Analyzing new image for parts...');
    const partsListResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: legoImageBase64, mimeType: legoImageMimeType } },
                { text: createPartsListPrompt(targetSize) },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        }
    });

    const textPart = partsListResponse.candidates?.[0]?.content?.parts?.find(part => part.text);

    const fallbackResult = { ...fallbackBlueprint, legoImageData, size: targetSize };

    if (!textPart || !textPart.text) {
        return fallbackResult;
    }

    try {
        const cleanedJson = cleanJsonString(textPart.text);
        const parsedJson = JSON.parse(cleanedJson);
        if (!parsedJson.partsList || !Array.isArray(parsedJson.partsList) || !parsedJson.title) {
            throw new Error("Parsed JSON is missing required fields.");
        }
        return {
            ...parsedJson,
            legoImageData: legoImageData,
            size: targetSize,
        };
    } catch (error) {
        console.error("Failed to parse JSON from AI response:", textPart.text);
        return fallbackResult;
    }
};