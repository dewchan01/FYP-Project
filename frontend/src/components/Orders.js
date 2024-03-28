import axios from "axios";
import React, { useState, useEffect } from "react";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { sepolia } from "@wagmi/chains";
import ECommerceABI from "../ABI/ECommerce.json";
import { Button, Space, Table } from 'antd';
import apiUrl from "../apiConfig";

function Orders({ address }) {
    const baseURL = apiUrl();
    const [myOrders, setMyOrders] = useState([]);
    const [productId, setProductId] = useState("");
    const [purchaseId, setPurchaseId] = useState("");
    const [isLoadingOrders, setIsLoadingOrders] = useState(true);

    const { config: configCancelOrder } = usePrepareContractWrite({
        chainId: sepolia.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "cancelOrder",
        args: [productId, purchaseId],
    });

    const { write: writeCancelOrder, data: dataCancelOrder } = useContractWrite(configCancelOrder);
    const { isLoading: isLoadingCancelOrder, isSuccess: isSuccessCancelOrder } = useWaitForTransaction({
        hash: dataCancelOrder?.hash,
    })

    const handleCancelOrder = (productId, purchaseId) => {
        setProductId(productId);
        setPurchaseId(purchaseId);
    }

    async function showMyOrders() {
        const res = await axios.get(`${baseURL}/myOrders`, {
            params: { userAddress: address },
        })
        setMyOrders(res.data || []);
        console.log(res.data);
        if (res.data.length === 0) {
            setIsLoadingOrders(false);
        }
    }

    const columns = [
        {
            title: 'Product Id',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: 'Order Status',
            dataIndex: 'orderStatus',
            key: 'orderStatus',
        },
        {
            title: 'Purchase Id',
            dataIndex: 'purchaseId',
            key: 'purchaseId',
        },
        {
            title: 'Shipment Status',
            key: 'shipmentStatus',
            dataIndex: 'shipmentStatus',
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" disabled={record.shipmentStatus === "Order Canceled By Buyer, Payment Refunded" ||record.shipmentStatus === "Order Canceled By Buyer, Payment will Be Refunded" || record.shipmentStatus === "Delivered"} loading={isLoadingCancelOrder} danger={true} onClick={() => handleCancelOrder(record.productId, record.purchaseId)}>Cancel</Button>
                </Space>
            ),
        },
    ];

    useEffect(() => {
        if (!isSuccessCancelOrder) {
            console.log(productId, purchaseId, isSuccessCancelOrder)
            writeCancelOrder?.();
        }
        showMyOrders();

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, purchaseId, isSuccessCancelOrder])

    return (
        <div style={{ width: '150%' }} >
            <Table columns={columns}
                dataSource={myOrders}
                pagination={{ position: ["bottomCenter"], pageSize: 9 }}
                loading={isLoadingOrders && myOrders.length === 0}
            />
        </div>
    )
}

export default Orders;