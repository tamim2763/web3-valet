# AI Chat Assistant

A beautiful, animated chat interface with real-time audio recording and voice visualization built with React, TypeScript, and Framer Motion.

## Features

- **Real-time Audio Recording** - Record voice messages with live audio visualization
- **Smooth Animations** - Framer Motion powered message animations
- **Thinking Indicator** - Beautiful Lottie animation while processing
- **File Upload** - Support for audio file uploads
- **TypeScript** - Fully typed for better developer experience
- **Audio Visualizer** - 32-bar frequency visualizer that reacts to your voice

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

Or if you encounter PowerShell restrictions:

```bash
npm.cmd install
```

### Development

Run the development server:

```bash
npm run dev
```

Or:

```bash
npm.cmd run dev
```

The app will be available at `http://localhost:5173`

## How to Use

1. **Type a Message**: Enter text in the input area and press Enter or click the send button
2. **Record Audio**: Click the microphone icon to start recording
   - Allow microphone permission when prompted
   - Watch the live audio visualizer react to your voice
   - Click the stop button when finished
3. **Upload Audio**: Click the paperclip icon to upload an audio file (WAV or MP3)
4. **View Responses**: Messages animate in smoothly with a 2-second mock response delay

## Project Structure

```
src/
├── components/
│   ├── Chat/
│   │   └── ChatView.tsx          # Main chat interface
│   └── InputArea/
│       ├── InputArea.tsx         # Input component with recording
│       ├── RecordingUI.tsx       # Live audio visualizer
│       └── inputArea.css         # Styles
├── App.tsx                       # Root component
├── main.tsx                      # Entry point
└── index.css                     # Global styles
```

## Components

### ChatView
- Manages conversation state
- Displays animated message list
- Shows thinking indicator during "backend" processing
- Integrates InputArea component

### InputArea
- Text input with submit
- Audio recording with MediaRecorder API
- File upload support
- Manages recording state and audio stream

### RecordingUI
- Real-time audio visualizer (32 bars)
- Frequency analysis using Web Audio API
- Smooth animations with Framer Motion

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Framer Motion** - Animations
- **react-lottie-player** - Lottie animations
- **react-icons** - Icon library
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Web Audio API** - Audio visualization
- **MediaRecorder API** - Audio recording

## Notes

- The backend is currently mocked with a 2-second delay
- Audio files are recorded in WebM format
- The visualizer uses 32 frequency bars for optimal performance
- Microphone permission is required for recording

## Future Enhancements

- Connect to real AI backend (OpenAI, etc.)
- Add speech-to-text transcription
- Save conversation history
- Support for multiple file types
- Dark/light theme toggle
- Message editing and deletion

