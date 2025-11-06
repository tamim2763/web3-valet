// src/components/Chat/AgentSelector.tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaRobot, FaExchangeAlt, FaComments, FaCode } from 'react-icons/fa';
import { getAgents, Agent as ApiAgent } from '../../services/api';

interface AgentSelectorProps {
  onAgentSelect: (agentId: string, agentName: string) => void;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// Helper function to get icon based on agent name
const getAgentIcon = (name: string): React.ReactNode => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('web3') || lowerName.includes('blockchain') || lowerName.includes('expert')) {
    return <FaExchangeAlt size={32} />;
  } else if (lowerName.includes('voice') || lowerName.includes('assistant')) {
    return <FaComments size={32} />;
  } else if (lowerName.includes('code') || lowerName.includes('helper')) {
    return <FaCode size={32} />;
  } else {
    return <FaRobot size={32} />;
  }
};

// Helper function to get color based on agent name
const getAgentColor = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('web3') || lowerName.includes('blockchain') || lowerName.includes('expert')) {
    return 'from-purple-600 to-purple-400';
  } else if (lowerName.includes('voice') || lowerName.includes('assistant')) {
    return 'from-green-600 to-green-400';
  } else if (lowerName.includes('code') || lowerName.includes('helper')) {
    return 'from-orange-600 to-orange-400';
  } else {
    return 'from-blue-600 to-blue-400';
  }
};

export const AgentSelector: React.FC<AgentSelectorProps> = ({ onAgentSelect }) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await getAgents();
        
        // Transform API response to match our Agent interface
        const transformedAgents: Agent[] = data.map((agent: ApiAgent) => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          icon: getAgentIcon(agent.name),
          color: getAgentColor(agent.name)
        }));

        setAgents(transformedAgents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents. Please make sure the backend is running.');
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

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

      {/* Loading State */}
      {loading && (
        <div className="text-white text-lg">Loading agents...</div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-red-500 text-lg">{error}</div>
      )}

      {/* Agents Grid */}
      {!loading && !error && (
        <div className="flex flex-wrap justify-center gap-6 max-w-6xl w-full">
        {agents.map((agent, index) => (
          <motion.button
            key={agent.id}
            onClick={() => onAgentSelect(agent.id, agent.name)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center p-8 bg-gray-800 rounded-2xl border-2 border-gray-700 hover:border-gray-500 transition-all shadow-lg hover:shadow-2xl w-72"
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
      )}

      {/* Footer hint */}
      {!loading && !error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-gray-500 text-sm mt-12"
        >
          💡 Tip: You can change agents anytime during your conversation
        </motion.p>
      )}
    </div>
  );
};
