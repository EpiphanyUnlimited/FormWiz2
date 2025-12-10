import { GoogleGenAI, Type } from "@google/genai";
import { FormField } from "../types";

const parseFieldsFromResponse = (text: string, pageIndex: number): FormField[] => {
  try {
    // Attempt to extract JSON if it's wrapped in markdown
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    
    const parsed = JSON.parse(jsonStr);
    
    if (Array.isArray(parsed)) {
      let currentSection = "";

      return parsed.map((item: any, idx: number) => {
        // Update section context if provided
        if (item.section) {
            currentSection = item.section;
        }

        return {
            id: `field-${pageIndex}-${idx}-${Date.now()}`,
            label: item.label || "Unknown Field",
            // Use current section if item doesn't have one
            section: item.section || currentSection || undefined,
            value: "",
            rect: item.box_2d || [0, 0, 0, 0],
            pageIndex: pageIndex,
            required: item.required ?? false
        };
      });
    }
    return [];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const analyzeFormImage = async (base64Image: string, pageIndex: number): Promise<FormField[]> => {
  try {
    if (!process.env.API_KEY) {
      throw new Error("API Key not found. Please ensure it is configured.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Strip header from base64 if present
    const data = base64Image.split(',')[1];

    const prompt = `
      Analyze this form page image and extract the data entry fields.

      GUIDELINES:
      1. Identify input fields where a user would write an answer (text boxes, checkboxes, lines).
      2. For each field, identify the Question Label (e.g. "Full Name", "Date of Birth").
      3. **Bounding Boxes**:
         - Define the 'box_2d' for the **ANSWER AREA** (empty space), not the label.
         - Coordinates must be normalized [ymin, xmin, ymax, xmax] (0-1000).
         - Ensure the box does not overlap the label text.
      4. **Structure**:
         - If fields are numbered (1, 2, 3), use those numbers in the label.
         - Group related small fields (like City, State, Zip) into one logical question if they belong to a single "Address" block, OR keep them separate if they are distinct.
      5. **Section**: If there is a header (e.g. "Part I"), include it.

      Return a JSON array. If no clear fields are found, return an empty array.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              section: { type: Type.STRING },
              box_2d: { 
                type: Type.ARRAY,
                items: { type: Type.NUMBER } // Changed from INTEGER to NUMBER for flexibility
              },
              required: { type: Type.BOOLEAN }
            },
            required: ["label", "box_2d", "required"]
          }
        }
      }
    });

    return parseFieldsFromResponse(response.text || "[]", pageIndex);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};