// src/components/Chat/MintModal.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import Lottie from 'react-lottie-player';
import { FaTimes, FaCheck } from 'react-icons/fa';

interface MintModalProps {
  show: boolean;
  onClose: () => void;
  chatResult: string;
}

type MintingState = 'idle' | 'minting' | 'success' | 'error';

export const MintModal: React.FC<MintModalProps> = ({ show, onClose, chatResult }) => {
  // State management
  const [walletAddress, setWalletAddress] = useState('');
  const [mintingState, setMintingState] = useState<MintingState>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!show) {
      setWalletAddress('');
      setMintingState('idle');
      setTxHash(null);
    }
  }, [show]);

  // Handle mint confirmation
  const handleConfirmMint = () => {
    if (!walletAddress.trim()) {
      alert('Please enter a wallet address');
      return;
    }

    // Start minting
    setMintingState('minting');

    // Simulate minting process (2 seconds)
    setTimeout(() => {
      // Generate mock transaction hash
      const mockTxHash = `0x${[...Array(64)]
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join('')}`;
      
      setTxHash(mockTxHash);
      setMintingState('success');
    }, 2000);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-75 z-40 flex items-center justify-center p-4"
          >
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative"
            >
              {/* Close button (only show in idle and success states) */}
              {(mintingState === 'idle' || mintingState === 'success') && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              )}

              {/* Header */}
              <h2 className="text-2xl font-bold text-white mb-6">
                Mint to Blockchain
              </h2>

              {/* State: Idle */}
              {mintingState === 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Chat Result Preview */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-2">Minting:</p>
                    <p className="text-white text-sm line-clamp-3">
                      {chatResult}
                    </p>
                  </div>

                  {/* Wallet Address Input */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmMint}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
                  >
                    Confirm Mint
                  </button>
                </motion.div>
              )}

              {/* State: Minting */}
              {mintingState === 'minting' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8"
                >
                  <Lottie
                    loop
                    play
                    path="https://lottie.host/0e596e73-902c-486a-8f8d-3d440d3b66f2/vP8iP2iP2W.json"
                    style={{ width: 120, height: 120 }}
                  />
                  <p className="text-white text-lg font-medium mt-4">
                    Minting in progress...
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Please wait while we process your transaction
                  </p>
                </motion.div>
              )}

              {/* State: Success */}
              {mintingState === 'success' && (
                <>
                  {/* Confetti Animation */}
                  <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={500}
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-8"
                  >
                    {/* Success Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6"
                    >
                      <FaCheck className="text-white text-3xl" />
                    </motion.div>

                    {/* Success Message */}
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Mint Successful!
                    </h3>
                    <p className="text-gray-400 text-sm mb-6">
                      Your item has been minted to the blockchain
                    </p>

                    {/* Transaction Hash */}
                    <div className="w-full bg-gray-700 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
                      <p className="text-xs text-green-400 font-mono break-all">
                        {txHash}
                      </p>
                    </div>

                    {/* Wallet Address */}
                    <div className="w-full bg-gray-700 rounded-lg p-4 mb-6">
                      <p className="text-sm text-gray-400 mb-2">Minted to:</p>
                      <p className="text-sm text-white font-mono break-all">
                        {walletAddress}
                      </p>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={onClose}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
