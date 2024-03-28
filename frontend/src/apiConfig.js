const apiUrl = () => {
    if (process.env.REACT_APP_NODE_ENV === 'production') {
        return 'https://web3wallet-migrate-api.netlify.app/.netlify/functions/api';
    } else if (process.env.REACT_APP_NODE_ENV === 'development') {
        return 'http://localhost:3001';
    } else {
        return 'http://localhost:3001';
    }
}

export default apiUrl;
