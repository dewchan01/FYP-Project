function refreshAlert({ address }) {
    if (!address) {
        alert("Page Refreshed Detected! Please Connect Your Account Again!");
        window.location.href='/';
        return;
    }
}

export default refreshAlert;
