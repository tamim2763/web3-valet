// src/components/Chat/ChatView.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'react-lottie-player';
import { InputArea } from '../InputArea/InputArea';
import { AgentAudioPlayer } from './AgentAudioPlayer';
import { AgentSelector } from './AgentSelector';
import { MintModal } from './MintModal';
import { sendTextInput, sendAudioInput, getAudioUrl } from '../../services/api';

// Type definition for chat messages
interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  audioUrl?: string;
}

export const ChatView: React.FC = () => {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [currentItemToMint, setCurrentItemToMint] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle chat submission with real API calls
  const handleChatSubmit = async (prompt: string, file?: File) => {
    if (!selectedAgentId) {
      console.error('No agent selected');
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Create user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: file ? `${prompt} [Uploaded: ${file.name}]` : prompt
    };

    // Add user message to the conversation
    setMessages((prev) => [...prev, userMessage]);

    try {
      let data;

      if (file) {
        // Handle audio file upload
        data = await sendAudioInput(selectedAgentId, file);
      } else {
        // Handle text input
        data = await sendTextInput(selectedAgentId, prompt);
      }

      // Create agent response with real data from API
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: data.reply_text,
        audioUrl: getAudioUrl(data.audio_url),
      };

      // Add agent response to the conversation
      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create error message for user
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        text: 'Sorry, there was an error processing your request. Please make sure the backend is running and try again.',
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // Clear loading state
      setIsLoading(false);
    }
  };

  // Handle agent selection
  const handleAgentSelect = (agentId: string, agentName: string) => {
    setSelectedAgentId(agentId);
    setSelectedAgentName(agentName);
  };

  // Handle agent change
  const handleChangeAgent = () => {
    setSelectedAgentId(null);
    setSelectedAgentName(null);
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {/* Mint Modal */}
      <MintModal
        show={isMintModalOpen}
        onClose={() => setIsMintModalOpen(false)}
        chatResult={currentItemToMint || ''}
      />

      {/* Show agent selector if no agent is selected */}
      {!selectedAgentId ? (
        <AgentSelector onAgentSelect={handleAgentSelect} />
      ) : (
        <>
          {/* Header */}
          <div className="w-full bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
            <div className="flex-1" />
            <h1 className="text-xl font-bold text-white text-center flex-1">
              {selectedAgentName}
            </h1>
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleChangeAgent}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Change Agent
              </button>
            </div>
          </div>

          {/* Message List Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-700 text-gray-100 mr-auto'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.text}
                </p>
                
                {/* Agent Audio Player */}
                {message.role === 'agent' && message.audioUrl && (
                  <AgentAudioPlayer audioUrl={message.audioUrl} />
                )}

                {/* Mint Button */}
                {message.role === 'agent' && (
                  <button
                    onClick={() => {
                      setCurrentItemToMint(message.text);
                      setIsMintModalOpen(true);
                    }}
                    className="mt-3 w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Mint this Result
                  </button>
                )}
              </div>
            </motion.div>
          ))}

          {/* Thinking Indicator */}
          {isLoading && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start"
            >
              <div className="bg-gray-700 rounded-2xl px-4 py-3 shadow-lg flex items-center space-x-3">
                <Lottie
                  loop
                  play
                  path="https://lottie.host/0e596e73-902c-486a-8f8d-3d440d3b66f2/vP8iP2iP2W.json"
                  style={{ width: 60, height: 60 }}
                />
                <span className="text-gray-400 text-sm">Thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area at the bottom */}
      <div className="w-full bg-gray-900 border-t border-gray-800 p-4">
        <InputArea isLoading={isLoading} onSubmit={handleChatSubmit} />
      </div>
        </>
      )}
    </div>
  );
};
