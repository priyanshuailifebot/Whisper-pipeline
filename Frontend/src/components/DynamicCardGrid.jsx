/**
 * Dynamic Card Grid - Renders content as an adaptive grid of cards
 * Supports different layouts, animations, and content types
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiTrendingUp, FiUsers, FiTarget, FiZap, FiImage, FiFileText } from 'react-icons/fi';

const DynamicCardGrid = ({
  data,
  layout = {},
  onAction,
  className = ""
}) => {
  // Get cards from either cards or items field
  const cardsData = data?.cards || data?.items || [];

  // Debug logging
  console.log('🃏 DynamicCardGrid received data:', {
    has_data: !!data,
    has_cards: !!data?.cards,
    has_items: !!data?.items,
    cards_count: cardsData.length,
    display_type: data?.display_type,
    first_card: cardsData[0],
    data_keys: data ? Object.keys(data) : [],
    using_fallback: !data?.cards && !!data?.items
  });

  const [hoveredCard, setHoveredCard] = useState(null);
  const [selectedCards, setSelectedCards] = useState(new Set());

  const {
    columns = 3,
    spacing = 'normal',
    size = 'medium',
    animation = 'fade'
  } = layout;

  // Calculate grid layout
  const gridConfig = useMemo(() => {
    const baseCols = Math.min(columns || 3, 4);
    const spacingMap = {
      compact: 'gap-3',
      normal: 'gap-5',
      relaxed: 'gap-6'
    };

    const sizeMap = {
      small: 'p-3 text-sm',
      medium: 'p-0', // Padding handled in card components
      large: 'p-0'
    };

    // Responsive grid columns
    const gridColsClass = baseCols === 1 ? 'grid-cols-1' :
                         baseCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                         baseCols === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                         'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

    return {
      gridCols: gridColsClass,
      spacing: spacingMap[spacing] || spacingMap.normal,
      cardSize: sizeMap[size] || sizeMap.medium,
      containerClasses: `grid ${gridColsClass} ${spacingMap[spacing] || spacingMap.normal}`
    };
  }, [columns, spacing, size]);

  const getVisualIcon = (visualType, priority) => {
    const iconClass = `w-6 h-6 ${priority === 'high' ? 'text-blue-600' : 'text-gray-500'}`;

    switch (visualType) {
      case 'icon':
        return <FiTarget className={iconClass} />;
      case 'chart':
        return <FiTrendingUp className={iconClass} />;
      case 'image':
        return <FiImage className={iconClass} />;
      case 'users':
        return <FiUsers className={iconClass} />;
      case 'zap':
        return <FiZap className={iconClass} />;
      default:
        return <FiFileText className={iconClass} />;
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-blue-300 bg-blue-50 shadow-md';
      case 'medium':
        return 'border-gray-200 bg-white';
      case 'low':
        return 'border-gray-100 bg-gray-50 opacity-75';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const handleCardClick = (card, index) => {
    if (onAction) {
      onAction('card_click', { card, index });
    }
  };

  const handleCardHover = (card, index) => {
    setHoveredCard(index);
  };

  const handleTagClick = (tag, event) => {
    event.stopPropagation();
    if (onAction) {
      onAction('tag_filter', { tag });
    }
  };

  const getAnimationVariants = () => {
    switch (animation) {
      case 'staggered':
        return {
          container: {
            animate: { transition: { staggerChildren: 0.1 } }
          },
          item: {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3 }
          }
        };
      case 'scale':
        return {
          item: {
            initial: { opacity: 0, scale: 0.8 },
            animate: { opacity: 1, scale: 1 },
            transition: { duration: 0.2 }
          }
        };
      default:
        return {
          item: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: 0.3 }
          }
        };
    }
  };

  const variants = getAnimationVariants();

  if (!cardsData || cardsData.length === 0) {
    console.log('❌ No cards to display - showing fallback message', {
      data_exists: !!data,
      cards_exists: !!data?.cards,
      items_exists: !!data?.items,
      cards_length: cardsData.length,
      using_fallback: !data?.cards && !!data?.items,
      data_structure: data
    });
    return (
      <div className="text-center py-8 text-gray-500">
        <FiFileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No cards to display</p>
        <p className="text-xs mt-2">Debug: cards = {cardsData ? `${cardsData.length} items` : 'undefined'}</p>
      </div>
    );
  }

  console.log('✅ Rendering', cardsData.length, 'cards');

  return (
    <motion.div
      className={`dynamic-card-grid ${gridConfig.containerClasses} ${className} w-full`}
      variants={variants.container}
      initial="initial"
      animate="animate"
      style={{ minHeight: '400px' }}
    >
      {cardsData.map((card, index) => (
        <motion.div
          key={card.id || index}
          className={`
            dynamic-card relative rounded-xl bg-white shadow-md border border-gray-200
            cursor-pointer overflow-hidden
            transition-all duration-300 hover:shadow-xl hover:border-blue-300
            ${gridConfig.cardSize}
            ${getPriorityStyles(card.priority)}
            ${selectedCards.has(index) ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            ${hoveredCard === index ? 'scale-[1.02] shadow-xl' : ''}
            flex flex-col h-full
          `}
          variants={variants.item}
          onClick={() => handleCardClick(card, index)}
          onMouseEnter={() => handleCardHover(card, index)}
          onMouseLeave={() => setHoveredCard(null)}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Card Header with Gradient Background */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  {getVisualIcon(card.visual_type, card.priority)}
                </div>
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2 flex-1 leading-tight">
                  {card.title}
                </h3>
              </div>
              {card.priority === 'high' && (
                <span className="px-3 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full flex-shrink-0 ml-2">
                  Priority
                </span>
              )}
            </div>
          </div>

          {/* Card Content */}
          <div className="flex-1 px-4 py-4">
            <p className="text-gray-700 text-sm leading-relaxed line-clamp-4 mb-4">
              {card.content}
            </p>

            {/* Card Tags */}
            {card.tags && card.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {card.tags.slice(0, 4).map((tag, tagIndex) => (
                  <span
                    key={tagIndex}
                    className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full cursor-pointer hover:bg-blue-100 transition-colors border border-blue-200"
                    onClick={(e) => handleTagClick(tag, e)}
                  >
                    {tag}
                  </span>
                ))}
                {card.tags.length > 4 && (
                  <span className="px-3 py-1 text-xs text-gray-500 font-medium">
                    +{card.tags.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded font-medium">
                {card.metadata?.type || 'Unknown'}
              </span>
              {card.metadata?.sector && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
                  {card.metadata.sector}
                </span>
              )}
            </div>
            {card.metadata?.similarity_score && (
              <span className="text-gray-500 font-medium">
                {(card.metadata.similarity_score * 100).toFixed(0)}% match
              </span>
            )}
          </div>

          {/* Hover Overlay */}
          {hoveredCard === index && (
            <motion.div
              className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </motion.div>
      ))}

      {/* Load More Indicator */}
      {data.metadata?.total_count > cardsData.length && (
        <motion.div
          className="dynamic-load-more col-span-full text-center py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <button
            className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            onClick={() => onAction?.('load_more')}
          >
            Load {Math.min(10, data.metadata.total_count - cardsData.length)} more items...
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DynamicCardGrid;
