// File: components/atoms/Notification.tsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { hideNotification } from '../../store/notificationSlice';
import styles from '../../styles/components/atoms/Notification.module.css';

const Notification: React.FC = () => {
  const dispatch = useDispatch();
  const { message, type } = useSelector((state: RootState) => state.notification);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(hideNotification());
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [message, dispatch]);

  if (!message) return null;

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <p>{message}</p>
      <button onClick={() => dispatch(hideNotification())} className={styles.closeButton}>
        &times;
      </button>
    </div>
  );
};

export default Notification;
