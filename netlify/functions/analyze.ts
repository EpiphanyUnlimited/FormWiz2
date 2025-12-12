
import { Handler, HandlerEvent } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";
import { FormField } from "../../src/types";

const parseFieldsFromResponse = (text: string, pageIndex: number): FormField[] => {
  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;
    const parsed = JSON.parse(jsonStr);
    
    if (Array.isArray(parsed)) {
      let currentSection = "";
      return parsed.map((item: any, idx: number) => {
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
      }).filter(f => {
          const label = f.label.toLowerCase();
          const isSignature = label.includes('signature') || label.includes('sign here') || label.includes('applicant signature');
          return !isSignature;
      });
    }
    return [];
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

const analyzeFormImage = async (base64Image: string, pageIndex: number): Promise<FormField[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found. Please ensure it is configured in your Netlify environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const data = base64Image.split(',')[1];
  const prompt = `
    Analyze this form page image and extract the data entry fields.
    CRITICAL RULES:
    1. **Segmented Fields**: If a field is split into boxes (e.g. | | |), detect as ONE single field.
    2. **Checkboxes**: Only mark square boxes as 'checkbox'.
    3. **Text vs Checkbox**: "Business name" -> 'text'. "C Corp" -> 'checkbox'.
    4. **Ignore Noise**: Do not create fields for "Office Use Only", page numbers.
    5. **NO SIGNATURES**: Do not create fields for signatures, "Sign Here", "Signature of Applicant", or "By:" lines. These require wet signatures.
    6. **Smart Types**: Identify 'ssn', 'email', 'phone', 'date', 'name', 'address', 'zip'.

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
        { inlineData: { mimeType: 'image/jpeg', data: data } },
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
            box_2d: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            required: { type: Type.BOOLEAN }
          },
          required: ["label", "box_2d", "type"]
        }
      }
    }
  });

  return parseFieldsFromResponse(response.text || "[]", pageIndex);
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { base64Image, pageIndex } = JSON.parse(event.body || '{}');

    if (!base64Image || typeof pageIndex === 'undefined') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing base64Image or pageIndex' }) };
    }

    const fields = await analyzeFormImage(base64Image, pageIndex);
    return {
      statusCode: 200,
      body: JSON.stringify(fields),
    };
  } catch (error) {
    console.error("Handler Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
