import { useEffect, useState, useCallback, useRef } from 'react';

export function useAntiCheat(maxStrikes = 3, onTerminate, storageKey = 'exam_session_strikes') {
  // Initialize strikes from localStorage to persist across navigation/refreshes
  const [strikes, setStrikes] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isWarningActive, setIsWarningActive] = useState(false);
  const onTerminateRef = useRef(onTerminate);
  onTerminateRef.current = onTerminate;

  // Sync violation increments to localStorage and check max bounds
  const registerViolation = useCallback(() => {
    setStrikes((prev) => {
      const nextStrikes = prev + 1;
      localStorage.setItem(storageKey, nextStrikes.toString());

      if (nextStrikes >= maxStrikes) {
        if (onTerminateRef.current) onTerminateRef.current(nextStrikes);
      } else {
        setIsWarningActive(true);
      }
      return nextStrikes;
    });
  }, [maxStrikes, storageKey]);

  // Request Fullscreen helper
  const requestFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setIsWarningActive(false);
    } catch (err) {
      console.warn('Fullscreen request blocked by browser policy:', err);
    }
  };

  useEffect(() => {
    // 1. Trap browser back/forward navigation
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
      registerViolation();
    };

    // 2. Fullscreen monitor
    const handleFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement);
      setIsFullscreen(inFullscreen);
      if (!inFullscreen) {
        registerViolation();
      }
    };

    // 3. Tab switch & window blur monitor
    const handleVisibilityChange = () => {
      if (document.hidden) {
        registerViolation();
      }
    };

    const handleWindowBlur = () => {
      registerViolation();
    };

    // 4. Prevent copy, cut, and right-click context menus
    const preventAction = (e) => e.preventDefault();

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', preventAction);
    document.addEventListener('copy', preventAction);
    document.addEventListener('cut', preventAction);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', preventAction);
      document.removeEventListener('copy', preventAction);
      document.removeEventListener('cut', preventAction);
    };
  }, [registerViolation]);

  return {
    strikes,
    isFullscreen,
    isWarningActive,
    requestFullscreen,
  };
}