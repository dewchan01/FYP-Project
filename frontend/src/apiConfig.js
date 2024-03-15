const apiUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'http://webthreewallet.netlify.app/.netlify/functions/api';
    } else if (process.env.NODE_ENV === 'development') {
        return 'http://localhost:3001';
    } else {
        return 'http://localhost:3001'; // Default URL for other environments
    }
}

export default apiUrl;
