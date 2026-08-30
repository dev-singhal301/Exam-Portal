import { useEffect, useState, useCallback } from 'react';

export const useAntiCheat = (maxStrikes = 3, onTerminate) => {
  const [strikes, setStrikes] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWarningActive, setIsWarningActive] = useState(false);

  const requestFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setIsWarningActive(false);
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  }, []);

  const registerViolation = useCallback(() => {
    setStrikes((prev) => {
      const next = prev + 1;
      setIsWarningActive(true);
      if (next >= maxStrikes && onTerminate) {
        onTerminate(next);
      }
      return next;
    });
  }, [maxStrikes, onTerminate]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        registerViolation();
      } else {
        setIsFullscreen(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation();
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
        (e.ctrlKey && ['C', 'V', 'U', 'A', 'P', 'S'].includes(e.key.toUpperCase())) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [registerViolation]);

  return { strikes, isFullscreen, isWarningActive, requestFullscreen, setIsWarningActive };
};