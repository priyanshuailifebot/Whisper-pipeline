/**
 * Dynamic Content Renderer - Universal component for rendering any display structure
 * Automatically adapts to any content type and format from the RAG service
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DynamicList from './DynamicList';
import DynamicCardGrid from './DynamicCardGrid';
import DynamicComparisonTable from './DynamicComparisonTable';
import DynamicTimeline from './DynamicTimeline';
import DynamicFallback from './DynamicFallback';
import ContentHeader from './ContentHeader';
import ContentActions from './ContentActions';

const DynamicContentRenderer = ({
  contentData,
  onContentChange,
  onAction,
  className = "",
  maxHeight = "70vh"
}) => {
  const [currentContent, setCurrentContent] = useState(null);
  const [transitionState, setTransitionState] = useState('idle');
  const [renderStartTime, setRenderStartTime] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (contentData && contentData !== currentContent) {
      console.log('🔄 New content received:', contentData.display_type);
      setTransitionState('transitioning');
      setRenderStartTime(Date.now());

      // Analyze new content structure for optimal rendering
      const analysis = analyzeContentStructure(contentData);

      // Prepare optimal layout
      const layout = calculateOptimalLayout(analysis, contentData);

      // Smooth transition with minimal delay
      setTimeout(() => {
        setCurrentContent({ ...contentData, layout });
        setTransitionState('active');

        // Measure render time
        const renderTime = Date.now() - renderStartTime;
        console.log(`⚡ Content rendered in ${renderTime}ms`);

        onContentChange?.({ ...contentData, layout, renderTime });
      }, 50); // Minimal delay for smooth transition
    }
  }, [contentData, currentContent, onContentChange, renderStartTime]);

  const analyzeContentStructure = (data) => {
    const analysis = {
      itemCount: 0,
      hasImages: false,
      hasComplexContent: false,
      contentTypes: new Set(),
      maxContentLength: 0
    };

    // Analyze based on display type
    switch (data.display_type) {
      case 'dynamic_list':
        analysis.itemCount = data.items?.length || 0;
        analysis.hasImages = data.items?.some(item => item.image) || false;
        analysis.maxContentLength = Math.max(...(data.items?.map(item =>
          (item.primary?.length || 0) + (item.secondary?.length || 0)) || [0]));
        break;

      case 'dynamic_cards':
        analysis.itemCount = data.cards?.length || 0;
        analysis.hasImages = data.cards?.some(card => card.visual_type === 'image') || false;
        analysis.contentTypes = new Set(data.cards?.map(card => card.visual_type) || []);
        analysis.maxContentLength = Math.max(...(data.cards?.map(card =>
          card.content?.length || 0) || [0]));
        break;

      case 'dynamic_comparison':
        analysis.itemCount = data.rows?.length || 0;
        analysis.hasComplexContent = true;
        break;

      case 'dynamic_timeline':
        analysis.itemCount = data.events?.length || 0;
        analysis.hasComplexContent = true;
        break;
    }

    analysis.hasComplexContent = analysis.hasComplexContent ||
                                analysis.maxContentLength > 500 ||
                                analysis.itemCount > 20;

    return analysis;
  };

  const calculateOptimalLayout = (analysis, data) => {
    const layout = {
      columns: 1,
      spacing: 'normal',
      size: 'medium',
      animation: 'fade',
      performance: 'standard'
    };

    // Responsive column calculation
    if (data.display_type === 'dynamic_cards') {
      if (analysis.itemCount <= 4) {
        layout.columns = 2;
      } else if (analysis.itemCount <= 9) {
        layout.columns = 3;
      } else {
        layout.columns = 4;
      }

      // Adjust for screen size
      if (window.innerWidth < 768) {
        layout.columns = Math.min(layout.columns, 2);
      } else if (window.innerWidth < 1200) {
        layout.columns = Math.min(layout.columns, 3);
      }
    }

    // Performance optimizations
    if (analysis.itemCount > 50) {
      layout.performance = 'virtualized';
      layout.animation = 'staggered';
    } else if (analysis.hasComplexContent) {
      layout.performance = 'optimized';
    }

    // Spacing based on content density
    if (analysis.itemCount > 20) {
      layout.spacing = 'compact';
    } else if (analysis.hasImages) {
      layout.spacing = 'relaxed';
    }

    return layout;
  };

  const renderContent = () => {
    if (!currentContent) {
      console.log('⚠️ DynamicContentRenderer: No currentContent');
      return null;
    }

    console.log('🎨 DynamicContentRenderer rendering:', {
      display_type: currentContent.display_type,
      has_cards: !!currentContent.cards,
      cards_count: currentContent.cards?.length || 0,
      has_layout: !!currentContent.layout,
      content_keys: Object.keys(currentContent),
      cards_sample: currentContent.cards?.[0],
      items_count: currentContent.items?.length || 0
    });

    const renderProps = {
      data: currentContent,
      layout: currentContent.layout,
      onAction,
      className: "dynamic-content-body"
    };

    switch (currentContent.display_type) {
      case 'dynamic_list':
        return <DynamicList {...renderProps} />;
      case 'dynamic_cards':
        console.log('🃏 Passing to DynamicCardGrid:', renderProps);
        return <DynamicCardGrid {...renderProps} />;
      case 'dynamic_comparison':
        return <DynamicComparisonTable {...renderProps} />;
      case 'dynamic_timeline':
        return <DynamicTimeline {...renderProps} />;
      default:
        console.log('⚠️ Unknown display_type:', currentContent.display_type);
        return <DynamicFallback {...renderProps} />;
    }
  };

  const getTransitionVariants = () => {
    if (currentContent?.layout?.animation === 'staggered') {
      return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3, staggerChildren: 0.1 }
      };
    }

    return {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 },
      transition: { duration: 0.2 }
    };
  };

  if (!currentContent) {
    return (
      <div className={`dynamic-content-loading ${className}`}>
        <div className="loading-spinner"></div>
        <p>Analyzing content...</p>
      </div>
    );
  }

  const variants = getTransitionVariants();

  return (
    <div
      ref={containerRef}
      className={`dynamic-content-renderer ${className} w-full`}
      style={{ maxHeight, overflowY: 'auto' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentContent.id || 'content'}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="dynamic-content-container"
        >
          {/* Content Header */}
          <ContentHeader
            title={currentContent.title}
            subtitle={currentContent.subtitle}
            metadata={currentContent.metadata}
          />

          {/* Dynamic Content Body */}
          <div className="dynamic-content-body w-full py-4">
            {renderContent()}
          </div>

          {/* Content Actions */}
          <ContentActions
            actions={currentContent.actions}
            metadata={currentContent.metadata}
            onAction={onAction}
          />
        </motion.div>
      </AnimatePresence>

      {/* Performance Indicator (dev mode only) */}
      {import.meta.env.DEV && (
        <div className="performance-indicator">
          <small>
            Rendered {currentContent.display_type} in {currentContent.renderTime || 0}ms
          </small>
        </div>
      )}
    </div>
  );
};

export default DynamicContentRenderer;
