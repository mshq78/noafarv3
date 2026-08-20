import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tool } from '../types';
import { getContentDetail } from '../services/endpoints';
import { InteractiveCanvas } from '../components/canvas/InteractiveCanvas';
import { Skeleton } from '../components/ui';

export const ToolCanvasPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    getContentDetail('toolbox', slug)
      .then((data) => {
        setTool(data as Tool);
      })
      .catch(() => {
        navigate('/toolbox');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [slug, navigate]);

  if (isLoading || !tool) {
    return (
      <div className="h-screen bg-ink-100 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white p-8 rounded-2xl space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return <InteractiveCanvas tool={tool} />;
};
