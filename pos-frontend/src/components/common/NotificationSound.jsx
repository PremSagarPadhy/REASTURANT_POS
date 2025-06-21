import React, { useEffect, useRef } from 'react';

const NotificationSound = ({ soundUrl, play }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (play && audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log('Error playing notification sound:', error);
      });
    }
  }, [play, soundUrl]);

  return <audio ref={audioRef} src={soundUrl} />;
};

export default NotificationSound;