'use client';

import React, { useState, useEffect } from 'react';
import { ApprovalHistory } from '@/components/ApprovalHistory';

interface Family {
  id: string;
  name: string;
}

export default function HistoryPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        setLoading(true);
        setError(null);

        const { supabase } = await import('@/lib/supabase');
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('Not authenticated');
        }

        const { data, error: fetchError } = await supabase
          .from('families')
          .select('id, name')
          .eq('created_by', user.id) as { data: Family[]; error: Error | null };

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setFamilies(data as Family[]);
          setSelectedFamilyId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFamilies();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-400">Loading families...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 text-red-300">
          Error: {error}
        </div>
      </div>
    );
  }

  if (families.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-400">No families found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Approval History</h1>
        <p className="text-gray-400">
          View a timeline of all child approvals and rejections.
        </p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Family
          </label>
          <select
            value={selectedFamilyId}
            onChange={(e) => setSelectedFamilyId(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            {families.map((family) => (
              <option key={family.id} value={family.id}>
                {family.name}
              </option>
            ))}
          </select>
        </div>

        {selectedFamilyId && (
          <ApprovalHistory familyId={selectedFamilyId} />
        )}
      </div>
    </div>
  );
}
