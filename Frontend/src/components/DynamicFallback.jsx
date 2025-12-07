/**
 * Dynamic Fallback - Default renderer for unrecognized content types
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiAlertTriangle } from 'react-icons/fi';

const DynamicFallback = ({ data, layout = {}, onAction, className = "" }) => {
  return (
    <motion.div
      className={`dynamic-fallback text-center py-8 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="mb-4">
        {data.display_type === 'error' ? (
          <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
        ) : (
          <FiFileText className="w-16 h-16 text-gray-400 mx-auto" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {data.title || 'Content Display'}
      </h3>

      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {data.content || 'This content type is not yet fully supported by the dynamic renderer.'}
      </p>

      {data.metadata && (
        <div className="text-sm text-gray-500">
          <p>Type: {data.display_type || 'unknown'}</p>
          <p>Confidence: {data.metadata.confidence ? (data.metadata.confidence * 100).toFixed(0) + '%' : 'N/A'}</p>
        </div>
      )}

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        onClick={() => onAction?.('fallback_action', { data })}
      >
        View Raw Content
      </button>
    </motion.div>
  );
};

export default DynamicFallback;


