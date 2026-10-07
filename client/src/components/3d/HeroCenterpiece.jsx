import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float, OrbitControls, Sparkles } from '@react-three/drei';

const AnimatedCenterpiece = () => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.25;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.35;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.4, 2]} />
        <MeshDistortMaterial
          color="#2D4A3E"
          attach="material"
          distort={0.45}
          speed={2.2}
          roughness={0.15}
          metalness={0.9}
        />
      </mesh>
    </Float>
  );
};

const OrbitalRingOne = () => {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;
      ringRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.4;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[3.4, 0.06, 16, 100]} />
      <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.95} />
    </mesh>
  );
};

const OrbitalRingTwo = () => {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = -state.clock.getElapsedTime() * 0.15;
      ringRef.current.rotation.y = Math.cos(state.clock.getElapsedTime() * 0.25) * 0.5;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[4.1, 0.04, 16, 100]} />
      <meshStandardMaterial color="#3B6051" roughness={0.3} metalness={0.8} />
    </mesh>
  );
};

export const HeroCenterpiece = () => {
  return (
    <div className="w-full h-[460px] lg:h-[540px] relative flex items-center justify-center">
      {/* Background Soft Glow Radial Aura */}
      <div className="absolute w-80 h-80 rounded-full bg-forge-accent/25 blur-[90px] pointer-events-none animate-pulse-slow" />
      <div className="absolute w-60 h-60 rounded-full bg-forge-gold/15 blur-[80px] pointer-events-none" />

      {/* 3D WebGL Canvas */}
      <Canvas camera={{ position: [0, 0, 8.5], fov: 45 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 6, 6]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-6, -6, -6]} intensity={1.2} color="#D4AF37" />
        <pointLight position={[0, 6, -2]} intensity={1.5} color="#3B6051" />
        
        <Sparkles count={60} scale={10} size={2.5} speed={0.4} opacity={0.6} color="#D4AF37" />
        
        <AnimatedCenterpiece />
        <OrbitalRingOne />
        <OrbitalRingTwo />
        
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.2} />
      </Canvas>
    </div>
  );
};
