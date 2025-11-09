'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="xl" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}

interface InlineLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InlineLoading({ message = 'Loading...', size = 'md' }: InlineLoadingProps) {
  return (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner size={size} className="mr-2" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
}

export function ButtonLoading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center">
      <LoadingSpinner size="sm" className="mr-2" />
      {children}
    </div>
  );
}