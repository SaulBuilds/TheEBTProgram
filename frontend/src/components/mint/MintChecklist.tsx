'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ChecklistItem {
  id: string;
  label: string;
  status: 'pending' | 'success' | 'error' | 'loading';
  description?: string;
}

interface MintChecklistProps {
  items: ChecklistItem[];
}

export function MintChecklist({ items }: MintChecklistProps) {
  const allPassed = items.every((item) => item.status === 'success');

  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-white tracking-wide">PRE-MINT CHECKLIST</h3>
        {allPassed && (
          <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 border border-green-500/50 rounded">
            READY
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3"
          >
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {item.status === 'success' && (
                <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {item.status === 'error' && (
                <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {item.status === 'pending' && (
                <div className="w-5 h-5 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                </div>
              )}
              {item.status === 'loading' && (
                <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                item.status === 'success' ? 'text-green-400' :
                item.status === 'error' ? 'text-red-400' :
                item.status === 'loading' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {item.label}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default MintChecklist;
