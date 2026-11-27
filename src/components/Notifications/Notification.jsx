import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../../context/GameContext.jsx';
import './Notification.css';

export default function Notification() {
  const { state } = useGame();
  const { notification } = state;

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          className={`notification notification--${notification.type ?? 'success'}`}
          initial={{ opacity: 0, y: -40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <span className="notif-icon">✿</span>
          <span className="notif-text">{notification.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
