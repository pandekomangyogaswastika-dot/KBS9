import { useEffect, useRef } from 'react';

/**
 * ConstellationCanvas — fixed-position canvas yang menggambar starfield + connecting lines.
 * - Dipakai sebagai background global di PublicLayout.
 * - pointer-events: none agar tidak mengganggu interaksi.
 * - Mengurangi particle count di mobile.
 * - Pause animasi ketika tab tidak aktif (visibility) untuk hemat CPU.
 */
const ConstellationCanvas = ({
  particleCount = 180,
  connectionDistance = 120,
  parallaxRatio = 0.05,
  className = '',
  testId = 'constellation-canvas',
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const scrollRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const visibleRef = useRef(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const initParticles = (width, height) => {
      const isMobile = width < 768;
      const count = isMobile ? Math.floor(particleCount * 0.5) : particleCount;
      particlesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        radius: Math.random() * 1.6 + 0.6,
        baseOpacity: Math.random() * 0.5 + 0.35,
        twinkleSpeed: Math.random() * 0.018 + 0.006,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
    };

    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height, dpr };
      initParticles(width, height);
    };

    const drawParticle = (p) => {
      const opacity = Math.max(0.05, p.baseOpacity + Math.sin(p.twinklePhase) * 0.25);
      // Halo for bigger particles
      if (p.radius > 1.2) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.5);
        grad.addColorStop(0, `rgba(255,255,255,${opacity * 0.9})`);
        grad.addColorStop(0.4, `rgba(183,168,255,${opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(124,104,225,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, opacity + 0.2)})`;
      ctx.fill();
    };

    const drawConnections = () => {
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(124,104,225,${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (!visibleRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      const { width, height } = sizeRef.current;
      if (!width || !height) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Apply parallax based on scroll
      const offsetY = -scrollRef.current * parallaxRatio;
      ctx.save();
      ctx.translate(0, offsetY);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;
        p.twinklePhase += p.twinkleSpeed;
      }
      drawConnections();
      for (let i = 0; i < particles.length; i++) drawParticle(particles[i]);
      ctx.restore();

      animationRef.current = requestAnimationFrame(animate);
    };

    const onScroll = () => { scrollRef.current = window.scrollY; };
    const onResize = () => {
      clearTimeout(window.__kti_constellation_resize);
      window.__kti_constellation_resize = setTimeout(setSize, 150);
    };
    const onVisibility = () => { visibleRef.current = !document.hidden; };

    setSize();
    visibleRef.current = !document.hidden;
    animate();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [particleCount, connectionDistance, parallaxRatio]);

  return (
    <canvas
      ref={canvasRef}
      data-testid={testId}
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background:
          'radial-gradient(ellipse at 50% 30%, #0a0612 0%, #050409 50%, #020207 100%)',
      }}
    />
  );
};

export default ConstellationCanvas;
