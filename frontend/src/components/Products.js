import React, { useEffect, useState } from "react";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import ECommerceABI from "../ABI/ECommerce.json";
import { polygonMumbai } from "@wagmi/chains";
import { List, Card, Button, Select, Space } from "antd";
import axios from "axios";
import { DownOutlined } from '@ant-design/icons';
import { tokenConfig, getLabelByKey } from "./tokenConfig";

function Products({ isValidUser, myr, sgd }) {
    const [productId, setProductId] = useState("");
    const [allProducts, setAllProducts] = useState([]);
    const [selectedCurrency, setSelectedCurrency] = useState('1');
    const items = tokenConfig;

    console.log(myr, sgd)
    async function showAllProducts() {
        const res = await axios.get("http://localhost:3001/allProducts");
        setAllProducts(res.data || []);
        console.log(res.data);
    }
    const handleBuyProduct = async (productId) => {
        if (!isValidUser) {
            alert("Please login first!");
            return;
        }
        setProductId(productId);
    }

    const BalanceDropdown = ({ sgd, myr, selectedCurrency, onCurrencyChange }) => {
        const handleChange = (key) => {
            onCurrencyChange(key);
            console.log(selectedCurrency)
        };

        return (
            <Select
                value={selectedCurrency}
                style={{ width: 1200 }}
                onChange={handleChange}
                suffixIcon={<DownOutlined />} // Use the imported icon here
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
        args: [productId, getLabelByKey(selectedCurrency)?.slice(1,)],
    });

    const { write: writeBuy, data: dataBuy } = useContractWrite(configBuy);
    const { isLoading: isLoadingBuy, isSuccess: isSuccessBuy } = useWaitForTransaction({
        hash: dataBuy?.hash,
    })

    useEffect(() => {
        showAllProducts();
        if (productId !== "" && !isSuccessBuy) {
            writeBuy?.();
        }
        if (isSuccessBuy) {
        alert("Purchase Successfully!");
        }
    }, [isSuccessBuy, productId]);

    return (
        <>
        <div style={{margin:"20px 0 0 20px"}}>
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
                grid={{ gutter: 250, column: 6 }}
                dataSource={allProducts}
                renderItem={(product) => (
                    <List.Item>
                        <Card
                            title={product.name}
                            style={{ width: 200, textAlign: "center" }}
                        >
                            <p>{product.description}</p>
                            <p>Price: {product.price / 1e18} D{product.priceCurrency}</p>
                            <Button type="primary" loading={isLoadingBuy} onClick={() => handleBuyProduct(product.productId)}>Buy</Button>
                        </Card>
                    </List.Item>
                )} />
                </div>
        </>
    )
}

export default Products;