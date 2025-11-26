'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { formatEther, parseEther, isAddress } from 'viem';
import { Navbar } from '@/components/layout/Navbar';
import {
  useContractOwner,
  useTotalFundsRaised,
  useSoftCap,
  useHardCap,
  useFundraisingClosed,
  useFoodStampsPaused,
  useCurrentTokenId,
  useSetBlacklistStatus,
  useSetCaps,
  usePauseFoodStamps,
  useUnpauseFoodStamps,
  useCloseFundraising,
  useIsBlacklisted,
} from '@/lib/hooks';

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

type TabType = 'applications' | 'contracts' | 'blacklist';

export default function AdminContent() {
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('applications');

  // Contract state inputs
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [checkBlacklistAddress, setCheckBlacklistAddress] = useState('');
  const [newSoftCap, setNewSoftCap] = useState('');
  const [newHardCap, setNewHardCap] = useState('');

  // Wagmi hooks
  const { address: connectedAddress } = useAccount();
  const { data: contractOwner } = useContractOwner();
  const { data: totalFundsRaised } = useTotalFundsRaised();
  const { data: softCap } = useSoftCap();
  const { data: hardCap } = useHardCap();
  const { data: fundraisingClosed } = useFundraisingClosed();
  const { data: foodStampsPaused } = useFoodStampsPaused();
  const { data: currentTokenId } = useCurrentTokenId();
  const { data: isBlacklistedResult } = useIsBlacklisted(
    checkBlacklistAddress && isAddress(checkBlacklistAddress) ? checkBlacklistAddress as `0x${string}` : undefined
  );

  // Contract write hooks
  const {
    setBlacklistStatus,
    isPending: isBlacklistPending,
    isSuccess: isBlacklistSuccess,
    error: blacklistError,
    reset: resetBlacklist,
  } = useSetBlacklistStatus();

  const {
    setCaps,
    isPending: isCapsPending,
    isSuccess: isCapsSuccess,
    error: capsError,
    reset: resetCaps,
  } = useSetCaps();

  const {
    pause: pauseFood,
    isPending: isPausePending,
    isSuccess: isPauseSuccess,
  } = usePauseFoodStamps();

  const {
    unpause: unpauseFood,
    isPending: isUnpausePending,
    isSuccess: isUnpauseSuccess,
  } = useUnpauseFoodStamps();

  const {
    closeFundraising,
    isPending: isClosingFundraising,
    isSuccess: isCloseFundraisingSuccess,
  } = useCloseFundraising();

  const isOwner: boolean = !!(connectedAddress && contractOwner && connectedAddress.toLowerCase() === (contractOwner as string).toLowerCase());
  const isFundraisingClosed: boolean = fundraisingClosed === true;
  const isFoodPaused: boolean = foodStampsPaused === true;

  // Type-safe contract data
  const tokensMinted: number = currentTokenId ? Number(currentTokenId as bigint) - 1 : 0;
  const fundsRaisedEth: string = totalFundsRaised ? formatEther(totalFundsRaised as bigint) : '0';
  const softCapEth: string = softCap ? formatEther(softCap as bigint) : '0';
  const hardCapEth: string = hardCap ? formatEther(hardCap as bigint) : '0';
  const isAddressBlacklisted: boolean = isBlacklistedResult === true;
  const ownerAddress: string | undefined = contractOwner as string | undefined;

  const fetchApplications = useCallback(async () => {
    if (!adminToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/applications/pending`,
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

  // Reset success states after displaying
  useEffect(() => {
    if (isBlacklistSuccess) {
      setBlacklistAddress('');
      setTimeout(() => resetBlacklist(), 3000);
    }
  }, [isBlacklistSuccess, resetBlacklist]);

  useEffect(() => {
    if (isCapsSuccess) {
      setNewSoftCap('');
      setNewHardCap('');
      setTimeout(() => resetCaps(), 3000);
    }
  }, [isCapsSuccess, resetCaps]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchApplications();
  };

  const handleApprove = async (applicationId: number) => {
    setProcessingId(applicationId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/applications/approve`,
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
        `/api/admin/applications/reject`,
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
        `/api/admin/applications/${applicationId}/snapshot`,
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

  const handleBlacklist = (addToBlacklist: boolean) => {
    if (!blacklistAddress || !isAddress(blacklistAddress)) {
      alert('Please enter a valid address');
      return;
    }
    setBlacklistStatus([blacklistAddress as `0x${string}`], addToBlacklist);
  };

  const handleSetCaps = () => {
    if (!newSoftCap || !newHardCap) {
      alert('Please enter both soft and hard caps');
      return;
    }
    try {
      parseEther(newSoftCap);
      parseEther(newHardCap);
      setCaps(newSoftCap, newHardCap);
    } catch {
      alert('Invalid ETH values');
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
          <div className="flex gap-2">
            {activeTab === 'applications' && (
              <button
                onClick={fetchApplications}
                disabled={loading}
                className="px-4 py-2 bg-gray-800 text-white font-mono rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-4">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 font-mono rounded-lg transition-colors ${
              activeTab === 'applications'
                ? 'bg-ebt-gold text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`px-4 py-2 font-mono rounded-lg transition-colors ${
              activeTab === 'contracts'
                ? 'bg-ebt-gold text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Contract Controls
          </button>
          <button
            onClick={() => setActiveTab('blacklist')}
            className={`px-4 py-2 font-mono rounded-lg transition-colors ${
              activeTab === 'blacklist'
                ? 'bg-ebt-gold text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
          >
            Blacklist
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-welfare-red/10 border border-welfare-red/30 rounded-lg">
            <p className="text-welfare-red font-mono">{error}</p>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div>
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
        )}

        {/* Contract Controls Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-6">
            {/* Contract Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-500">Total Minted</p>
                <p className="text-2xl font-mono font-bold text-white">
                  {tokensMinted}
                </p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-500">Funds Raised</p>
                <p className="text-2xl font-mono font-bold text-ebt-gold">
                  {fundsRaisedEth} ETH
                </p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-500">Soft Cap</p>
                <p className="text-2xl font-mono font-bold text-white">
                  {softCapEth} ETH
                </p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-500">Hard Cap</p>
                <p className="text-2xl font-mono font-bold text-white">
                  {hardCapEth} ETH
                </p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-500">Fundraising Status</p>
                <p className={`text-lg font-mono font-bold ${isFundraisingClosed ? 'text-welfare-red' : 'text-green-400'}`}>
                  {isFundraisingClosed ? 'CLOSED' : 'ACTIVE'}
                </p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-500">$FOOD Token Status</p>
                <p className={`text-lg font-mono font-bold ${isFoodPaused ? 'text-welfare-red' : 'text-green-400'}`}>
                  {isFoodPaused ? 'PAUSED' : 'ACTIVE'}
                </p>
              </div>
              <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-mono text-gray-500">Owner Access</p>
                <p className={`text-lg font-mono font-bold ${isOwner ? 'text-green-400' : 'text-gray-500'}`}>
                  {isOwner ? 'CONNECTED' : 'NOT OWNER'}
                </p>
              </div>
            </div>

            {!isOwner && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 font-mono text-sm">
                  Connect with the contract owner wallet to access contract controls.
                  Owner: {ownerAddress ? ownerAddress.slice(0, 6) + '...' + ownerAddress.slice(-4) : 'Loading...'}
                </p>
              </div>
            )}

            {isOwner && (
              <div className="space-y-6">
                {/* Update Caps */}
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
                  <h3 className="text-lg font-mono font-bold text-white mb-4">Update Fundraising Caps</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-mono text-gray-400 mb-2">New Soft Cap (ETH)</label>
                      <input
                        type="text"
                        value={newSoftCap}
                        onChange={(e) => setNewSoftCap(e.target.value)}
                        placeholder="e.g., 25"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-mono text-gray-400 mb-2">New Hard Cap (ETH)</label>
                      <input
                        type="text"
                        value={newHardCap}
                        onChange={(e) => setNewHardCap(e.target.value)}
                        placeholder="e.g., 50"
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSetCaps}
                    disabled={isCapsPending || !newSoftCap || !newHardCap}
                    className="px-6 py-3 bg-ebt-gold text-black font-mono font-bold rounded-lg hover:bg-ebt-gold/90 disabled:opacity-50"
                  >
                    {isCapsPending ? 'Updating...' : 'Update Caps'}
                  </button>
                  {isCapsSuccess && <p className="text-green-400 font-mono text-sm mt-2">Caps updated successfully!</p>}
                  {capsError && <p className="text-welfare-red font-mono text-sm mt-2">{capsError.message}</p>}
                </div>

                {/* Fundraising Controls */}
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
                  <h3 className="text-lg font-mono font-bold text-white mb-4">Fundraising Controls</h3>
                  <button
                    onClick={() => closeFundraising()}
                    disabled={isClosingFundraising || isFundraisingClosed}
                    className="px-6 py-3 bg-welfare-red text-white font-mono font-bold rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {isClosingFundraising ? 'Closing...' : isFundraisingClosed ? 'Already Closed' : 'Close Fundraising'}
                  </button>
                  {isCloseFundraisingSuccess && <p className="text-green-400 font-mono text-sm mt-2">Fundraising closed!</p>}
                </div>

                {/* Token Controls */}
                <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
                  <h3 className="text-lg font-mono font-bold text-white mb-4">$FOOD Token Controls</h3>
                  <div className="flex gap-4">
                    <button
                      onClick={() => pauseFood()}
                      disabled={isPausePending || isFoodPaused}
                      className="px-6 py-3 bg-welfare-red text-white font-mono font-bold rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {isPausePending ? 'Pausing...' : 'Pause Minting'}
                    </button>
                    <button
                      onClick={() => unpauseFood()}
                      disabled={isUnpausePending || !isFoodPaused}
                      className="px-6 py-3 bg-green-600 text-white font-mono font-bold rounded-lg hover:bg-green-500 disabled:opacity-50"
                    >
                      {isUnpausePending ? 'Unpausing...' : 'Unpause Minting'}
                    </button>
                  </div>
                  {isPauseSuccess && <p className="text-green-400 font-mono text-sm mt-2">Token paused!</p>}
                  {isUnpauseSuccess && <p className="text-green-400 font-mono text-sm mt-2">Token unpaused!</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Blacklist Tab */}
        {activeTab === 'blacklist' && (
          <div className="space-y-6">
            {/* Check Blacklist Status */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
              <h3 className="text-lg font-mono font-bold text-white mb-4">Check Blacklist Status</h3>
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  value={checkBlacklistAddress}
                  onChange={(e) => setCheckBlacklistAddress(e.target.value)}
                  placeholder="0x..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
                />
              </div>
              {checkBlacklistAddress && isAddress(checkBlacklistAddress) && (
                <p className={`font-mono ${isAddressBlacklisted ? 'text-welfare-red' : 'text-green-400'}`}>
                  Status: {isAddressBlacklisted ? 'BLACKLISTED' : 'NOT BLACKLISTED'}
                </p>
              )}
            </div>

            {/* Add/Remove from Blacklist */}
            {isOwner && (
              <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
                <h3 className="text-lg font-mono font-bold text-white mb-4">Manage Blacklist</h3>
                <div className="mb-4">
                  <label className="block text-sm font-mono text-gray-400 mb-2">Address</label>
                  <input
                    type="text"
                    value={blacklistAddress}
                    onChange={(e) => setBlacklistAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-ebt-gold"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => handleBlacklist(true)}
                    disabled={isBlacklistPending || !blacklistAddress}
                    className="px-6 py-3 bg-welfare-red text-white font-mono font-bold rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    {isBlacklistPending ? 'Processing...' : 'Add to Blacklist'}
                  </button>
                  <button
                    onClick={() => handleBlacklist(false)}
                    disabled={isBlacklistPending || !blacklistAddress}
                    className="px-6 py-3 bg-green-600 text-white font-mono font-bold rounded-lg hover:bg-green-500 disabled:opacity-50"
                  >
                    {isBlacklistPending ? 'Processing...' : 'Remove from Blacklist'}
                  </button>
                </div>
                {isBlacklistSuccess && <p className="text-green-400 font-mono text-sm mt-2">Blacklist updated!</p>}
                {blacklistError && <p className="text-welfare-red font-mono text-sm mt-2">{blacklistError.message}</p>}
              </div>
            )}

            {!isOwner && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 font-mono text-sm">
                  Connect with the contract owner wallet to manage the blacklist.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
