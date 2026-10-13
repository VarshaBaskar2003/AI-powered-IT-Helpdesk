import { useRef, useState } from "react";

/**
 * Card3D provides realistic 3D tilt interaction, elevation, and specular glare.
 * Uses hardware accelerated CSS transforms.
 */
export function Card3D({
  children,
  className = "",
  glare = true,
  maxTilt = 8,
  scale = 1.02,
  onClick,
  as: Component = "div",
  ...props
}) {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });

  function handleMouseMove(e) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(8px) scale3d(${scale}, ${scale}, ${scale})`,
      transition: "transform 0.1s ease-out",
    });

    if (glare) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      setGlareStyle({
        opacity: 0.45,
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 70%)`,
        transition: "opacity 0.2s ease",
      });
    }
  }

  function handleMouseLeave() {
    setStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)",
      transition: "transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
    });
    if (glare) {
      setGlareStyle({
        opacity: 0,
        transition: "opacity 0.45s ease",
      });
    }
  }

  return (
    <Component
      ref={cardRef}
      className={`card-3d ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...props}
    >
      {glare && <div className="card-3d-glare" style={glareStyle} aria-hidden="true" />}
      <div className="card-3d-inner">{children}</div>
    </Component>
  );
}

export default Card3D;
