import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

/**
 * EditorLayout - A dedicated layout for pages that contain editors with fullscreen functionality.
 * This component manages the fullscreen state and provides a clean interface for editor pages.
 */
const EditorLayout: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // This function will be passed down to editor components
  const handleFullscreenChange = (fullscreen: boolean) => {
    setIsFullscreen(fullscreen);
  };
  
  // When fullscreen, we display a minimal layout
  if (isFullscreen) {
    return (
      <div className="h-screen w-screen bg-background">
        {/* Pass the fullscreen handler to child routes */}
        <Outlet context={{ onFullscreenChange: handleFullscreenChange, isFullscreen }} />
      </div>
    );
  }
  
  // Normal view when not in fullscreen
  return (
    <div className="h-full w-full">
      {/* Pass the fullscreen handler to child routes */}
      <Outlet context={{ onFullscreenChange: handleFullscreenChange, isFullscreen }} />
    </div>
  );
};

export default EditorLayout; 