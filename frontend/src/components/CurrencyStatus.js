import React, { useState } from "react";
import CurrentBalance from "./CurrentBalance";
import RequestAndPay from "./RequestAndPay";

function CurrencyStatus({ sgd, myr, address, getBalance, requests,rate,expiringTime, isFXRateResponseValid,getFXRate }) {
    const [selectedCurrency, setSelectedCurrency] = useState('1');

    return (
        <div>
            <CurrentBalance
                sgd={sgd}
                myr={myr}
                address={address}
                getBalance={getBalance}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
            />
            <RequestAndPay requests={requests} getBalance={getBalance} address={address} selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency} rate={rate} expiringTime = {expiringTime} isFXRateResponseValid={isFXRateResponseValid} getFXRate={getFXRate}/>

            {/* You can use getSelectedCurrencyState here too */}
        </div>
    );
}

export default CurrencyStatus;
