import React, { useState, useEffect } from "react";
import axios from 'axios';
import SiderPanel from "./SiderPanel";

function Shopping({address,sgd,myr,getFXRate,getBalance}) {
    console.log("Address",address)
    const [isValidUser, setIsValidUser] = useState(false);
    const [isValidSeller, setIsValidSeller] = useState(false);
    const [balanceOfVouchers, setBalanceOfVouchers] = useState([]);
    const [expiredVouchers, setExpiredVouchers] = useState([]);

    async function checkValidUser() {
        const res = await axios.get(`http://localhost:3001/isValidUser`, {
            params: { userAddress: address },
        });

        const response = res.data;
        // console.log(response);
        setIsValidUser(response);

    }
    async function checkValidSeller() {
        const res = await axios.get(`http://localhost:3001/isValidSeller`, {
            params: { userAddress: address },
        });

        const response = res.data;
        // console.log(response);
        setIsValidSeller(response);

    }

    // getMyVoucher & getExpiredVoucher
    async function getBalanceOfVoucher() {
        const res = await axios.get("http://localhost:3001/getBalanceOfVoucher", {
            params: { userAddress: address },
        });
        setBalanceOfVouchers(res.data || []);
    }

    async function getExpiredVoucher() {
        const res = await axios.get("http://localhost:3001/getExpiredVouchers");
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
            
            {/* <Layout className="site-layout">
                <Routes>
                    <Route
                        path="/shopping"
                        element={<Products />}
                    />
                    <Route path="/shopping" element={<Orders />} />
                    <Route path="/shopping/seller" element={<Seller />} />
                    <Route path="/shopping/signup" element={<UserSignUp />} />
                </Routes>
            </Layout> */}
        </React.Fragment>
    );
};

export default Shopping;