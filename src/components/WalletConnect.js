import React, { useState } from 'react';
import { getAddress } from 'sats-connect';

function WalletConnect({ onConnected, onDisconnected }) {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    const getAddressOptions = {
      payload: {
        purposes: ['ordinals', 'payment'],
        message: 'Address for receiving Ordinals and payments',
        network: {
          type: 'Mainnet'
        },
      },
      onFinish: (response) => {
        setAddress(response.addresses[0].address);
        setIsConnected(true);
        onConnected();
      },
      onCancel: () => alert('Request canceled'),
    };

    await getAddress(getAddressOptions);
  };

  const disconnectWallet = () => {
    setAddress('');
    setIsConnected(false);
    onDisconnected();
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-connect-container">
      {isConnected ? (
        <>
          <button 
            onClick={disconnectWallet}
            className="wallet-connect-button disconnecting"
          >
            Disconnect
          </button>
          <div className="connected-address">
            {truncateAddress(address)}
          </div>
        </>
      ) : (
        <button 
          onClick={connectWallet}
          className="wallet-connect-button"
        >
          Connect Xverse
        </button>
      )}
    </div>
  );
}

export default WalletConnect;
