import React from 'react';

interface VideoEmbedProps {
  url: string;
  title?: string;
}

// Renders YouTube/Vimeo/etc embed URLs in an iframe
const VideoEmbed: React.FC<VideoEmbedProps> = ({ url, title }) => {
  if (!url || !url.trim()) return null;

  // Support both full embed URL and convert watch URLs to embed format
  let embedUrl = url.trim();
  if (embedUrl.includes('youtube.com/watch')) {
    const match = embedUrl.match(/v=([^&]+)/);
    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`;
  } else if (embedUrl.includes('youtu.be/')) {
    const id = embedUrl.split('youtu.be/')[1]?.split('?')[0];
    if (id) embedUrl = `https://www.youtube.com/embed/${id}`;
  }

  return (
    <div className="video-embed-wrapper">
      {title && <h4 className="video-embed-title">{title}</h4>}
      <div className="video-embed-container">
        <iframe
          src={embedUrl}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default VideoEmbed;
