import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';

export const LoadingStateView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Loading State & Skeleton Loaders</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Smooth placeholder pulse skeletons prevent lay-out shifts during asynchronous telemetry fetches.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx}>
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="space-y-1 flex-1">
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton variant="rectangular" height={80} />
              <div className="space-y-2">
                <Skeleton variant="text" />
                <Skeleton variant="text" width="80%" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
