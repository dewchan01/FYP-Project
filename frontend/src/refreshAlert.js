function refreshAlert({ address }) {
    if (!address) {
        alert("Page Refreshed Detected! Please Connect Your Account Again!");
        if (process.env.REACT_APP_NODE_ENV === 'production'){
            window.location.href = "https://web3wallet-migrate.netlify.app";
        }
        else{
            window.location.href = "http://localhost:3001";
        }
        return;
    }
}

export default refreshAlert;
