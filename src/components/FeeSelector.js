import React, { useState, useEffect } from 'react';

function FeeSelector({ onFeeChange, minimumFee }) {
  const [fees, setFees] = useState(null);
  const [selectedFee, setSelectedFee] = useState('medium');
  const [customFee, setCustomFee] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      const data = await response.json();
      setFees(data);
      // Set initial fee to medium (halfHourFee) and trigger the callback
      setSelectedFee('medium');
      onFeeChange(data.halfHourFee);
    } catch (error) {
      console.error('Error fetching fees:', error);
      setWarning('Failed to fetch fee rates');
    }
  };

  const handleFeeTypeChange = (e) => {
    setSelectedFee(e.target.value);
    if (e.target.value !== 'custom') {
      const feeValue = e.target.value === 'high' ? fees.fastestFee :
                      e.target.value === 'medium' ? fees.halfHourFee :
                      fees.hourFee;
      onFeeChange(feeValue);
      setCustomFee('');
      setWarning('');
    }
  };

  const handleCustomFeeChange = (e) => {
    const value = e.target.value;
    setCustomFee(value);
    
    if (value && !isNaN(value)) {
      const numValue = Number(value);
      if (numValue < fees.hourFee) {
        setWarning(`Warning: Fee lower than recommended minimum (${fees.hourFee} sats/vB). Transaction may be delayed.`);
      } else {
        setWarning('');
      }
      onFeeChange(numValue);
    }
  };

  if (!fees) return <div>Loading fee rates...</div>;

  return (
    <div>
      <div>
        <label>
          <input
            type="radio"
            value="high"
            checked={selectedFee === 'high'}
            onChange={handleFeeTypeChange}
          />
          High Priority ({fees.fastestFee} sats/vB)
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            value="medium"
            checked={selectedFee === 'medium'}
            onChange={handleFeeTypeChange}
          />
          Medium Priority ({fees.halfHourFee} sats/vB)
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            value="low"
            checked={selectedFee === 'low'}
            onChange={handleFeeTypeChange}
          />
          Low Priority ({fees.hourFee} sats/vB)
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            value="custom"
            checked={selectedFee === 'custom'}
            onChange={handleFeeTypeChange}
          />
          Custom:
          <input
            type="number"
            value={customFee}
            onChange={handleCustomFeeChange}
            placeholder="Enter fee rate"
            disabled={selectedFee !== 'custom'}
            min="1"
            style={{ marginLeft: '8px', width: '100px' }}
          />
          &nbsp;sats/vB
        </label>
        {warning && <div style={{color: 'orange', fontSize: '0.9em', marginTop: '4px'}}>{warning}</div>}
      </div>
    </div>
  );
}

export default FeeSelector; 