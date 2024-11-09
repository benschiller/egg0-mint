import React, { useState, useEffect, useCallback, memo } from 'react';
import WalletConnect from './components/WalletConnect';
import InscriptionForm from './components/InscriptionForm';
import PayloadSummary from './components/PayloadSummary';
import useCollectionSupply from './hooks/useCollectionSupply';
import './App.css';

// Mobile detection helper
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Update MintProgress to handle loading state
const MintProgress = memo(({ current, total, loading }) => (
  <div className="mint-progress">
    <div className="mint-progress-text">
      {loading ? 'Loading...' : `${current} / ${total} minted`}
    </div>
    <div className="mint-progress-bar-container">
      <div 
        className="mint-progress-bar" 
        style={{ width: `${loading ? 0 : (current / total) * 100}%` }}
      />
    </div>
  </div>
));

// Update PreviewSection to accept supply data
const PreviewSection = memo(({ isWalletConnected, iframeKey, supply, loading }) => (
  <div className={`preview-section ${isWalletConnected ? 'connected' : ''}`}>
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

// Mobile notice component
const MobileNotice = memo(() => (
  <div className="mobile-notice">
    <h2>Desktop Required</h2>
    <p>For the best minting experience and wallet compatibility, please use a desktop browser with Xverse wallet.</p>
    <p>Feel free to explore the preview on mobile!</p>
  </div>
));

function App() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [payloadSummary, setPayloadSummary] = useState({});
  const [iframeKey, setIframeKey] = useState(0);
  const isMobileDevice = isMobile();
  const { supply, loading, error } = useCollectionSupply();

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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [refreshIframe]);

  const handleTransactionComplete = (commitId, revealId) => {
    console.log('Transaction completed:', { commitId, revealId });
  };

  return (
    <div className="app-container">
      <div className="nav-container">
        <div className="nav-title">
          <h1>Mint egg0</h1>
          <h3>Inscribe BRC-420 directly from your wallet</h3>
        </div>

        {!isMobileDevice && (
          <WalletConnect 
            onConnected={() => {
              refreshIframe();
              setIsWalletConnected(true);
            }}
            onDisconnected={() => {
              refreshIframe();
              setIsWalletConnected(false);
            }} 
          />
        )}
      </div>

      <div className="main-content">
        {isMobileDevice ? (
          <div className="mobile-layout">
            <PreviewSection 
              isWalletConnected={false} 
              iframeKey={iframeKey}
              supply={supply}
              loading={loading}
            />
            <MobileNotice />
          </div>
        ) : (
          !isWalletConnected ? (
            <div className="preview-container">
              <PreviewSection 
                isWalletConnected={isWalletConnected} 
                iframeKey={iframeKey}
                supply={supply}
                loading={loading}
              />
            </div>
          ) : (
            <div className="two-column-layout">
              <div className="column">
                <PreviewSection 
                  isWalletConnected={isWalletConnected} 
                  iframeKey={iframeKey}
                  supply={supply}
                  loading={loading}
                />
              </div>

              <div className="column">
                <div className="mint-summary">
                  <h2>Mint Summary</h2>
                  <div className="inscription-details">
                    <h3>Inscription Details</h3>
                    <div className="inscription-details-content">
                      <PayloadSummary payload={payloadSummary} />
                    </div>
                  </div>

                  <InscriptionForm 
                    onPayloadChange={setPayloadSummary} 
                    onTransactionComplete={handleTransactionComplete}
                  />
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;
