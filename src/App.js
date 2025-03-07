import React, { useState, useEffect, useCallback, memo } from 'react';
import useCollectionSupply from './hooks/useCollectionSupply';
import Confetti from 'react-confetti';
import './App.css';

// Mobile detection helper
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Update MintProgress to handle loading state
const MintProgress = memo(({ current, total, loading }) => {
  // Calculate percentage with 2 decimal places
  const percentage = loading ? 0 : ((current / total) * 100).toFixed(2);
  
  return (
    <div className="mint-progress">
      <div className="mint-progress-text">
        {loading ? 'Loading...' : `${current} / ${total} minted (${percentage}%)`}
      </div>
      <div className="mint-progress-bar-container">
        <div 
          className="mint-progress-bar" 
          style={{ width: `${loading ? 0 : (current / total) * 100}%` }}
        />
      </div>
    </div>
  );
});

// Update PreviewSection to accept supply data
const PreviewSection = memo(({ iframeKey, supply, loading }) => (
  <div className="preview-section connected">
    <MintProgress current={supply} total={888} loading={loading} />
    <div className="preview-frame">
      <iframe
        key={iframeKey}
        src="https://ordinals.com/content/c30b4d7454d06583d7cf2f9506e434ecc3b204debd578a781ed079091a71f632i0"
        className="preview-iframe"
        loading="eager"
        importance="high"
        title="Inscription Preview"
      />
    </div>
    <div className="preview-controls">
      Rotate • Zoom • Move
    </div>
  </div>
));

// Congratulations component
const CongratulationsMessage = memo(() => (
  <div className="mint-summary">
    <h2>Mint Complete!</h2>
    <div className="value-props">
      <div className="value-prop">
        <span className="emoji">🎉</span>
        <span>All 888 egg0 NFTs have been successfully minted!</span>
      </div>
      <div className="value-prop">
        <span className="emoji">🙏</span>
        <span>Thank you to everyone who participated in the mint</span>
      </div>
      <div className="value-prop">
        <span className="emoji">🥚</span>
        <span>View the collection on <a href="https://magiceden.io/ordinals/marketplace/egg0" target="_blank" rel="noopener noreferrer" style={{ color: '#F4900C' }}>Magic Eden</a></span>
      </div>
    </div>
    <div className="built-by">
      Built by <a 
        href="https://x.com/benschiller_xyz/status/1886998694798483474" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ color: '#F4900C' }}
      >
        @benschiller_xyz
      </a>
    </div>
  </div>
));

function App() {
  const [iframeKey, setIframeKey] = useState(0);
  const isMobileDevice = isMobile();
  const { supply, loading } = useCollectionSupply();
  const [confettiPieces, setConfettiPieces] = useState(isMobileDevice ? 200 : 500);

  const refreshIframe = useCallback(() => {
    setIframeKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    let timeoutId;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshIframe();
      }, 250);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    // Start fading out confetti after 4 seconds
    const fadeStartTimeout = setTimeout(() => {
      // Gradually reduce the number of confetti pieces
      const fadeInterval = setInterval(() => {
        setConfettiPieces(prev => {
          const newValue = prev - (isMobileDevice ? 10 : 25);
          return newValue <= 0 ? 0 : newValue;
        });
      }, 200); // Reduce every 200ms
      
      // Clear the interval after 5 seconds (total animation time: 9 seconds)
      setTimeout(() => {
        clearInterval(fadeInterval);
        setConfettiPieces(0);
      }, 5000);
    }, 4000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
      clearTimeout(fadeStartTimeout);
    };
  }, [refreshIframe, isMobileDevice]);

  return (
    <div className="app-container">
      {confettiPieces > 0 && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={confettiPieces}
          gravity={0.2}
          colors={['#F4900C', '#FFD700', '#FFFFFF', '#87CEEB', '#FF6347']}
        />
      )}
      <div className="nav-container">
        <div className="nav-title">
          <h1>egg0 by Ben Schiller</h1>
          <h3>🥚 All 888 NFTs have been successfully minted!</h3>
        </div>
      </div>

      <div className="main-content">
        {isMobileDevice ? (
          <div className="mobile-layout">
            <PreviewSection 
              iframeKey={iframeKey}
              supply={supply}
              loading={loading}
            />
            <CongratulationsMessage />
          </div>
        ) : (
          <div className="two-column-layout">
            <div className="column">
              <PreviewSection 
                iframeKey={iframeKey}
                supply={supply}
                loading={loading}
              />
            </div>
            <div className="column">
              <CongratulationsMessage />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
