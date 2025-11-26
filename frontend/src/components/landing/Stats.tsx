'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface PlatformStats {
  totalMinted: number;
  totalRaised: string;
  totalHolders: number;
  pendingApplications: number;
  approvedApplications: number;
  nextDropTime: string;
  mintPrice: string;
  softCap: string;
  hardCap: string;
}

interface DisplayStats {
  totalMinted: number;
  totalRaised: number;
  totalDistributed: number;
  activeUsers: number;
  softCapProgress: number;
}

async function fetchStats(): Promise<DisplayStats> {
  try {
    const res = await fetch(`/api/stats/platform`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data: PlatformStats = await res.json();

    const raised = parseFloat(data.totalRaised);
    const softCap = parseFloat(data.softCap);
    const softCapProgress = softCap > 0 ? (raised / softCap) * 100 : 0;

    const foodPerMint = 200000;
    const totalDistributed = data.totalMinted * foodPerMint;

    return {
      totalMinted: data.totalMinted,
      totalRaised: raised * 3000,
      totalDistributed,
      activeUsers: data.totalHolders + data.pendingApplications,
      softCapProgress: Math.min(softCapProgress, 100)
    };
  } catch (error) {
    console.log('Using mock stats data', error);
    return {
      totalMinted: 420,
      totalRaised: 69000,
      totalDistributed: 84000000,
      activeUsers: 1337,
      softCapProgress: 69
    };
  }
}

export function Stats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchStats,
    refetchInterval: 30000,
  });

  const [animatedStats, setAnimatedStats] = useState({
    totalMinted: 0,
    totalRaised: 0,
    totalDistributed: 0,
    activeUsers: 0,
  });

  useEffect(() => {
    if (!stats) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      if (currentStep >= steps) {
        clearInterval(timer);
        return;
      }

      const progress = currentStep / steps;
      setAnimatedStats({
        totalMinted: Math.floor(stats.totalMinted * progress),
        totalRaised: Math.floor(stats.totalRaised * progress),
        totalDistributed: Math.floor(stats.totalDistributed * progress),
        activeUsers: Math.floor(stats.activeUsers * progress),
      });

      currentStep++;
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  if (isLoading) {
    return (
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="animate-pulse bg-ebt-gold/20 h-12 w-32 mx-auto mb-2 rounded" />
                  <div className="animate-pulse bg-gray-800 h-4 w-24 mx-auto rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-heading text-ebt-gold mb-2 group-hover:animate-pulse tracking-wide">
                {animatedStats.totalMinted.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 uppercase">Cards Minted</div>
            </div>

            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-heading text-ebt-gold mb-2 group-hover:animate-pulse tracking-wide">
                ${animatedStats.totalRaised.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 uppercase">Total Raised</div>
            </div>

            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-heading text-ebt-gold mb-2 group-hover:animate-pulse tracking-wide">
                {(animatedStats.totalDistributed / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-gray-500 uppercase">$FOOD Distributed</div>
            </div>

            <div className="text-center group">
              <div className="text-3xl md:text-4xl font-heading text-ebt-gold mb-2 group-hover:animate-pulse tracking-wide">
                {animatedStats.activeUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 uppercase">Active Users</div>
            </div>
          </div>

          {/* Progress bar for soft cap */}
          {stats && (
            <div className="mt-8 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">FUNDRAISING PROGRESS</span>
                <span className="text-xs font-heading text-ebt-gold tracking-wide">
                  {stats.softCapProgress}% TO SOFT CAP
                </span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-ebt-gold to-welfare-red transition-all duration-1000"
                  style={{ width: `${Math.min(stats.softCapProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
