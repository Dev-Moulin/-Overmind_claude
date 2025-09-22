// 🎨 Canvas3D V3 - Simple et réutilisable
import { forwardRef } from 'react';

const Canvas3D = forwardRef((props, ref) => {
  return (
    <canvas 
      ref={ref} 
      style={{ display: 'block' }}
      {...props}
    />
  );
});

Canvas3D.displayName = 'Canvas3D';

export default Canvas3D;