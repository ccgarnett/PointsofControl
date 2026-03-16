import React from 'react';

interface SkeletonProps {
  height?: string;
  width?: string;
  borderRadius?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  height = '1rem',
  width = '100%',
  borderRadius = '6px',
}) => <div className="skeleton" style={{ height, width, borderRadius }} />;

export const SkeletonPage: React.FC<{ cards?: number }> = ({ cards = 3 }) => (
  <div className="skeleton-page">
    <div className="skeleton-sidebar" />
    <div className="skeleton-content">
      <Skeleton height="2rem" width="200px" />
      <Skeleton height="1rem" width="120px" />
      <div className="skeleton-grid">
        {Array.from({ length: cards }).map((_, i) => (
          <div className="skeleton-card" key={i}>
            <Skeleton height="100px" />
            <Skeleton height="1rem" width="70%" />
            <Skeleton height="0.75rem" width="90%" />
            <Skeleton height="0.5rem" width="40%" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
