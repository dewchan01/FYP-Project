import React, { useEffect, useState } from "react";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import ECommerceABI from "../ABI/ECommerce.json";
import MCBDCABI from "../ABI/MCBDC.json";
import { polygonMumbai } from "@wagmi/chains";
import { List, Card, Button, Select, Space, Modal, BackTop, Alert } from "antd";
import axios from "axios";
import { DownOutlined } from '@ant-design/icons';
import { tokenConfig, getLabelByKey } from "./tokenConfig";
import apiUrl from "../apiConfig";

function Products({ address, isValidUser, myr, sgd, getBalance, expiredVouchers, getExpiredVoucher }) {
    const [productId, setProductId] = useState("");
    const [allProducts, setAllProducts] = useState([]);
    const [selectedVouchers, setSelectedVouchers] = useState([]);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [allowedVouchers, setAllowedVouchers] = useState([]);
    const [balanceOfVouchers, setBalanceOfVouchers] = useState([]);
    const [product, setProduct] = useState({});
    const [selectedCurrency, setSelectedCurrency] = useState('1');
    const [priceCurrency, setPriceCurrency] = useState('');
    const [rate, setRate] = useState(0);
    const [shouldBuy, setShouldBuy] = useState(false);
    const [shouldRate, setShouldRate] = useState(false);
    const [buyModal, setBuyModal] = useState(false);
    const [isFXRateAvailable, setIsFXRateAvailable] = useState(false);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const items = tokenConfig;
    const baseURL = apiUrl();

    async function getFXRate() {
        const res = await axios.get(`${baseURL}/getFXRate`);
        const response = res.data;
        console.log(response);
        setRate(response.rate);
        setIsFXRateAvailable(response.availableStatus);
    }


    async function showAllProducts() {
        const res = await axios.get(`${baseURL}/allProducts`);
        setAllProducts(res.data || []);
        if (res.data.length === 0) {
            setIsLoadingProducts(false);
        }
    }

    async function getBalanceOfVoucher() {
        const res = await axios.get(`${baseURL}/getBalanceOfVoucher`, {
            params: { userAddress: address },
        });
        setBalanceOfVouchers(res.data || []);
    }


    const handleBuyProduct = async (product) => {
        if (!isValidUser) {
            alert("Please sign up first!");
            return;
        }
        setProductId(product.productId);
        setPriceCurrency(product.priceCurrency);
        console.log("Rate", isSuccessRate)
        if (!isSuccessRate && getLabelByKey(selectedCurrency).slice(1,) !== product.priceCurrency) {
            setShouldRate(true)
        }
        if ((isSuccessRate && getLabelByKey(selectedCurrency).slice(1,) !== product.priceCurrency) || getLabelByKey(selectedCurrency).slice(1,) === product.priceCurrency) {
            setShouldBuy(true);
        }
    }

    const BalanceDropdown = ({ sgd, myr, selectedCurrency, onCurrencyChange }) => {
        const handleChange = (key) => {
            onCurrencyChange(key);
            console.log(selectedCurrency)
        };

        return (
            <Select
                value={selectedCurrency}
                style={{ width: "80vw" }}
                onChange={handleChange}
                suffixIcon={<DownOutlined />}
            >
                {items.map((item) => (
                    <Select.Option key={item.key} value={item.key}>
                        <Space>
                            {item.key === '1' && (
                                <div style={{ lineHeight: '20px' }}>{sgd !== '...' ? Number(sgd).toFixed(2) : sgd} </div>
                            )}
                            {item.key === '2' && (
                                <div style={{ lineHeight: '20px' }}>{myr !== '...' ? Number(myr).toFixed(2) : myr} </div>
                            )}
                            <div>{item.label}</div>
                        </Space>
                    </Select.Option>
                ))}
            </Select>
        );
    };
    const { config: configBuy } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "buyProduct",
        args: [productId, getLabelByKey(selectedCurrency)?.slice(1,), selectedVouchers],
    });

    const { write: writeBuy, data: dataBuy } = useContractWrite(configBuy);
    const { isLoading: isLoadingBuy, isSuccess: isSuccessBuy } = useWaitForTransaction({
        hash: dataBuy?.hash,
    })

    const { config: configRate } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
        abi: MCBDCABI,
        functionName: "requestFxRate",
        args: [getLabelByKey(selectedCurrency).slice(1,), priceCurrency],
    });

    const { write: writeRate, data: dataRate } = useContractWrite(configRate);
    const { isLoading: isLoadingRate, isSuccess: isSuccessRate } = useWaitForTransaction({
        hash: dataRate?.hash,
    })

    const showBuyModal = async (product) => {
        setBuyModal(true);
        setProduct(product);

        if (availableVouchers.length === 0) {
            setAllowedVouchers([]);
            return;
        }
        const allowedVouchers = [];
        for (let i = 0; i < availableVouchers.length; i++) {
            try {
                const res = await axios.get(`${baseURL}/getVoucherInfo`, {
                    params: { voucherId: String(availableVouchers[i].index) },
                });

                const voucherInfo = res.data;
                if (
                    voucherInfo.suitableProductIds.includes(product.productId) &&
                    voucherInfo.valueCurrency === product.priceCurrency &&
                    product.priceCurrency === getLabelByKey(selectedCurrency).slice(1,) &&
                    voucherInfo.minSpend <= product.price
                ) {
                    allowedVouchers.push(res.data.voucherId);
                }
            } catch (error) {
                console.error("Error fetching voucher info:", error);
            }
        }
        setAllowedVouchers(allowedVouchers);
    };


    const hideBuyModal = () => {
        setBuyModal(false);
        setAllowedVouchers([]);
        setShouldBuy(false);
        setShouldRate(false);
    }

    const handleAvailableVouchers = () => {
        setAvailableVouchers(expiredVouchers
            ?.map((expired, index) => ({ expired, balance: Number(balanceOfVouchers[index]), index }))
            ?.filter(({ expired, balance }) => !expired && balance > 0));
    }

    useEffect(() => {
        showAllProducts();
        getBalanceOfVoucher();
        handleAvailableVouchers();

        if (shouldRate && !isSuccessRate && productId !== "" && !isSuccessBuy && getLabelByKey(selectedCurrency).slice(1,) !== priceCurrency) {
            console.log("TRIGGER")
            writeRate?.();
            setShouldRate(false);
        }
        if (isSuccessRate) {
            getFXRate();
        }

        console.log("Allow", allowedVouchers)
        console.log(shouldBuy, productId, getLabelByKey(selectedCurrency)?.slice(1,), selectedVouchers)
        if ((shouldBuy && productId !== "" && !isSuccessBuy && getLabelByKey(selectedCurrency).slice(1,) === priceCurrency)
            || (shouldBuy && isFXRateAvailable && isSuccessRate && !isSuccessBuy && getLabelByKey(selectedCurrency).slice(1,) !== priceCurrency)) {
            console.log("TRRY")
            writeBuy?.();
        }

        if (isSuccessBuy) {
            hideBuyModal();
            setShouldBuy(false);
            setSelectedVouchers([]);
            getBalanceOfVoucher();
            getExpiredVoucher();
            getBalance();
            alert("Purchase Successfully!");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuccessBuy, shouldBuy, product, priceCurrency, isSuccessRate, isFXRateAvailable, selectedCurrency, selectedVouchers, buyModal, allowedVouchers]);

    return (
        <>
            <div style={{ margin: "20px 0 0 20px" }}>
                <p>Select your payment currency:</p>
                <div>
                    <BalanceDropdown
                        sgd={sgd}
                        myr={myr}
                        selectedCurrency={selectedCurrency}
                        onCurrencyChange={setSelectedCurrency}
                    />
                </div>
                <List
                    style={{ margin: "20px 0 0 0", width: 1000 }}
                    grid={{ gutter: 16, column: 4 }}
                    dataSource={allProducts}
                    loading={allProducts.length === 0 && isLoadingProducts}
                    renderItem={(product) => (
                        <List.Item>
                            <Card
                                title={product.name}
                                style={{ width: 200, textAlign: "center" }}
                            >
                                <p style={{ fontWeight: "bold" }}>{product.productName}</p>
                                <p>Price: {product.price / 1e18} D{product.priceCurrency}</p>
                                <hr></hr>
                                <Button type="primary" onClick={() => { showBuyModal(product) }}>Buy</Button>

                            </Card>
                        </List.Item>
                    )} />
            </div>
            <Modal
                title="Product Details"
                open={buyModal}
                onCancel={hideBuyModal}
                confirmLoading={isLoadingBuy || isLoadingRate}
                okText={(!isSuccessBuy && getLabelByKey(selectedCurrency).slice(1,) === product?.priceCurrency) || (isSuccessRate && isFXRateAvailable && getLabelByKey(selectedCurrency).slice(1,) !== product?.priceCurrency) ? "Buy" : "Request FX Rate"}
                cancelText="Cancel"
                onOk={() => {
                    console.log("Product: ", product)
                    handleBuyProduct(product);
                }}
                cancelButtonProps={{ disabled: (isLoadingBuy || isLoadingRate || isSuccessRate) }}
                closable={false}
            >
                <Alert showIcon message="There could be a issue when the allowance of platform owner is insufficient for using voucher." type="warning"></Alert>
                <p style={{ fontSize: "smaller" }}>Product ID: {product?.productId} /
                    Category: {product?.category}</p>
                <p style={{ fontWeight: "bold", textAlign: "center", fontSize: "large" }}>{product?.productName}</p>
                <p style={{ fontStyle: "italic" }}>{product?.description}</p>
                <p>Seller: {product?.seller}</p>
                <p style={{ fontSize: "larger", fontWeight: "", textAlign: "center", border: "1px solid black", borderRadius: "5px" }}>{product?.price / 1e18} D{product?.priceCurrency}
                    {isSuccessRate && isFXRateAvailable ? <p>Converted Price: {product?.price / rate} {getLabelByKey(selectedCurrency)}</p> : null}
                </p>
                <p>Vouchers:&nbsp;
                    <Space
                        style={{
                            width: '40%',
                        }}
                        direction="vertical"
                    >
                        <Select
                            mode="multiple"
                            allowClear
                            style={{
                                width: '100%',
                            }}
                            placeholder={allowedVouchers.length === 0 ? "No vouchers available" : "Please select vouchers"}
                            required={true}
                            options={allowedVouchers.filter((o) => !selectedVouchers.includes(o)).map(voucher => ({ label: voucher, value: voucher }))}
                            loading={allowedVouchers.length === 0}
                            disabled={allowedVouchers.length === 0}
                            onDeselect={(value) => setSelectedVouchers((prevIds) => prevIds.filter((id) => id !== value))}
                            onSelect={(value) => setSelectedVouchers((prevIds) => [...prevIds, value])}
                            onFocus={() => showBuyModal(product)}
                        />
                    </Space>
                </p>
            </Modal >
            <div>
                <BackTop />
            </div>
        </>
    )
}

export default Products;