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
  if (!Array.isArray(fields)) return [];

  // Gemini's box for text fields tends to hug the ruled answer LINE itself
  // (a thin box straddling it), but answers are written ABOVE the line —
  // lift thin boxes to cover the writing area. Checkboxes stay untouched.
  return fields.map((field: FormField) => {
    if (field.type === 'checkbox' || !Array.isArray(field.rect)) return field;
    const [ymin, xmin, ymax, xmax] = field.rect;
    const h = ymax - ymin;
    if (h >= 25) return field; // already a tall writing-area box
    // The ruled line runs through the vertical CENTER of the thin box;
    // anchor the writing area's bottom right on it so boxes hug the line.
    const line = ymin + h / 2;
    const writeHeight = Math.min(Math.max(h * 2.5, 22), 45);
    return {
      ...field,
      rect: [Math.max(line - writeHeight, 0), xmin, line, xmax] as [number, number, number, number],
    };
  });
};
