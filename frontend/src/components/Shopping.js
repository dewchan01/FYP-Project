import React, { useState, useEffect } from "react";
import axios from 'axios';
import SiderPanel from "./SiderPanel";
import apiUrl from "../apiConfig";
import refreshAlert from "../refreshAlert";

function Shopping({address,sgd,myr,getFXRate,getBalance}) {
    refreshAlert({ address });
    console.log("Address",address)
    const baseURL = apiUrl();
    const [isValidUser, setIsValidUser] = useState(false);
    const [isValidSeller, setIsValidSeller] = useState(false);
    const [balanceOfVouchers, setBalanceOfVouchers] = useState([]);
    const [expiredVouchers, setExpiredVouchers] = useState([]);

    async function checkValidUser() {
        const res = await axios.get(`${baseURL}/isValidUser`, {
            params: { userAddress: address },
        });

        const response = res.data;
        setIsValidUser(response);

    }
    async function checkValidSeller() {
        const res = await axios.get(`${baseURL}/isValidSeller`, {
            params: { userAddress: address },
        });

        const response = res.data;
        setIsValidSeller(response);

    }

    async function getBalanceOfVoucher() {
        const res = await axios.get(`${baseURL}/getBalanceOfVoucher`, {
            params: { userAddress: address },
        });
        setBalanceOfVouchers(res.data || []);
    }

    async function getExpiredVoucher() {
        const res = await axios.get(`${baseURL}/getExpiredVouchers`);
        setExpiredVouchers(res.data || []);
    }

    useEffect(() => {
        checkValidUser();
        checkValidSeller();
        getBalanceOfVoucher();
        getExpiredVoucher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[isValidUser,isValidSeller])

    return (
        <React.Fragment>
            <SiderPanel address={address} 
            isValidUser={isValidUser} 
            sgd={sgd} 
            myr={myr} 
            checkValidSeller={checkValidSeller} 
            isValidSeller={isValidSeller} 
            getFXRate={getFXRate} 
            getBalance={getBalance}
            balanceOfVouchers={balanceOfVouchers}
            expiredVouchers={expiredVouchers}
            getExpiredVoucher={getExpiredVoucher}
            getBalanceOfVoucher={getBalanceOfVoucher}
            />
        </React.Fragment>
    );
};

export default Shopping;