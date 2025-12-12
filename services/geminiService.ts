import { FormField } from "../types";

export const analyzeFormImage = async (base64Image: string, pageIndex: number): Promise<FormField[]> => {
  try {
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base64Image, pageIndex }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const fields = await response.json();
    return fields;
  } catch (error) {
    console.error("Analysis Error:", error);
    throw error;
  }
};
