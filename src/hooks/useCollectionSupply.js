import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001';

const useCollectionSupply = () => {
    const [supply, setSupply] = useState(888);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mintComplete, setMintComplete] = useState(true);

    useEffect(() => {
        const fetchSupply = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/supply`);
                setSupply(response.data.total);
                setMintComplete(response.data.mintComplete || true);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching supply:', error);
                // If API fails, default to showing mint as complete
                setSupply(888);
                setMintComplete(true);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchSupply();
        // No need to poll frequently since mint is complete
        const intervalId = setInterval(fetchSupply, 300000); // Check every 5 minutes
        return () => clearInterval(intervalId);
    }, []);

    return { supply, loading, error, mintComplete };
};

export default useCollectionSupply;
