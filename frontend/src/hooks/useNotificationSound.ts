import { useEffect, useRef } from "react";

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {

    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 0.5; 
  }, []);

  const playNotification = () => {
    if (!audioRef.current) return;

    
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      console.log("permission denied by browser");
      
    });
  };

  return { playNotification };
}