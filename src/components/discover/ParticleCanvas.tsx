import { forwardRef } from 'react';

interface ParticleCanvasProps {
  className?: string;
}

export const ParticleCanvas = forwardRef<HTMLCanvasElement, ParticleCanvasProps>(
  ({ className = '' }, ref) => {
    return (
      <canvas
        ref={ref}
        className={`pointer-events-none absolute inset-0 z-50 ${className}`}
        style={{ width: '100%', height: '100%' }}
      />
    );
  }
);

ParticleCanvas.displayName = 'ParticleCanvas';
