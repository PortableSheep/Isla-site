'use client';

import { useEffect, useState } from 'react';
import { ChildProfile, UpdateChildProfileRequest } from '@/types/child';
import { ChildProfileForm } from '@/components/ChildProfileForm';
import { useRouter } from 'next/navigation';

interface EditChildPageProps {
  params: {
    childId: string;
  };
}

export default function EditChildPage({ params }: EditChildPageProps) {
  const router = useRouter();
  const { childId } = params;
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchChild = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/children/${childId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch child profile');
        }

        const data = await response.json();
        setChild(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch child profile';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChild();
  }, [childId]);

  const handleSubmit = async (data: UpdateChildProfileRequest) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/children/${childId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update child profile');
      }

      const updated = await response.json();
      setChild(updated);
      router.push('/children');
    } catch (error) {
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-gray-400 text-center">Loading...</p>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <p className="text-red-200">{error || 'Child profile not found'}</p>
        </div>
        <div className="mt-4">
          <a href="/children" className="text-blue-400 hover:text-blue-300">
            ← Back to Children
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
        <ChildProfileForm
          onSubmit={handleSubmit}
          isLoading={isSaving}
          initialData={{
            name: child.name,
            age: child.age || undefined,
            bio: child.bio || undefined,
          }}
          submitButtonText="Update Child Profile"
          title="Edit Child Profile"
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
