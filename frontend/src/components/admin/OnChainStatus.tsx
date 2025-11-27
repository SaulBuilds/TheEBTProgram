'use client';

import React from 'react';
import { useDoesUserIdExist, useIsUserApproved } from '@/lib/hooks';

interface OnChainStatusProps {
  userId: string;
}

export function OnChainStatus({ userId }: OnChainStatusProps) {
  const { data: existsOnChain, isLoading: loadingExists } = useDoesUserIdExist(userId);
  const { data: approvedOnChain, isLoading: loadingApproved } = useIsUserApproved(userId);

  if (loadingExists || loadingApproved) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
        <span className="text-gray-500 text-xs">Checking...</span>
      </div>
    );
  }

  const isRegistered = existsOnChain === true;
  const isApproved = approvedOnChain === true;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isRegistered ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className={`text-xs ${isRegistered ? 'text-green-400' : 'text-red-400'}`}>
          {isRegistered ? 'On-Chain Registered' : 'Not Registered On-Chain'}
        </span>
      </div>
      {isRegistered && (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isApproved ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className={`text-xs ${isApproved ? 'text-green-400' : 'text-yellow-400'}`}>
            {isApproved ? 'On-Chain Approved' : 'Pending On-Chain Approval'}
          </span>
        </div>
      )}
    </div>
  );
}
