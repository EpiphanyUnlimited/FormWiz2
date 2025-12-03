export interface FormField {
  id: string;
  label: string; // The question or label found in the PDF
  value: string; // The user's answer
  rect: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000 from Gemini
  pageIndex: number;
  required?: boolean;
  section?: string; // Optional section heading
}

export type AppStep = 'upload' | 'analyzing' | 'interview' | 'review' | 'exporting';

export interface PDFDimensions {
  width: number;
  height: number;
}