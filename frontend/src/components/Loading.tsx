import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  fullPage?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading...',
  fullPage = false,
}) => {
  if (fullPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium text-slate-600">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="w-full space-y-3 animate-pulse">
    <div className="h-10 bg-slate-200 rounded w-full"></div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-slate-100 rounded w-full"></div>
    ))}
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse space-y-3">
    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
    <div className="h-8 bg-slate-200 rounded w-2/3"></div>
    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
  </div>
);
