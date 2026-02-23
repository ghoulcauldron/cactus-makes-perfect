import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export function ResponsiveCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    let targetZ = 6; 
    
    // Mobile-first logic: increase distance as screen gets narrower
    if (aspect < 1.2) targetZ = 5.5 / aspect; 
    
    camera.position.z = targetZ;
    camera.updateProjectionMatrix();
  }, [size, camera]);

  return null;
}