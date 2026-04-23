'use client';

import { memo } from 'react';
import Link from 'next/link';

interface UpdateBannerProps {
  updateCount: number;
  onViewAll?: () => void;
}

const UpdateBannerComponent = ({ updateCount, onViewAll }: UpdateBannerProps) => {
  if (updateCount === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <Link href="/updates">
        <div className="group cursor-pointer bg-gradient-to-r from-amber-600 to-amber-700 rounded-lg p-4 hover:from-amber-500 hover:to-amber-600 transition-all shadow-lg border border-amber-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📢</span>
              <div>
                <h3 className="text-white font-bold text-lg">Isla Updates</h3>
                <p className="text-amber-100 text-sm">
                  {updateCount} {updateCount === 1 ? 'update' : 'updates'} available
                </p>
              </div>
            </div>
            <span className="text-amber-100 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};

export const UpdateBanner = memo(UpdateBannerComponent);
