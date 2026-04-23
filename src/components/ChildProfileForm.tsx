'use client';

import { useState, FormEvent } from 'react';
import { CreateChildProfileRequest, UpdateChildProfileRequest } from '@/types/child';

interface ChildProfileFormProps {
  onSubmit: (data: CreateChildProfileRequest) => Promise<void>;
  isLoading?: boolean;
  initialData?: {
    name: string;
    age?: number;
    bio?: string;
  };
  submitButtonText?: string;
  title?: string;
}

export function ChildProfileForm({
  onSubmit,
  isLoading = false,
  initialData,
  submitButtonText = 'Create Child Profile',
  title = 'Create New Child Profile',
}: ChildProfileFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    age: initialData?.age || '',
    bio: initialData?.bio || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Child name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    if (formData.age) {
      const ageNum = parseInt(String(formData.age), 10);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
        newErrors.age = 'Age must be between 0 and 18';
      }
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    try {
      const submitData: CreateChildProfileRequest = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(String(formData.age), 10) : undefined,
        bio: formData.bio.trim() || undefined,
      };

      await onSubmit(submitData);
      setSuccessMessage(initialData ? 'Profile updated successfully!' : 'Child profile created successfully!');
      if (!initialData) {
        setFormData({ name: '', age: '', bio: '' });
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to save profile');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400">
          {initialData ? 'Update your child profile information' : 'Create a new profile for your child'}
        </p>
      </div>

      {/* Error messages */}
      {submitError && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <p className="text-red-200 text-sm">{submitError}</p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4">
          <p className="text-green-200 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
          Child's Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter child's full name"
          className={`w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border ${
            errors.name ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none focus:border-blue-500 transition`}
          disabled={isLoading}
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Age field */}
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-200 mb-2">
          Age (optional)
        </label>
        <input
          id="age"
          name="age"
          type="number"
          value={formData.age}
          onChange={handleInputChange}
          placeholder="0-18"
          min="0"
          max="18"
          className={`w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border ${
            errors.age ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none focus:border-blue-500 transition`}
          disabled={isLoading}
        />
        {errors.age && <p className="text-red-400 text-sm mt-1">{errors.age}</p>}
      </div>

      {/* Bio field */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-200 mb-2">
          Bio (optional)
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Tell us a bit about your child..."
          maxLength={500}
          rows={4}
          className={`w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border ${
            errors.bio ? 'border-red-500' : 'border-gray-600'
          } focus:outline-none focus:border-blue-500 transition resize-none`}
          disabled={isLoading}
        />
        <div className="flex justify-between mt-1">
          {errors.bio && <p className="text-red-400 text-sm">{errors.bio}</p>}
          <p className="text-gray-400 text-sm ml-auto">
            {formData.bio.length}/500
          </p>
        </div>
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition"
      >
        {isLoading ? 'Saving...' : submitButtonText}
      </button>
    </form>
  );
}
