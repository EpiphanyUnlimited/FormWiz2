import { FormField } from "../types";

/**
 * Analyzes a form page image by calling the server-side Netlify function.
 *
 * The Gemini API key lives only in the Netlify environment — it is never
 * shipped to the browser. (Previously this module called Gemini directly,
 * which baked the API key into the client bundle.)
 */
export const analyzeFormImage = async (base64Image: string, pageIndex: number): Promise<FormField[]> => {
  const response = await fetch('/.netlify/functions/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, pageIndex }),
  });

  if (!response.ok) {
    let message = `Analysis failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body; keep the status-based message
    }
    throw new Error(message);
  }

  const fields = await response.json();
  return Array.isArray(fields) ? fields : [];
};
