import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:3001';

const useCollectionSupply = () => {
    const [supply, setSupply] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSupply = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/supply`);
                setSupply(response.data.total);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching supply:', error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchSupply();
        const intervalId = setInterval(fetchSupply, 60000);
        return () => clearInterval(intervalId);
    }, []);

    return { supply, loading, error };
};

export default useCollectionSupply;
