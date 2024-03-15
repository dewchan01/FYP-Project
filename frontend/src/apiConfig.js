const apiUrl = () => {
    if (process.env.REACT_APP_NODE_ENV === 'production') {
        return 'https://webthreewalletapi.netlify.app/.netlify/functions/api';
    } else if (process.env.REACT_APP_NODE_ENV === 'development') {
        return 'http://localhost:3001';
    } else {
        return 'http://localhost:3001'; // Default URL for other environments
    }
}

export default apiUrl;
