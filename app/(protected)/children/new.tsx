'use client';

import { useState } from 'react';
import { ChildProfileForm } from '@/components/ChildProfileForm';
import { CreateChildProfileRequest } from '@/types/child';
import { useRouter } from 'next/navigation';

export default function NewChildPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateChildProfileRequest) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/children/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create child profile');
      }

      router.push('/children');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <ChildProfileForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitButtonText="Create Child Profile"
          title="Create New Child Profile"
        />
      </div>

      <div className="mt-8 text-center">
        <a href="/children" className="text-blue-400 hover:text-blue-300 text-sm">
          ← Back to Children
        </a>
      </div>
    </div>
  );
}
