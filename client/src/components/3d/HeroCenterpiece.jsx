import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Float, OrbitControls } from '@react-three/drei';

const AnimatedShape = () => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2.2, 1]} />
        <MeshDistortMaterial
          color="#2D4A3E"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
};

const SecondaryRings = () => {
  const ringRef = useRef();

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.15;
      ringRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.3;
    }
  });

  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[3.2, 0.08, 16, 100]} />
      <meshStandardMaterial color="#D4AF37" roughness={0.3} metalness={0.9} />
    </mesh>
  );
};

export const HeroCenterpiece = () => {
  return (
    <div className="w-full h-[420px] lg:h-[480px] relative flex items-center justify-center">
      {/* Background Soft Glow Radial */}
      <div className="absolute w-72 h-72 rounded-full bg-forge-accent/20 blur-3xl pointer-events-none" />

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#D4AF37" />
        <AnimatedShape />
        <SecondaryRings />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
};
