# FormWiz

An AI-powered web application that streamlines the process of filling out PDF forms. It analyzes uploaded PDFs to identify questions and interview the user via voice to gather answers, automatically filling the document.

## Features

- **AI Analysis**: Uses Google Gemini 2.5 Flash to intelligently extract questions and fields from raw PDF images.
- **Voice Interviewer**: An interactive voice mode that reads questions aloud and transcribes user answers in real-time.
- **Mobile-Friendly Editor**: A fully responsive preview capabilities allowing users to drag, move, and resize answer boxes via touch or mouse.
- **Smart Persistence**: Automatically saves progress to `localStorage` so you never lose your work.
- **PDF Generation**: robust PDF reconstruction using `pdf-lib`.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, Lucide React
- **AI**: Google GenAI SDK (Gemini 2.5 Flash)
- **PDF Handling**: PDF.js (Rendering), PDF-lib (Generation)
- **State Management**: LocalStorage for session persistence

## Setup

1. Clone the repository.
2. Ensure you have a Google Gemini API Key.
3. This project uses ES Modules and can be run in modern browser environments or via a simple static server (e.g., Vite).

## Usage

1. **Upload**: Select a PDF form.
2. **Analyze**: The AI identifies input fields automatically.
3. **Interview**: Use the microphone to answer questions verbally, or type manually.
4. **Review**: Adjust the positioning of the answer boxes on the visual preview.
5. **Download**: Export the completed PDF.