/**
 * Content Header - Displays title, subtitle, and metadata for dynamic content
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiClock, FiTarget, FiInfo } from 'react-icons/fi';

const ContentHeader = ({
  title,
  subtitle,
  metadata = {},
  className = ""
}) => {
  const getConfidenceIndicator = (confidence) => {
    if (confidence >= 0.8) return { color: 'text-green-600', label: 'High', icon: FiTarget };
    if (confidence >= 0.6) return { color: 'text-yellow-600', label: 'Medium', icon: FiTrendingUp };
    return { color: 'text-red-600', label: 'Low', icon: FiInfo };
  };

  const confidence = metadata.confidence || 0;
  const confidenceInfo = getConfidenceIndicator(confidence);

  return (
    <motion.div
      className={`content-header mb-6 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">
            {title}
          </h2>

          {subtitle && (
            <p className="text-lg text-gray-600 mb-3">
              {subtitle}
            </p>
          )}
        </div>

        {/* Confidence Indicator */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full bg-white border ${confidenceInfo.color}`}>
          <confidenceInfo.icon className="w-4 h-4" />
          <span className="text-sm font-medium">
            {confidenceInfo.label} Confidence
          </span>
        </div>
      </div>

      {/* Metadata Bar */}
      {metadata && Object.keys(metadata).length > 0 && (
        <motion.div
          className="flex items-center space-x-6 mt-4 text-sm text-gray-500 border-t border-gray-100 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {metadata.total_count && (
            <div className="flex items-center space-x-1">
              <FiTarget className="w-4 h-4" />
              <span>{metadata.total_count} items</span>
            </div>
          )}

          {metadata.categories && metadata.categories.length > 0 && (
            <div className="flex items-center space-x-2">
              <span>Categories:</span>
              <div className="flex space-x-1">
                {metadata.categories.slice(0, 3).map((category, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {category}
                  </span>
                ))}
                {metadata.categories.length > 3 && (
                  <span className="text-xs">+{metadata.categories.length - 3} more</span>
                )}
              </div>
            </div>
          )}

          {metadata.generated_at && (
            <div className="flex items-center space-x-1">
              <FiClock className="w-4 h-4" />
              <span>
                {new Date(metadata.generated_at).toLocaleTimeString()}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ContentHeader;


