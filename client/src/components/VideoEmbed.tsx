import React from 'react';

interface VideoEmbedProps {
  videoUrl: string;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ videoUrl }) => {
  return (
    <div className="video-responsive" style={{ overflow: 'hidden', paddingBottom: '56.25%', position: 'relative', height: 0 }}>
      <iframe
        style={{ left: 0, top: 0, height: '100%', width: '100%', position: 'absolute' }}
        src={videoUrl}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="course video" // <--- The test looks for this exact string
      />
    </div>
  );
};

export default VideoEmbed;