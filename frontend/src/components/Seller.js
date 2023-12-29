import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import ECommerceABI from "../ABI/ECommerce.json";
import { polygonMumbai } from "@wagmi/chains";
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Modal, Table, InputNumber, Divider } from "antd";
import axios from "axios";
import { Space } from 'antd';

function Seller({ isValidSeller, address }) {
    const [productId, setProductId] = useState("");
    const [purchaseId, setPurchaseId] = useState("");
    const [shipmentDetails, setShipmentDetails] = useState("");
    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("");
    const [priceCurrency, setPriceCurrency] = useState("");
    const [price, setPrice] = useState(0);
    const [description, setDescription] = useState("");
    const [ordersPlaced, setOrdersPlaced] = useState([]);
    const [sellerName, setSellerName] = useState("");
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
    const [allProducts, setAllProducts] = useState([]);

    const handleOpenAddModal = () => {
        setIsAddModalVisible(true);
    };

    const handleCloseAddModal = () => {
        setIsAddModalVisible(false);
    };

    const handleOpenDeleteModal = () => {
        setIsDeleteModalVisible(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalVisible(false);
    };

    const handleOpenUpdateModal = () => {
        setIsUpdateModalVisible(true);
    };

    const handleCloseUpdateModal = () => {
        setIsUpdateModalVisible(false);
    };

    const handleAddProduct = (
        productId,
        productName,
        category,
        price,
        priceCurrency,
        description) => {
        setProductId(productId);
        setProductName(productName);
        setCategory(category);
        setPrice(price);
        setPriceCurrency(priceCurrency);
        setDescription(description);
    }

    const AddProductModal = ({ visible, onClose, onAddProduct }) => {
        const [productId, setProductId] = useState('');
        const [productName, setProductName] = useState('');
        const [category, setCategory] = useState('');
        const [price, setPrice] = useState('');
        const [priceCurrency, setPriceCurrency] = useState('');
        const [description, setDescription] = useState('');

        const handleAddProduct = () => {
            // Perform any validation or additional logic here if needed
            onAddProduct(
                productId,
                productName,
                category,
                price,
                priceCurrency,
                description,
            );
            onClose(); // Close the modal after adding the product
        };

        return (
            <Modal
                title="Add Product"
                visible={visible}
                onCancel={onClose}
                footer={[
                    <Button key="cancel" onClick={onClose}>
                        Cancel
                    </Button>,
                    <Button isLoading={isLoadingAddProduct} key="add" type="primary" onClick={handleAddProduct}>
                        Add Product
                    </Button>,
                ]}
            >
                <Form layout="vertical">
                    <Form.Item label="Product ID">
                        <Input
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Product Name">
                        <Input
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Category">
                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Price">
                        <InputNumber
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Price Currency">
                        <Input
                            value={priceCurrency}
                            onChange={(e) => setPriceCurrency(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Description">
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        );
    };
    const handleDeleteProduct = (productId) => {
        setProductId(productId);
    }

    const DeleteProductModal = ({ visible, onClose, onDeleteProduct }) => {
        const [productId, setProductId] = useState('');

        const handleDeleteProduct = () => {
            // Perform any validation or additional logic here if needed
            onDeleteProduct(productId);
            onClose(); // Close the modal after adding the product
        };

        return (
            <Modal
                title="Delete Product"
                visible={visible}
                onCancel={onClose}
                footer={[
                    <Button key="cancel" onClick={onClose}>
                        Cancel
                    </Button>,
                    <Button loading={isLoadingDeleteProduct} key="add" type="primary" onClick={handleDeleteProduct}>
                        Delete Product
                    </Button>,
                ]}
            >
                <Form layout="vertical">
                    <Form.Item label="Product ID">
                        <Input
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                        />
                    </Form.Item>

                </Form>
            </Modal>
        );
    };
    const handleUpdateShipment = (purchaseId, shipmentDetails) => {
        setPurchaseId(purchaseId);
        setShipmentDetails(shipmentDetails);
    }
    const UpdateShipmentModal = ({ visible, onClose, onUpdateShipment }) => {
        const [shipmentDetails, setShipmentDetails] = useState('');
        const [purchaseId, setPurchaseId] = useState('');

        const handleUpdateProduct = () => {
            // Perform any validation or additional logic here if needed
            onUpdateShipment(purchaseId, shipmentDetails);
            onClose(); // Close the modal after adding the product
        };

        return (
            <Modal
                title="Update Shipment"
                visible={visible}
                onCancel={onClose}
                footer={[
                    <Button key="cancel" onClick={onClose}>
                        Cancel
                    </Button>,
                    <Button loading={isLoadingUpdateShipment} key="add" type="primary" onClick={handleUpdateProduct}>
                        Update Shipment
                    </Button>,
                ]}
            >
                <Form layout="vertical">
                    <Form.Item label="Purchase ID">
                        <Input
                            value={purchaseId}
                            onChange={(e) => setPurchaseId(e.target.value)}
                        />
                    </Form.Item>
                    <Form.Item label="Shipment Details">
                        <Input
                            value={shipmentDetails}
                            onChange={(e) => setShipmentDetails(e.target.value)}
                        />
                    </Form.Item>

                </Form>
            </Modal>
        );
    };


    const handleSellerSignUp = () => {
        setSellerName(sellerName);
    }
    const { config: configSellerSignUp } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "sellerSignUp",
        args: [sellerName],
    });

    const { write: writeSellerSignUp, data: dataSellerSignUp } = useContractWrite(configSellerSignUp);
    const { isLoading: isLoadingSellerSignUp, isSuccess: isSuccessSellerSignUp } = useWaitForTransaction({
        hash: dataSellerSignUp?.hash,
    })

    const { config: configAddProduct } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "addProduct",
        args: [productId, productName, category, priceCurrency, price, description],
    })

    const { write: writeAddProduct, data: dataAddProduct } = useContractWrite(configAddProduct);
    const { isLoading: isLoadingAddProduct, isSuccess: isSuccessAddProduct } = useWaitForTransaction({
        hash: dataAddProduct?.hash,
    })

    const { config: configDeleteProduct } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "deleteProduct",
        args: [productId],
    })

    const { write: writeDeleteProduct, data: dataDeleteProduct } = useContractWrite(configDeleteProduct);
    const { isLoading: isLoadingDeleteProduct, isSuccess: isSuccessDeleteProduct } = useWaitForTransaction({
        hash: dataDeleteProduct?.hash,
    })

    const { config: configUpdateShipment } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "updateShipment",
        args: [purchaseId, shipmentDetails],
    })

    const { write: writeUpdateShipment, data: dataUpdateShipment } = useContractWrite(configUpdateShipment);
    const { isLoading: isLoadingUpdateShipment, isSuccess: isSuccessUpdateShipment } = useWaitForTransaction({
        hash: dataUpdateShipment?.hash,
    })


    async function getOrdersPlaced() {
        const res = await axios.get(`http://localhost:3001/ordersPlaced`, {
            params: { userAddress: address },
        });
        setOrdersPlaced(res.data || []);
    }

    async function showAllProducts() {
        const res = await axios.get("http://localhost:3001/allProducts");
        const filteredProducts = res.data.filter(product => product.seller === address);
        console.log(filteredProducts);
        setAllProducts(filteredProducts || []);
        // console.log(res.data);
    }

    const columns = [
        {
            title: 'Product Id',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: 'Purchase Id',
            dataIndex: 'purchaseId',
            key: 'purchaseId',
        },
        {
            title: 'Order By',
            dataIndex: 'orderedBy',
            key: 'orderedBy',
        },
        {
            title: 'Shipment Status',
            key: 'shipmentStatus',
            dataIndex: 'shipmentStatus',
        },
        {
            title: 'Delivery Address',
            key: 'deliveryAddress',
            dataIndex: 'deliveryAddress',
        },
        {
            title: 'Pay By Currency',
            key: 'payByCurrency',
            dataIndex: 'payByCurrency',
        },
        {
            title: 'Status',
            key: 'isCanceled',
            dataIndex: 'isCanceled',
            render: (_, record) => (
                <Space size="middle">
                    {record.isCanceled ? "Cancelled" : "Pending"}
                </Space>
            )
        }
    ];

    const myProductsColumn = [
        {
            title: 'Product Id',
            dataIndex: 'productId',
            key: 'productId',
        },
        {
            title: 'Product Name',
            dataIndex: 'productName',
            key: 'productName',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
        },
        {
            title: 'Price',
            key: 'price',
            dataIndex: 'price',
        },
        {
            title: 'Price Currency',
            key: 'priceCurrency',
            dataIndex: 'priceCurrency',
        },
        {
            title: 'Description',
            key: 'description',
            dataIndex: 'description',
        },
        {
            title: 'Available',
            key: 'isActive',
            dataIndex: 'isActive',
            render: (_, record) => (
                <Space size="middle">
                    {record.isActive ? "Yes" : "No"}
                </Space>
            )
        }
    ]


    useEffect(() => {
        showAllProducts();
        getOrdersPlaced();
        if (!isSuccessAddProduct && productId.length > 0) {
            writeAddProduct?.();
        }
        if (!isSuccessDeleteProduct && productId.length > 0) {
            writeDeleteProduct?.();
        }
        if (!isSuccessSellerSignUp && sellerName.length > 0) {
            writeSellerSignUp?.();
        }
        if (!isSuccessUpdateShipment && purchaseId.length > 0) {
            writeUpdateShipment?.();
        }
        getOrdersPlaced();
    }, [isSuccessAddProduct, isSuccessDeleteProduct, isSuccessSellerSignUp, isSuccessUpdateShipment, productId, sellerName, purchaseId])

    return (
        isValidSeller ?
            <>
                &nbsp;

                <Button type="primary" onClick={handleOpenUpdateModal}>
                    Update Shipment
                </Button>
                <UpdateShipmentModal
                    visible={isUpdateModalVisible}
                    onClose={handleCloseUpdateModal}
                    onUpdateShipment={handleUpdateShipment}
                />


                <div style={{ width: '84.9vw' }} >
                    <Divider>Orders Placed</Divider>
                    <Table columns={columns}
                        dataSource={ordersPlaced}
                        pagination={{ position: ["bottomCenter"], pageSize: 3 }}
                    />
                </div>
                &nbsp;
                <Button type="primary" onClick={handleOpenAddModal}>
                    Add Product
                </Button>
                <AddProductModal
                    visible={isAddModalVisible}
                    onClose={handleCloseAddModal}
                    onAddProduct={handleAddProduct}
                />&nbsp;
                <Button type="primary" onClick={handleOpenDeleteModal} danger={true}>
                    Delete Product
                </Button>
                <DeleteProductModal
                    visible={isDeleteModalVisible}
                    onClose={handleCloseDeleteModal}
                    onDeleteProduct={handleDeleteProduct}
                />
                <div style={{ width: '84.9vw' }} >
                    <Divider>My Products</Divider>
                    <Table columns={myProductsColumn}
                        dataSource={allProducts}
                        pagination={{ position: ["bottomCenter"], pageSize: 3 }}
                    />
                </div>
            </>

            :
            <div style={{ margin: "2% 0 0 5%", minWidth: "60vw" }}>
                <Form>
                    <p>You are not a seller! Please sign up as a seller.</p>
                    <Form layout="vertical">
                        <Form.Item label="Seller Name">
                            <Input
                                value={sellerName}
                                onChange={(e) => setSellerName(e.target.value)}
                            />
                        </Form.Item>
                        <br></br>
                        <Button type="primary" onClick={handleSellerSignUp} loading={isLoadingSellerSignUp}>Sign Up</Button>
                    </Form>
                </Form>
            </div>
    )
}

export default Seller;
