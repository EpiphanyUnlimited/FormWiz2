export interface FormField {
  id: string;
  label: string; // The question or label found in the PDF
  value: string; // The user's answer. "true"/"false" for checkboxes.
  rect: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000 from Gemini
  pageIndex: number;
  required?: boolean;
  section?: string; // Optional section heading
  type?: 'text' | 'checkbox' | 'radio'; // Type of input
  groupLabel?: string; // To group 3A, 3B, etc.
  commonType?: 'ssn' | 'email' | 'phone' | 'date' | 'name' | 'address' | 'zip'; // For smart formatting
}

export type AppStep = 'upload' | 'analyzing' | 'setup' | 'interview' | 'review' | 'exporting';

export interface PDFDimensions {
  width: number;
  height: number;
}