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
            section: item.section || currentSection || undefined,
            value: item.type === 'checkbox' ? "false" : "",
            rect: item.box_2d || [0, 0, 0, 0],
            pageIndex: pageIndex,
            required: item.required ?? false,
            type: item.type || 'text',
            groupLabel: item.group_label,
            commonType: item.common_type
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

      CRITICAL RULES:
      1. **Segmented Fields (SSN, EIN, Dates)**: If you see a field split into multiple small boxes for individual characters (e.g. | | | - | | - | | | |), DO NOT detect them as separate fields. Detect the ENTIRE area as a SINGLE 'text' field.
      2. **Checkboxes**: Only mark as 'checkbox' if it is literally a square box intended for a checkmark. If it is a line or a large rectangular area for writing, it is 'text'.
      3. **Text vs Checkbox**: 
         - A question asking "Business name" or "Address" is ALWAYS 'text'.
         - A question with options like "Individual", "C Corp", "S Corp" are 'checkbox'.
      4. **Ignore Noise**: Do not create fields for "Office Use Only", form footers, page numbers, or instructional text blocks that do not require input.
      5. **Smart Types**: Identify if the field expects specific PII (common_type): 'ssn', 'email', 'phone', 'date', 'name', 'address', 'zip'.

      OUTPUT STRUCTURE (JSON Array):
      [
        { 
          "label": "Social Security Number", 
          "type": "text", 
          "common_type": "ssn",
          "box_2d": [ymin, xmin, ymax, xmax] 
        }
      ]
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
              group_label: { type: Type.STRING, description: "The main question number or ID this field belongs to (e.g. '3')" },
              type: { type: Type.STRING, enum: ["text", "checkbox"] },
              common_type: { type: Type.STRING, enum: ["ssn", "email", "phone", "date", "name", "address", "zip"] },
              box_2d: { 
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
              },
              required: { type: Type.BOOLEAN }
            },
            required: ["label", "box_2d", "type"]
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