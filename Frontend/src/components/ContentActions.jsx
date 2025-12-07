/**
 * Content Actions - Displays action buttons and controls for dynamic content
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiDownload, FiShare, FiFilter, FiZoomIn, FiZoomOut } from 'react-icons/fi';

const ContentActions = ({
  actions = [],
  metadata = {},
  onAction,
  className = ""
}) => {
  const defaultActions = [
    { id: 'refresh', label: 'Refresh', icon: FiRefreshCw, variant: 'secondary' },
    { id: 'export', label: 'Export', icon: FiDownload, variant: 'secondary' },
    { id: 'share', label: 'Share', icon: FiShare, variant: 'secondary' }
  ];

  const allActions = [...defaultActions, ...actions];

  const getVariantStyles = (variant) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 text-white hover:bg-blue-700';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  const handleAction = (actionId, event) => {
    event?.stopPropagation();
    if (onAction) {
      onAction(actionId, { metadata });
    }
  };

  if (allActions.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`content-actions flex items-center justify-between mt-6 pt-4 border-t border-gray-100 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center space-x-3">
        {allActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-lg font-medium
                transition-all duration-200 ${getVariantStyles(action.variant)}
              `}
              onClick={(e) => handleAction(action.id, e)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={action.label}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Metadata Summary */}
      <div className="text-sm text-gray-500">
        {metadata.total_count && (
          <span>{metadata.total_count} items</span>
        )}
        {metadata.confidence && (
          <span className="ml-4">
            Confidence: {(metadata.confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ContentActions;


