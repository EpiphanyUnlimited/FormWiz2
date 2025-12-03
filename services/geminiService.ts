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
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Strip header from base64 if present
    const data = base64Image.split(',')[1];

    const prompt = `
      Analyze this form page. Extract ONLY the main logical questions.

      STRICT RULES FOR EXTRACTION:
      1. **Follow the Numbers**: If the questions are numbered (1, 2, 3, etc.), ONLY output those numbered items. 
         - IGNORE any sub-labels like "City", "State", "Zip", "First Name", "Last Name" unless they have their own number.
         - Combine sub-fields into the main numbered question. 
         - Example: If "1. Address" has boxes for Street, City, State, create ONE field labeled "1. Address" that covers all those boxes.
      
      2. **Top-Down Priority**: Start from the very top. Capture the very first question.
      
      3. **Consolidate**: 
         - A table row = ONE question.
         - A "Yes/No" section = ONE question.
         - A date input (MM/DD/YYYY) = ONE question.
      
      4. **Expected Count**: A typical page has 10-15 main questions. If you find 20+, you are splitting them up too much. STOP splitting.

      5. **Section Headings**: Identify the visual section title or header this question belongs to (e.g. "Part 1: Personal Info", "Employment History"). 

      6. **Bounding Boxes (CRITICAL - NO OVERLAP)**: 
         - **SEPARATE QUESTION FROM ANSWER**: The bounding box (\`box_2d\`) must contain **ONLY** the blank writing space.
         - **START BELOW TEXT**: The top edge (\`ymin\`) of the answer box must be strictly **BELOW** the bottom edge of the question text.
         - **VISUAL GAP**: Ensure there is a visible whitespace gap between the text of the question and the top of the answer box.
         - **Full Area**: Extend the box to the bottom of the available writing space.
         - **Normalized Coordinates**: [ymin, xmin, ymax, xmax] (0-1000).

      For each main question, return:
      - "label": The main question text (e.g. "1. Full Name").
      - "section": The section title (optional).
      - "box_2d": The bounding box [ymin, xmin, ymax, xmax] (0-1000) for the ANSWER area.
      - "required": boolean.
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
                items: { type: Type.INTEGER }
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