/**
 * Dynamic Timeline - Renders content as a chronological timeline
 */

import React from 'react';
import { motion } from 'framer-motion';

const DynamicTimeline = ({ data, layout = {}, onAction, className = "" }) => {
  if (!data.events || data.events.length === 0) {
    return <div className="text-center py-8 text-gray-500">No timeline events available</div>;
  }

  return (
    <motion.div
      className={`dynamic-timeline ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="space-y-4">
        {data.events.map((event, index) => (
          <motion.div
            key={event.id || index}
            className="flex items-start space-x-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              {index < data.events.length - 1 && (
                <div className="w-0.5 h-16 bg-gray-300 mt-2"></div>
              )}
            </div>
            <div className="flex-1 pb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <span className="text-sm text-gray-500">{event.timestamp}</span>
                </div>
                <p className="text-gray-600">{event.description}</p>
                {event.phase && (
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
                    event.phase === 'completed' ? 'bg-green-100 text-green-800' :
                    event.phase === 'active' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.phase}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default DynamicTimeline;


