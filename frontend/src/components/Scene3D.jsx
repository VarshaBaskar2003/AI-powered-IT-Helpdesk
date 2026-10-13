import { useEffect, useRef } from "react";


export function Scene3D({ variant = "ambient", className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    let mouse = { x: width / 2, y: height / 2, tx: width / 2, ty: height / 2 };
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", onMouseMove);

    // 3D Cubes / Node points
    const CUBE_COUNT = variant === "hero" ? 14 : 8;
    const cubes = Array.from({ length: CUBE_COUNT }, () => ({
      x: (Math.random() - 0.5) * width * 0.9,
      y: (Math.random() - 0.5) * height * 0.9,
      z: Math.random() * 400 + 100,
      size: Math.random() * 26 + 18,
      rx: Math.random() * Math.PI,
      ry: Math.random() * Math.PI,
      rz: Math.random() * Math.PI,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      drx: (Math.random() - 0.5) * 0.015,
      dry: (Math.random() - 0.5) * 0.018,
      color: Math.random() > 0.5 ? "rgba(99, 102, 241," : "rgba(56, 189, 248,",
    }));

    // Ambient floating glow points
    const POINTS_COUNT = variant === "hero" ? 36 : 20;
    const points = Array.from({ length: POINTS_COUNT }, () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * 500 + 50,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.2,
      radius: Math.random() * 2.5 + 1.2,
    }));

    const FOCAL_LENGTH = 400;

    function project(x, y, z) {
      const scale = FOCAL_LENGTH / (FOCAL_LENGTH + z);
      return {
        px: x * scale + width / 2,
        py: y * scale + height / 2,
        scale,
      };
    }

    // 3D Cube Vertices
    const vertices = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ];
    const edges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    function rotate3D(v, rx, ry, rz) {
      let [x, y, z] = v;
      // rot X
      let y1 = y * Math.cos(rx) - z * Math.sin(rx);
      let z1 = y * Math.sin(rx) + z * Math.cos(rx);
      // rot Y
      let x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
      let z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
      // rot Z
      let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
      let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);
      return [x3, y3, z2];
    }

    let t = 0;
    const render = () => {
      t += 0.01;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      const offsetX = (mouse.x - width / 2) * 0.15;
      const offsetY = (mouse.y - height / 2) * 0.15;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections between points
      ctx.lineWidth = 0.75;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        p1.x += p1.vx;
        p1.y += p1.vy;
        if (Math.abs(p1.x) > width / 1.5) p1.vx *= -1;
        if (Math.abs(p1.y) > height / 1.5) p1.vy *= -1;

        const proj1 = project(p1.x - offsetX, p1.y - offsetY, p1.z);
        if (proj1.px < 0 || proj1.px > width || proj1.py < 0 || proj1.py > height) continue;

        ctx.fillStyle = `rgba(129, 140, 248, ${Math.min(0.7, proj1.scale * 0.8)})`;
        ctx.beginPath();
        ctx.arc(proj1.px, proj1.py, p1.radius * proj1.scale, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 14000) {
            const proj2 = project(p2.x - offsetX, p2.y - offsetY, p2.z);
            const alpha = (1 - Math.sqrt(distSq) / 120) * 0.25 * proj1.scale;
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(proj1.px, proj1.py);
            ctx.lineTo(proj2.px, proj2.py);
            ctx.stroke();
          }
        }
      }

      // Draw floating 3D cubes with depth
      cubes.forEach((cube) => {
        cube.rx += cube.drx;
        cube.ry += cube.dry;
        cube.x += cube.dx;
        cube.y += cube.dy;
        if (Math.abs(cube.x) > width * 0.55) cube.dx *= -1;
        if (Math.abs(cube.y) > height * 0.55) cube.dy *= -1;

        const transformedVertices = vertices.map((v) => {
          const [rx, ry, rz] = rotate3D(v, cube.rx, cube.ry, cube.rz);
          const scaledX = rx * cube.size + cube.x - offsetX;
          const scaledY = ry * cube.size + cube.y - offsetY;
          const scaledZ = rz * cube.size + cube.z;
          return project(scaledX, scaledY, scaledZ);
        });

        const avgScale = FOCAL_LENGTH / (FOCAL_LENGTH + cube.z);
        const alpha = Math.min(0.4, avgScale * 0.5);

        ctx.lineWidth = Math.max(1, 1.6 * avgScale);
        ctx.strokeStyle = `${cube.color} ${alpha})`;

        edges.forEach(([i1, i2]) => {
          const p1 = transformedVertices[i1];
          const p2 = transformedVertices[i2];
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        });
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [variant]);

  return <canvas ref={canvasRef} className={`scene-3d ${className}`} aria-hidden="true" />;
}

export default Scene3D;
