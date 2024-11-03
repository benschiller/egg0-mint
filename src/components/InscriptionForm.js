import React, { useState, useEffect } from 'react';
import { createRepeatInscriptions } from 'sats-connect';
import FeeSelector from './FeeSelector';

function InscriptionForm({ onPayloadChange, onTransactionComplete }) {
  const [repeatCount, setRepeatCount] = useState(1);
  const [status, setStatus] = useState('');
  const [minerFeeRate, setMinerFeeRate] = useState(null);

  const BASE_APP_FEE = 40000;

  const getPayload = () => ({
    network: {
      type: 'Mainnet'
    },
    contentType: 'text/html;charset=utf-8',
    content: '/content/c30b4d7454d06583d7cf2f9506e434ecc3b204debd578a781ed079091a71f632i0',
    payloadType: "PLAIN_TEXT",
    appFee: BASE_APP_FEE * repeatCount,
    appFeeAddress: 'bc1pppsq0wf6hpgd9j9fzc5xzzzhundw54ra038hdaae2hrmnu2zyrgqpwzvwd',
    suggestedMinerFeeRate: minerFeeRate || 0
  });

  useEffect(() => {
    if (minerFeeRate !== null) {
      onPayloadChange(getPayload());
    }
  }, [onPayloadChange, repeatCount, minerFeeRate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Creating inscription...');

    try {
      const inscriptionOptions = {
        payload: {
          ...getPayload(),
          repeat: Number(repeatCount),
        },
        onFinish: (response) => {
          console.log('Inscription created successfully:', response);
          setStatus(`Inscription created! Commit TxID: ${response.commitTxid}`);
          onTransactionComplete(response.commitTxid, response.revealTxid);
        },
        onCancel: () => {
          console.log('Inscription cancelled by user');
          setStatus('Inscription cancelled');
          onTransactionComplete(null, null);
        },
      };

      console.log('Inscription options:', inscriptionOptions);

      await createRepeatInscriptions(inscriptionOptions);
    } catch (error) {
      console.error('Detailed error creating inscription:', error);
      setStatus(`Error creating inscription: ${error.message}`);
      onTransactionComplete(null, null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          <strong>Mint Count:</strong>&nbsp;
          <input
            type="number"
            value={repeatCount}
            onChange={(e) => setRepeatCount(parseInt(e.target.value))}
            min="1"
            max="24"
          />
        </label>
      </div>
      <div>
        <h3>Select Miner Fee Rate:</h3>
        <FeeSelector onFeeChange={setMinerFeeRate} />
      </div>
      <p>
        <button type="submit" className="create-inscription-button">
          Inscribe
        </button>
      </p>
      {status && <p>{status}</p>}
    </form>
  );
}

export default InscriptionForm;
