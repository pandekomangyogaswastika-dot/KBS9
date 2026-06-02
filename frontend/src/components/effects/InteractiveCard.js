import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

const InteractiveCard = ({ 
  children, 
  className = '',
  onClick,
  enableRipple = true,
  enableHover = true,
  staggerIndex = 0,
  ...props 
}) => {
  const [ripples, setRipples] = useState([]);
  const cardRef = useRef(null);

  const handleClick = (e) => {
    if (enableRipple && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = {
        x,
        y,
        id: Date.now()
      };
      
      setRipples(prev => [...prev, ripple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== ripple.id));
      }, 600);
    }
    
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ 
        duration: 0.5, 
        delay: staggerIndex * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={enableHover ? {
        y: -4,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      } : {}}
      onClick={handleClick}
      {...props}
    >
      {children}
      
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            background: 'rgba(124, 104, 225, 0.3)'
          }}
          initial={{ 
            width: 0, 
            height: 0, 
            opacity: 0.3,
            x: '-50%',
            y: '-50%'
          }}
          animate={{ 
            width: 400, 
            height: 400, 
            opacity: 0
          }}
          transition={{ 
            duration: 0.6,
            ease: 'easeOut'
          }}
        />
      ))}
    </motion.div>
  );
};

export default InteractiveCard;
