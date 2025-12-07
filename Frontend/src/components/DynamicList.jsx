/**
 * Dynamic List - Renders content as a vertical list with expandable items
 * Optimized for long-form content and detailed information
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronRight, FiExternalLink, FiInfo, FiStar } from 'react-icons/fi';

const DynamicList = ({
  data,
  layout = {},
  onAction,
  className = ""
}) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedItem, setSelectedItem] = useState(null);

  const {
    spacing = 'normal',
    animation = 'fade'
  } = layout;

  const spacingMap = {
    compact: 'space-y-2',
    normal: 'space-y-4',
    relaxed: 'space-y-6'
  };

  const toggleExpanded = (itemId, event) => {
    event?.stopPropagation();
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (item, index) => {
    setSelectedItem(selectedItem === index ? null : index);
    if (onAction) {
      onAction('item_click', { item, index });
    }
  };

  const handleActionClick = (action, item, event) => {
    event.stopPropagation();
    if (onAction) {
      onAction(action, { item });
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'expand':
        return <FiInfo className="w-4 h-4" />;
      case 'link':
        return <FiExternalLink className="w-4 h-4" />;
      case 'highlight':
        return <FiStar className="w-4 h-4" />;
      default:
        return <FiChevronRight className="w-4 h-4" />;
    }
  };

  const getPriorityBadge = (metadata) => {
    if (!metadata) return null;

    const similarity = metadata.similarity_score || 0;
    if (similarity > 0.8) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">High Match</span>;
    } else if (similarity > 0.6) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Good Match</span>;
    }
    return null;
  };

  const getAnimationVariants = () => {
    switch (animation) {
      case 'staggered':
        return {
          container: {
            animate: { transition: { staggerChildren: 0.05 } }
          },
          item: {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { duration: 0.3 }
          }
        };
      default:
        return {
          item: {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.2 }
          }
        };
    }
  };

  const variants = getAnimationVariants();

  if (!data.items || data.items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiInfo className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No items to display</p>
      </div>
    );
  }

  return (
    <motion.div
      className={`dynamic-list space-y-3 ${spacingMap[spacing]} ${className}`}
      variants={variants.container}
      initial="initial"
      animate="animate"
    >
      {data.items.map((item, index) => {
        const itemId = item.id || `item_${index}`;
        const isExpanded = expandedItems.has(itemId);
        const isSelected = selectedItem === index;

        return (
          <motion.div
            key={itemId}
            className={`
              dynamic-list-item bg-white rounded-lg border border-gray-200
              transition-all duration-200 cursor-pointer
              ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-sm hover:border-gray-300'}
            `}
            variants={variants.item}
            onClick={() => handleItemClick(item, index)}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
          >
            {/* Item Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">
                      {item.primary}
                    </h3>
                    {getPriorityBadge(item.metadata)}
                  </div>

                  <p className="text-gray-600 line-clamp-2 text-sm">
                    {item.secondary}
                  </p>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    onClick={(e) => handleActionClick(item.action_type, item, e)}
                    title={`${item.action_type} action`}
                  >
                    {getActionIcon(item.action_type)}
                  </button>

                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={(e) => toggleExpanded(itemId, e)}
                  >
                    {isExpanded ?
                      <FiChevronDown className="w-4 h-4" /> :
                      <FiChevronRight className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Item Metadata */}
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  {item.metadata?.type && (
                    <span>Type: {item.metadata.type}</span>
                  )}
                  {item.metadata?.sector && (
                    <span>Sector: {item.metadata.sector}</span>
                  )}
                </div>
                {item.metadata?.similarity_score && (
                  <span>Match: {(item.metadata.similarity_score * 100).toFixed(0)}%</span>
                )}
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed">
                        {item.secondary}
                      </p>

                      {/* Additional metadata */}
                      {item.metadata && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                          <dl className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(item.metadata).map(([key, value]) => (
                              <div key={key}>
                                <dt className="font-medium text-gray-600 capitalize">
                                  {key.replace('_', ' ')}:
                                </dt>
                                <dd className="text-gray-900">{String(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Load More */}
      {data.metadata?.total_count > data.items.length && (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            onClick={() => onAction?.('load_more')}
          >
            Load More Items ({data.metadata.total_count - data.items.length} remaining)
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DynamicList;


