    import React, { useEffect, useState } from "react";
    import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
    import ECommerceABI from "../ABI/ECommerce.json";
    import MCBDCABI from "../ABI/MCBDC.json";
    import { polygonMumbai } from "@wagmi/chains";
    import { List, Card, Button, Select, Space, Modal,BackTop } from "antd";
    import axios from "axios";
    import { DownOutlined } from '@ant-design/icons';
    import { tokenConfig, getLabelByKey } from "./tokenConfig";

    function Products({ isValidUser, myr, sgd, getBalance, balanceOfVouchers, expiredVouchers, getExpiredVoucher, getBalanceOfVoucher }) {
        const [productId, setProductId] = useState("");
        const [allProducts, setAllProducts] = useState([]);
        const [selectedVouchers, setSelectedVouchers] = useState([]);
        const [availableVouchers, setAvailableVouchers] = useState([]);
        const [allowedVouchers, setAllowedVouchers] = useState([]);
        const [product, setProduct] = useState({});
        const [selectedCurrency, setSelectedCurrency] = useState('1');
        const [priceCurrency, setPriceCurrency] = useState('');
        const [rate, setRate] = useState(0);
        const [shouldBuy, setShouldBuy] = useState(false);
        const [buyModal, setBuyModal] = useState(false);
        const [isFXRateAvailable, setIsFXRateAvailable] = useState(false);
        const items = tokenConfig;

        // console.log(myr, sgd)
        async function getFXRate() {
            const res = await axios.get(`http://localhost:3001/getFXRate`);
            const response = res.data;
            console.log(response);
            setRate(response.rate);
            setIsFXRateAvailable(response.availableStatus);
        }


        async function showAllProducts() {
            const res = await axios.get("http://localhost:3001/allProducts");
            setAllProducts(res.data || []);
            // console.log(res.data);
        }

        const handleBuyProduct = async (product) => {
            if (!isValidUser) {
                alert("Please login first!");
                return;
            }
            setProductId(product.productId);
            setPriceCurrency(product.priceCurrency);
            console.log("Rate", isSuccessRate)
            if (isSuccessRate && getLabelByKey(selectedCurrency).slice(1,) !== product.priceCurrency) {
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
            args: [productId, getLabelByKey(selectedCurrency)?.slice(1,), selectedVouchers], // hard code voucher code first
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
            // console.log("AVA", availableVouchers);
        
            if (availableVouchers.length === 0) {
                setAllowedVouchers([]);
                return;
            }
        
            for (let i = 0; i < availableVouchers.length; i++) {
                try {
                    const res = await axios.get("http://localhost:3001/getVoucherInfo", {
                        params: { voucherId: String(availableVouchers[i].index) },
                    });
                    // console.log("RES", res.data, product,selectedCurrency);
        
                    const voucherInfo = res.data;
                    if (
                        voucherInfo.suitableProductIds.includes(product.productId) &&
                        voucherInfo.valueCurrency === product.priceCurrency &&
                        product.priceCurrency === getLabelByKey(selectedCurrency).slice(1,) &&
                        voucherInfo.minSpend <= product.price
                    ) {
                        // lack checking balance
                        setAllowedVouchers((prevIds) => [...prevIds, res.data.voucherId]);
                    }
                } catch (error) {
                    console.error("Error fetching voucher info:", error);
                }
            }
        };
        

        const hideBuyModal = () => {
            setBuyModal(false);
            setAllowedVouchers([]);
        }

        useEffect(() => {
            setAvailableVouchers(expiredVouchers
                ?.map((expired, index) => ({ expired, balance: Number(balanceOfVouchers[index]), index }))
                ?.filter(({ expired, balance }) => !expired && balance > 0));
            if (allProducts.length === 0) {
                showAllProducts();
            }
            // console.log(isFXRateAvailable,productId, getLabelByKey(selectedCurrency).slice(1,), priceCurrency, isSuccessBuy, isSuccessRate)
            if (!isSuccessRate && productId !== "" && !isSuccessBuy && getLabelByKey(selectedCurrency).slice(1,) !== priceCurrency) {
                writeRate?.();
            }
            if (isSuccessRate) {
                getFXRate();
            }
            
            console.log("Allow",allowedVouchers)
            
            if ((productId !== "" && !isSuccessBuy && getLabelByKey(selectedCurrency).slice(1,) === priceCurrency)
                || (shouldBuy && isFXRateAvailable && isSuccessRate && !isSuccessBuy && getLabelByKey(selectedCurrency).slice(1,) !== priceCurrency)) {
                writeBuy?.();
            }

            if (isSuccessBuy) {
                hideBuyModal();
                setShouldBuy(false);
                getBalanceOfVoucher();
                getExpiredVoucher();
                getBalance();
                alert("Purchase Successfully!");
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isSuccessBuy, shouldBuy, product, priceCurrency, isSuccessRate, isFXRateAvailable, selectedCurrency, selectedVouchers,buyModal]);

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
                    {allProducts.length === 0 && <p>Loading products...</p>}
                    <List
                        style={{ margin: "20px 0 0 0", width: 1000 }}
                        grid={{ gutter: 16, column: 4 }}
                        dataSource={allProducts}
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
                >
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
                                placeholder="Please select vouchers"
                                required={true}
                                onChange={(selectedValues) => setSelectedVouchers((prevIds) => [...prevIds, ...selectedValues])}
                                options={allowedVouchers.map(voucher => ({ label: voucher, value: voucher }))}
                            />
                        </Space>
                    </p>
                </Modal>
                <div>
                <BackTop />
            </div>
            </>
        )
    }

    export default Products;