// src/components/Chat/AgentAudioPlayer.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause } from 'react-icons/fa';

interface AgentAudioPlayerProps {
  audioUrl: string;
}

export const AgentAudioPlayer: React.FC<AgentAudioPlayerProps> = ({ audioUrl }) => {
  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement>(null);

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Format time as MM:SS
  const formatTime = (timeInSeconds: number): string => {
    if (!isFinite(timeInSeconds)) return '0:00';
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Event handler: Get duration when metadata is loaded
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    // Event handler: Update current time as audio plays
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    // Event handler: Reset when audio ends
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Attach event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    // Cleanup function
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-3 flex items-center space-x-3 bg-gray-800 rounded-lg p-3 w-full">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <FaPause className="text-white text-sm" />
        ) : (
          <FaPlay className="text-white text-sm ml-0.5" />
        )}
      </button>

      {/* Progress Bar and Time Display */}
      <div className="flex-1 flex flex-col space-y-1">
        {/* Custom Progress Bar */}
        <div className="relative w-full h-2 bg-gray-600 rounded-full overflow-hidden">
          {/* Animated Progress Foreground */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};
