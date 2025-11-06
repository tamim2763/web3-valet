// src/components/InputArea/InputArea.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Using react-icons for a clean look
import { FaMicrophone, FaStop, FaPaperclip, FaArrowUp } from 'react-icons/fa';
import { RecordingUI } from './RecordingUI';

// Define the component's props, e.g., what to do when text is submitted
interface InputAreaProps {
  onSubmit: (prompt: string, file?: File) => void;
  // You'll also need props to tell it when it's loading/disabled
  isLoading: boolean;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSubmit, isLoading }) => {
  // State for the user's typed text
  const [text, setText] = useState('');
  // State to manage the UI mode: 'text', 'recording', or 'uploading'
  const [mode, setMode] = useState<'text' | 'recording' | 'uploading'>('text');
  
  // You'd also have a state for the uploaded file
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Recording-related state
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // --- Handlers ---
  
  const handleRecordClick = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create AudioContext and AnalyserNode for visualization
      const audioContext = new AudioContext();
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 256; // Controls the frequency resolution
      analyserNode.smoothingTimeConstant = 0.8; // Smooth out the visual changes
      
      // Connect the stream to the analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserNode);
      
      // Create MediaRecorder to capture audio
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      // Collect audio data chunks
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      // When recording stops, create the audio file
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'recording.webm', { type: 'audio/webm' });
        
        setUploadedFile(file);
        setText(file.name);
        setMode('uploading');
        
        // Clean up
        setAudioChunks([]);
      };
      
      // Start recording
      recorder.start();
      
      // Update state
      setMediaRecorder(recorder);
      setAudioStream(stream);
      setAnalyser(analyserNode);
      setMode('recording');
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          alert('Microphone permission was denied. Please allow microphone access to record audio.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert(`Failed to access microphone: ${error.message}`);
        }
      } else {
        alert('An unexpected error occurred while trying to access the microphone.');
      }
    }
  };

  const handleStopClick = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      // Stop the recorder
      mediaRecorder.stop();
    }
    
    if (audioStream) {
      // Stop all tracks to turn off the microphone light
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    // Reset recording state
    setMediaRecorder(null);
    setAudioStream(null);
    setAnalyser(null);
  };

  const handleUploadClick = () => {
    // Triggers the hidden file input
    document.getElementById('audio-upload')?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check file type/size here
      setUploadedFile(file);
      setText(file.name); // Show file name in the text area
      setMode('uploading');
    }
  };
  
  const handleSubmit = () => {
    if (isLoading || (!text && !uploadedFile)) return;
    
    if (mode === 'uploading' && uploadedFile) {
      onSubmit(text, uploadedFile); // 'text' here could be metadata
    } else {
      onSubmit(text); // Regular text submission
    }
    
    // Reset state
    setText('');
    setUploadedFile(null);
    setMode('text');
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      {/* This outer shell will have the main border and layout */}
      <motion.div 
        layout // <-- This prop makes it animate layout changes!
        className="relative flex w-full items-end rounded-2xl border-2 border-gray-700 bg-gray-900 transition-colors focus-within:border-blue-500"
        style={{ minHeight: '60px' }}
      >
        {/* --- Icon Buttons --- */}
        <div className="p-4 flex items-center space-x-2">
          {/* Conditional Recording Button */}
          {mode !== 'recording' ? (
            <button 
              onClick={handleRecordClick} 
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
            >
              <FaMicrophone size={20} />
            </button>
          ) : (
            <button 
              onClick={handleStopClick} 
              className="p-2 text-red-500 hover:text-red-400 animate-pulse"
            >
              <FaStop size={20} />
            </button>
          )}

          {/* Upload Button */}
          <button 
            onClick={handleUploadClick}
            disabled={isLoading || mode === 'recording'}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <FaPaperclip size={20} />
          </button>
          {/* Hidden file input for the upload button */}
          <input
            type="file"
            id="audio-upload"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* --- Main Input Area (Text or Recording) --- */}
        <div className="flex-1 py-4 pr-16"> {/* pr-16 leaves space for submit btn */}
          <AnimatePresence mode="wait">
            {mode === 'recording' ? (
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <RecordingUI analyser={analyser} />
              </motion.div>
            ) : (
              <motion.div
                key="text"
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={
                    mode === 'uploading' 
                    ? `File: ${uploadedFile?.name}` 
                    : "Speak, upload, or type your request..."
                  }
                  readOnly={mode === 'uploading' || isLoading}
                  className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* --- Submit Button --- */}
        <div className="absolute right-4 bottom-4">
          <button 
            onClick={handleSubmit}
            disabled={isLoading || (!text && !uploadedFile)}
            className="p-3 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:bg-gray-600"
          >
            <FaArrowUp size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};