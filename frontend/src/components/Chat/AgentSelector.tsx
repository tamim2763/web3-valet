// src/components/Chat/AgentSelector.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaExchangeAlt, FaComments } from 'react-icons/fa';

interface AgentSelectorProps {
  onAgentSelect: (agentName: string) => void;
}

interface Agent {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ onAgentSelect }) => {
  const agents: Agent[] = [
    {
      name: 'NFT Analyst',
      description: 'Expert in NFT trends, valuations, and market analysis',
      icon: <FaRobot size={32} />,
      color: 'from-purple-600 to-purple-400'
    },
    {
      name: 'Transaction Agent',
      description: 'Handles crypto transactions and wallet operations',
      icon: <FaExchangeAlt size={32} />,
      color: 'from-blue-600 to-blue-400'
    },
    {
      name: 'General Assistant',
      description: 'Your all-purpose AI assistant for any questions',
      icon: <FaComments size={32} />,
      color: 'from-green-600 to-green-400'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-white mb-4">
          Choose Your AI Agent
        </h1>
        <p className="text-gray-400 text-lg">
          Select an agent to start your conversation
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
        {agents.map((agent, index) => (
          <motion.button
            key={agent.name}
            onClick={() => onAgentSelect(agent.name)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center p-8 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-gray-500 transition-all shadow-lg hover:shadow-2xl"
          >
            {/* Icon with gradient background */}
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center mb-6 text-white`}>
              {agent.icon}
            </div>

            {/* Agent name */}
            <h3 className="text-xl font-bold text-white mb-3">
              {agent.name}
            </h3>

            {/* Agent description */}
            <p className="text-gray-400 text-sm text-center">
              {agent.description}
            </p>

            {/* Call to action */}
            <motion.div
              className="mt-6 px-6 py-2 bg-blue-600 rounded-lg text-white text-sm font-medium"
              whileHover={{ backgroundColor: '#3b82f6' }}
            >
              Start Chat →
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Footer hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-gray-500 text-sm mt-12"
      >
        💡 Tip: You can change agents anytime during your conversation
      </motion.p>
    </div>
  );
};
