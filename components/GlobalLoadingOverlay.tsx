'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { LoadingSpinner } from '@/components/ui/loading';

export default function GlobalLoadingOverlay() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <LoadingSpinner size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Please wait</h3>
            <p className="text-gray-600">{loadingMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}