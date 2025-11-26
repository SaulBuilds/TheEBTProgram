'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';

interface Application {
  id: number;
  userId: string;
  username: string;
  walletAddress: string;
  profilePicURL?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  email?: string;
  zipCode?: string;
  hungerLevel?: string;
  dependents: number;
  score: number;
  status: string;
  createdAt: string;
  walletSnapshot?: {
    ethBalance: string;
  };
}

export default function AdminContent() {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!adminToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/applications/pending`,
        {
          headers: {
            'x-admin-token': adminToken,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('Invalid admin token');
          setIsAuthenticated(false);
          return;
        }
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      setApplications(data.applications);
      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated, fetchApplications]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApplications();
  };

  const handleApprove = async (applicationId: number) => {
    setProcessingId(applicationId);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/applications/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({ applicationId }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve application');
      }

      const result = await response.json();
      alert(`Application approved!\n\nScore: ${result.score}\nMetadata URI: ${result.metadataUri}`);

      // Refresh the list
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (applicationId: number) => {
    const reason = prompt('Rejection reason (optional):');

    setProcessingId(applicationId);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/applications/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-token': adminToken,
          },
          body: JSON.stringify({ applicationId, reason }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject application');
      }

      // Refresh the list
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSnapshot = async (applicationId: number) => {
    setProcessingId(applicationId);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/admin/applications/${applicationId}/snapshot`,
        {
          method: 'POST',
          headers: {
            'x-admin-token': adminToken,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to take snapshot');
      }

      alert('Wallet snapshot taken successfully!');
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to take snapshot');
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <h1 className="text-3xl font-mono font-bold text-ebt-gold mb-8 text-center">
              Admin Login
            </h1>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  Admin Token
                </label>
                <input
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
                  placeholder="Enter admin token"
                />
              </div>
              {error && (
                <p className="text-welfare-red font-mono text-sm">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading || !adminToken}
                className="w-full py-4 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Login'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-mono font-bold text-ebt-gold">
            Admin Dashboard
          </h1>
          <button
            onClick={fetchApplications}
            disabled={loading}
            className="px-4 py-2 bg-gray-800 text-white font-mono rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
            <p className="text-welfare-red font-mono">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-gray-400 font-mono">
            Pending Applications: {applications.length}
          </p>
        </div>

        <div className="space-y-4">
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gray-900 border border-gray-800 rounded-lg"
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {/* User Info */}
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={app.profilePicURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${app.username}`}
                    alt={app.username}
                    className="w-16 h-16 rounded-full bg-gray-800"
                  />
                  <div className="min-w-0">
                    <h3 className="font-mono font-bold text-white text-lg">{app.username}</h3>
                    <p className="font-mono text-gray-500 text-sm truncate">{app.walletAddress}</p>
                    <p className="font-mono text-gray-600 text-xs">
                      Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
                  <div>
                    <p className="text-gray-500">Twitter</p>
                    <p className="text-white">{app.twitter ? `@${app.twitter}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Discord</p>
                    <p className="text-white">{app.discord || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">GitHub</p>
                    <p className="text-white">{app.github || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Hunger</p>
                    <p className="text-white capitalize">{app.hungerLevel?.replace('_', ' ') || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dependents</p>
                    <p className="text-white">{app.dependents}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Zip Code</p>
                    <p className="text-white">{app.zipCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">ETH Balance</p>
                    <p className="text-white">
                      {app.walletSnapshot
                        ? `${(Number(app.walletSnapshot.ethBalance) / 1e18).toFixed(4)} ETH`
                        : 'Not snapshotted'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Score</p>
                    <p className="text-ebt-gold font-bold">{app.score}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {!app.walletSnapshot && (
                    <button
                      onClick={() => handleSnapshot(app.id)}
                      disabled={processingId === app.id}
                      className="px-4 py-2 bg-blue-600 text-white font-mono text-sm rounded-lg hover:bg-blue-500 disabled:opacity-50"
                    >
                      {processingId === app.id ? '...' : 'Snapshot'}
                    </button>
                  )}
                  <button
                    onClick={() => handleApprove(app.id)}
                    disabled={processingId === app.id}
                    className="px-4 py-2 bg-green-600 text-white font-mono text-sm rounded-lg hover:bg-green-500 disabled:opacity-50"
                  >
                    {processingId === app.id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(app.id)}
                    disabled={processingId === app.id}
                    className="px-4 py-2 bg-welfare-red text-white font-mono text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {processingId === app.id ? '...' : 'Reject'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {applications.length === 0 && !loading && (
            <div className="p-12 bg-gray-900 border border-gray-800 rounded-lg text-center">
              <p className="text-gray-500 font-mono">No pending applications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
