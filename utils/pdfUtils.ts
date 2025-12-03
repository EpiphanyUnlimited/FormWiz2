import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { FormField } from '../types';

// Declare global variable for PDF.js loaded via script tag
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export const convertPDFToImages = async (file: File): Promise<{ images: string[]; dimensions: { width: number; height: number }[] }> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const images: string[] = [];
  const dimensions: { width: number; height: number }[] = [];

  // Increase limit to 50 pages.
  const limit = Math.min(numPages, 50);

  for (let i = 1; i <= limit; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 }); // Good quality for OCR
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      images.push(canvas.toDataURL('image/jpeg', 0.8));
      dimensions.push({ width: viewport.width, height: viewport.height });
    }
  }

  return { images, dimensions };
};

const breakTextIntoLines = (text: string, size: number, font: PDFFont, maxWidth: number): string[] => {
  // Safety check: ensure maxWidth is positive to prevent infinite loops or weird behavior
  const effectiveMaxWidth = Math.max(maxWidth, 20); 
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(currentLine + " " + word, size);
    if (width < effectiveMaxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

export const generateFilledPDF = async (originalFile: File, fields: FormField[]): Promise<Uint8Array> => {
  try {
    const arrayBuffer = await originalFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pages = pdfDoc.getPages();

    for (const field of fields) {
      if (!field.value) continue;
      
      // Safety check: Page Index validity
      if (field.pageIndex < 0 || field.pageIndex >= pages.length) {
          console.warn(`Skipping field ${field.label}: Page index ${field.pageIndex} out of bounds.`);
          continue;
      }

      const page = pages[field.pageIndex];
      const { width, height } = page.getSize();

      let [ymin, xmin, ymax, xmax] = field.rect;
      
      // Safety check: Ensure coordinates are numbers and not NaN
      if ([ymin, xmin, ymax, xmax].some(c => typeof c !== 'number' || isNaN(c))) {
          console.warn(`Skipping field ${field.label}: Invalid coordinates`, field.rect);
          continue;
      }

      // Auto-correct inverted coordinates
      if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
      if (ymin > ymax) [ymin, ymax] = [ymax, ymin];

      // Convert to PDF coordinates
      const boxX = (xmin / 1000) * width;
      const boxYTop = (ymin / 1000) * height; // Distance from top
      const boxWidth = ((xmax - xmin) / 1000) * width;

      // Effective PDF Y (top left of the box)
      const pdfBoxTopY = height - boxYTop;

      // Use a fixed, readable font size
      const fontSize = 10;
      // Increased padding to 4 to provide a safety buffer against overlapping the question text
      const padding = 4;
      const lineHeight = fontSize * 1.2;
      
      // Break lines based on box width
      const lines = breakTextIntoLines(field.value, fontSize, helveticaFont, boxWidth - (padding * 2));

      // Draw text starting from top
      let currentY = pdfBoxTopY - padding - fontSize; 

      for (const line of lines) {
          // Prevent drawing off the absolute bottom of the page
          if (currentY < 10) break; 

          page.drawText(line, {
              x: boxX + padding,
              y: currentY,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
          });
          currentY -= lineHeight;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  } catch (e) {
      console.error("PDF Generation failed:", e);
      throw new Error("Failed to generate PDF. Please check the console for details.");
  }
};