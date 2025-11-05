// src/components/InputArea/RecordingUI.tsx
import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface RecordingUIProps {
  analyser: AnalyserNode | null;
}

export const RecordingUI: React.FC<RecordingUIProps> = ({ analyser }) => {
  const [barHeights, setBarHeights] = useState<number[]>(new Array(32).fill(0));
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser) return;

    // Create a data array to store frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Number of bars to display
    const numBars = 32;
    
    // Animation loop
    const updateVisualizer = () => {
      // Get the frequency data
      analyser.getByteFrequencyData(dataArray);
      
      // Sample the frequency data to create bar heights
      // We'll take samples across the frequency spectrum
      const newBarHeights: number[] = [];
      const samplesPerBar = Math.floor(bufferLength / numBars);
      
      for (let i = 0; i < numBars; i++) {
        const start = i * samplesPerBar;
        const end = start + samplesPerBar;
        
        // Get the average value for this bar
        let sum = 0;
        for (let j = start; j < end && j < bufferLength; j++) {
          sum += dataArray[j];
        }
        const average = sum / samplesPerBar;
        
        // Normalize to a height value (0-100)
        // We'll emphasize lower frequencies a bit more for voice
        const normalizedHeight = (average / 255) * 100;
        newBarHeights.push(normalizedHeight);
      }
      
      setBarHeights(newBarHeights);
      
      // Continue the animation loop
      animationFrameRef.current = requestAnimationFrame(updateVisualizer);
    };
    
    // Start the animation
    updateVisualizer();
    
    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser]);

  return (
    <div className="flex items-center space-x-1 h-full w-full px-4" style={{ minHeight: '48px' }}>
      <span className="text-gray-400 mr-3 font-medium">Recording...</span>
      
      {/* Live audio visualizer bars */}
      <div className="flex items-center justify-center space-x-1 flex-1">
        {barHeights.map((height, i) => (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-red-500 via-red-400 to-red-300 rounded-full"
            style={{ 
              height: `${Math.max(4, height * 0.4)}px`, // Min height of 4px, max scaled by 0.4
              transition: 'height 0.1s ease-out'
            }}
            animate={{ 
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.02
            }}
          />
        ))}
      </div>
      
      {/* Pulsing recording indicator */}
      <motion.div
        className="w-3 h-3 bg-red-500 rounded-full ml-3"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [1, 0.6, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};
