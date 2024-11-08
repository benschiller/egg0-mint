import React from 'react';

function PayloadSummary({ payload }) {
  return (
    <div>
      {/* <p><strong>Network:</strong> {payload.network?.type || 'Not specified'}</p>
      <p><strong>Content:</strong> {payload.content || 'Not specified'}</p>
      <p><strong>Content Type:</strong> {payload.contentType || 'Not specified'}</p>
      <p><strong>Payload Type:</strong> {payload.payloadType || 'Not specified'}</p>
      <p><strong>Royalty Fee Address:</strong> {payload.appFeeAddress || 'Not specified'}</p> */}
      <p><strong>Royalty:</strong> {payload.appFee ? `${payload.appFee} sats` : 'Not specified'}</p>
      <p><strong>Miner Fee Rate:</strong> {payload.suggestedMinerFeeRate ? `${payload.suggestedMinerFeeRate} sats/vB` : 'Not specified'}</p>
    </div>
  );
}

export default PayloadSummary;
