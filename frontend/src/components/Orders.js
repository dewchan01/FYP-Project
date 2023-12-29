import axios from "axios";
import React, { useState, useEffect } from "react";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { polygonMumbai } from "@wagmi/chains";
import ECommerceABI from "../ABI/ECommerce.json";
import { Button, Space, Table } from 'antd';

function Orders({ address }) {
    const [myOrders, setMyOrders] = useState([]);
    const [productId, setProductId] = useState("");
    const [purchaseId, setPurchaseId] = useState("");

    const { config: configCancelOrder } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
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
        const res = await axios.get("http://localhost:3001/myOrders", {
            params: { userAddress: address },
        })
        setMyOrders(res.data || []);
        console.log(res.data);
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
                    {record.shipmentStatus !== "Order Canceled By Buyer, Payment will Be Refunded" && record.shipmentStatus !== "Delivered" ?
                    <Button type="primary" loading={isLoadingCancelOrder} danger={true} onClick={() => handleCancelOrder(record.productId, record.purchaseId)}>Cancel</Button>
                    : null}
                </Space>
            ),
        },
    ];

    useEffect(() => {
        if (!isSuccessCancelOrder) {
            writeCancelOrder?.();
        }
        showMyOrders();

    }, [productId, purchaseId, isSuccessCancelOrder])

    return (
        <div style={{ width: '84.9vw' }} >

            <Table columns={columns}
                dataSource={myOrders}
                pagination={{ position: ["bottomCenter"], pageSize: 4 }}
            />
        </div>
    )
}

export default Orders;