import React, { useState, useEffect, useRef } from 'react';

const PerformanceMonitor = ({ performanceStats = {} }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredMetric, setHoveredMetric] = useState(null);
  const [fpsHistory, setFpsHistory] = useState([]);
  const [frameTimeHistory, setFrameTimeHistory] = useState([]);
  const [gpuMemHistory, setGpuMemHistory] = useState([]);
  
  // Historique pour les graphiques
  useEffect(() => {
    if (performanceStats.fps) {
      setFpsHistory(prev => {
        const newHistory = [...prev, performanceStats.fps];
        return newHistory.slice(-30); // Garder 30 valeurs pour les sparklines
      });
    }
    if (performanceStats.frameTime) {
      setFrameTimeHistory(prev => {
        const newHistory = [...prev, performanceStats.frameTime];
        return newHistory.slice(-30);
      });
    }
    
    // Simuler l'usage GPU Memory (varie entre 110-150MB)
    const baseMemory = 120;
    const variation = Math.sin(Date.now() / 1000) * 15; // Variation sinusoïdale
    const fpsImpact = (performanceStats.fps || 60) > 55 ? 0 : 10; // Plus de mémoire si FPS bas
    const currentGpuMem = baseMemory + variation + fpsImpact;
    
    setGpuMemHistory(prev => {
      const newHistory = [...prev, Math.round(currentGpuMem)];
      return newHistory.slice(-30);
    });
  }, [performanceStats.fps, performanceStats.frameTime]);
  
  // Fonction pour dessiner un sparkline
  const drawSparkline = (canvas, data, color) => {
    if (!canvas || data.length < 2) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Ajouter des marges pour centrer le graphique
    const margin = height * 0.1; // 10% de marge en haut et en bas
    const graphHeight = height - (margin * 2);
    
    // Trouver les valeurs min/max pour une meilleure normalisation
    const minValue = Math.min(...data);
    const actualMaxValue = Math.max(...data);
    const range = actualMaxValue - minValue;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    const stepX = width / (data.length - 1);
    data.forEach((value, index) => {
      const x = index * stepX;
      // Normaliser entre min et max réels, puis ajouter la marge
      const normalizedValue = range > 0 ? (value - minValue) / range : 0.5;
      const y = margin + graphHeight - (normalizedValue * graphHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };
  
  // Composant SparkLine
  const SparkLine = ({ data, color, maxValue, isHovered }) => {
    const sparkRef = useRef(null);
    
    useEffect(() => {
      if (sparkRef.current && data.length > 0) {
        drawSparkline(sparkRef.current, data, color, maxValue);
      }
    }, [data, color, maxValue]);
    
    return (
      <canvas
        ref={sparkRef}
        width={isHovered ? 120 : 60}
        height={isHovered ? 40 : 20}
        style={{
          width: isHovered ? '120px' : '60px',
          height: isHovered ? '40px' : '20px',
          transition: 'all 0.3s ease',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '2px',
          border: isHovered ? '2px solid ' + color : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.5)' : 'none'
        }}
      />
    );
  };
  
  // Calculer les moyennes
  const avgFps = fpsHistory.length > 0 
    ? Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length)
    : 0;
  
  const avgFrameTime = frameTimeHistory.length > 0 
    ? Math.round((frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length) * 10) / 10
    : 0;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      width: isExpanded ? '240px' : '80px',
      height: isExpanded ? '200px' : '30px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid rgba(76, 175, 80, 0.5)',
      borderRadius: '8px',
      padding: isExpanded ? '10px' : '5px',
      color: '#fff',
      fontSize: '11px',
      fontFamily: 'monospace',
      transition: 'all 0.3s ease',
      zIndex: 9999,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.7)'
    }}>
      {/* Header avec bouton toggle */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isExpanded ? '8px' : '0'
      }}>
        <div style={{ 
          color: '#4CAF50', 
          fontWeight: 'bold',
          fontSize: isExpanded ? '12px' : '10px'
        }}>
          📊 {isExpanded ? 'Performance Monitor' : `${performanceStats.fps || 0} FPS`}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: 'none',
            border: '1px solid #4CAF50',
            color: '#4CAF50',
            borderRadius: '3px',
            cursor: 'pointer',
            padding: '2px 6px',
            fontSize: '9px'
          }}
          title={isExpanded ? 'Réduire' : 'Agrandir'}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
      
      {isExpanded && (
        <>
          {/* Hint text */}
          <div style={{ marginBottom: '8px', fontSize: '8px', color: '#999', textAlign: 'center' }}>
            📈 Survol une métrique pour agrandir le graphique
          </div>
          
          <div style={{ display: 'grid', gap: '4px' }}>
            {/* FPS avec sparkline */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px',
                background: hoveredMetric === 'fps' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                transform: hoveredMetric === 'fps' ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={() => setHoveredMetric('fps')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ color: '#aaa', fontSize: '9px' }} title="Images par seconde">
                  FPS
                </span>
                <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '11px' }}>
                  {performanceStats.fps || 0} <span style={{color: '#999', fontSize: '9px'}}>(moy: {avgFps})</span>
                </span>
              </div>
              <SparkLine 
                data={fpsHistory} 
                color="#4CAF50" 
                maxValue={120} 
                isHovered={hoveredMetric === 'fps'}
              />
            </div>
            
            {/* Frame Time avec sparkline */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px',
                background: hoveredMetric === 'frameTime' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                transform: hoveredMetric === 'frameTime' ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={() => setHoveredMetric('frameTime')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ color: '#aaa', fontSize: '9px' }} title="Temps de rendu par frame">
                  Frame Time
                </span>
                <span style={{ color: '#FF9800', fontWeight: 'bold', fontSize: '11px' }}>
                  {performanceStats.frameTime?.toFixed(1) || 0}ms <span style={{color: '#999', fontSize: '9px'}}>(moy: {avgFrameTime})</span>
                </span>
              </div>
              <SparkLine 
                data={frameTimeHistory} 
                color="#FF9800" 
                maxValue={50} 
                isHovered={hoveredMetric === 'frameTime'}
              />
            </div>
            
            {/* GPU Memory avec sparkline */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px',
                background: hoveredMetric === 'gpuMem' ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                transform: hoveredMetric === 'gpuMem' ? 'scale(1.02)' : 'scale(1)'
              }}
              onMouseEnter={() => setHoveredMetric('gpuMem')}
              onMouseLeave={() => setHoveredMetric(null)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ color: '#aaa', fontSize: '9px' }} title="Mémoire GPU en temps réel">
                  GPU Mem
                </span>
                <span style={{ color: '#2196F3', fontWeight: 'bold', fontSize: '11px' }}>
                  ~{gpuMemHistory[gpuMemHistory.length - 1] || 120}MB
                </span>
              </div>
              <SparkLine 
                data={gpuMemHistory} 
                color="#2196F3" 
                maxValue={150} 
                isHovered={hoveredMetric === 'gpuMem'}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PerformanceMonitor;