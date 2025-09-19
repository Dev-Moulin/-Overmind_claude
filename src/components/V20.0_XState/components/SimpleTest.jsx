// SimpleTest.jsx - Test ultra-simple pour diagnostiquer le problème
import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{ 
      position: 'fixed',
      top: '50px',
      right: '50px',
      padding: '20px', 
      border: '5px solid #FF0000', 
      borderRadius: '8px',
      backgroundColor: '#FF0000',
      color: 'white',
      fontFamily: 'Arial',
      zIndex: 99999,
      fontSize: '20px',
      fontWeight: 'bold'
    }}>
      🚨 XSTATE SIMPLE TEST VISIBLE 🚨
    </div>
  );
};

export default SimpleTest;