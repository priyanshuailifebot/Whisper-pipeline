/**
 * Dynamic Comparison Table - Renders content as a comparison matrix
 */

import React from 'react';
import { motion } from 'framer-motion';

const DynamicComparisonTable = ({ data, layout = {}, onAction, className = "" }) => {
  if (!data.rows || !data.columns) {
    return <div className="text-center py-8 text-gray-500">No comparison data available</div>;
  }

  return (
    <motion.div
      className={`dynamic-comparison-table overflow-x-auto ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-2 text-left font-semibold">Feature</th>
            {data.columns.map((col, index) => (
              <th key={index} className="px-4 py-2 text-left font-semibold">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <tr key={index} className="border-t border-gray-200">
              <td className="px-4 py-2 font-medium">{row.label}</td>
              {row.values.map((value, vIndex) => (
                <td key={vIndex} className="px-4 py-2">{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default DynamicComparisonTable;


