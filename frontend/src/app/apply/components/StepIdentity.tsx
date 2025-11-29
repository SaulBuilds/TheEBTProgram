'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ApplicationData } from '../ApplyContent';

interface StepIdentityProps {
  data: ApplicationData;
  onNext: (data: Partial<ApplicationData>) => void;
  walletAddress?: `0x${string}`;
}

export function StepIdentity({ data: initialData, onNext, walletAddress }: StepIdentityProps) {
  const [username, setUsername] = useState(initialData.username);
  const [twitter, setTwitter] = useState(initialData.twitter);
  const [profilePicURL, setProfilePicURL] = useState(initialData.profilePicURL);
  const [isChecking, setIsChecking] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const checkUsername = async (name: string) => {
    if (!name || name.length < 3) return;

    setIsChecking(true);
    try {
      const res = await fetch(`/api/checkusername`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name }),
      });

      if (res.status === 409) {
        setUsernameError('Username already taken');
      } else {
        setUsernameError('');
      }
    } catch {
      // API might not be available, allow to proceed
      setUsernameError('');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return;
    }

    if (usernameError) return;

    // Generate userId from username
    const userId = username.toLowerCase().replace(/[^a-z0-9]/g, '');

    onNext({
      username,
      twitter,
      profilePicURL: profilePicURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`,
      userId,
    });
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-mono font-bold text-ebt-gold mb-2">
          CASE FILE CREATION
        </h2>
        <p className="text-gray-400 font-mono text-sm">
          Every recipient needs a name on file. The government has yours. Now we need one too.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Wallet Address (Read-only) */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">
            Wallet Address
          </label>
          <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg font-mono text-sm text-gray-500 truncate">
            {walletAddress || 'Not connected'}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">
            Username <span className="text-welfare-red">*</span>
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError('');
            }}
            onBlur={() => checkUsername(username)}
            placeholder="breadlord420"
            className={`
              w-full px-4 py-3 bg-gray-900 border rounded-lg font-mono
              focus:outline-none focus:ring-2 focus:ring-ebt-gold
              ${usernameError ? 'border-welfare-red' : 'border-gray-800'}
            `}
          />
          {usernameError && (
            <p className="mt-1 text-sm text-welfare-red font-mono">{usernameError}</p>
          )}
          {isChecking && (
            <p className="mt-1 text-sm text-gray-500 font-mono">Checking availability...</p>
          )}
        </div>

        {/* Twitter */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">
            Twitter Handle (optional)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value.replace('@', ''))}
              placeholder="your_handle"
              className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
            />
          </div>
          <p className="mt-1 text-xs text-gray-600 font-mono">
            For propaganda distribution purposes
          </p>
        </div>

        {/* Profile Picture */}
        <div>
          <label className="block text-sm font-mono text-gray-400 mb-2">
            Profile Picture URL (optional)
          </label>
          <input
            type="url"
            value={profilePicURL}
            onChange={(e) => setProfilePicURL(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
          />
          <p className="mt-1 text-xs text-gray-600 font-mono">
            Leave blank for auto-generated pixel art avatar
          </p>
        </div>

        {/* Preview */}
        {username && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gray-900/50 border border-gray-800 rounded-lg"
          >
            <p className="text-xs font-mono text-gray-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <img
                src={profilePicURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`}
                alt="Profile"
                className="w-12 h-12 rounded-full bg-gray-800"
              />
              <div>
                <p className="font-mono font-bold text-white">{username}</p>
                {twitter && (
                  <p className="text-sm font-mono text-gray-500">@{twitter}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!username || !!usernameError || isChecking}
          className="w-full py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          DECLARE YOUR HUNGER →
        </button>
      </form>
    </div>
  );
}
