import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import ECommerceABI from "../ABI/ECommerce.json";
import { polygonMumbai } from "@wagmi/chains";
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Modal, Table, InputNumber, Divider, Select, Alert } from "antd";
import axios from "axios";
import { Space } from 'antd';
import apiUrl from "../apiConfig";

const DeleteProductModal = ({ deleteModal, hideDeleteModal, isLoadingDeleteProduct, productId, writeDeleteProduct, setProductId, deleteProductForm, buttonDisabled, setButtonDisabled }) => {
    return (
        <Modal
            title="Delete Product"
            open={deleteModal}
            onCancel={hideDeleteModal}
            okText="Delete Product"
            cancelText="Cancel"
            confirmLoading={isLoadingDeleteProduct}
            onOk={() => {
                if (productId.length > 0) {
                    writeDeleteProduct?.();
                }
            }}
            okButtonProps={{ disabled: buttonDisabled }}
            cancelButtonProps={{ disabled: isLoadingDeleteProduct }}
            closable={false}
        >
            <Form name="Delete Product" layout="vertical" form={deleteProductForm}
                onFieldsChange={() =>
                    setButtonDisabled(
                        deleteProductForm.getFieldsError().some((field) => field.errors.length > 0)
                    )
                }>
                <Form.Item name="productId" label="Product ID"
                    rules={[{
                        required: true,
                        message: 'Please input Product ID!',
                    }]}>
                    <Input
                        placeholder="SCSG1"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                    />
                </Form.Item>

            </Form>
        </Modal>
    );
};

function Seller({ isValidSeller, address, checkValidSeller }) {
    const baseURL = apiUrl();
    const { Option } = Select;
    const [addProductForm] = Form.useForm();
    const [updateShipmentForm] = Form.useForm();
    const [deleteProductForm] = Form.useForm();
    const [refundForm] = Form.useForm();
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
    const [addModal, setAddModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [updateModal, setUpdateModal] = useState(false);
    const [refundModal, setRefundModal] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [isLoadingAllProduct, setIsLoadingAllProduct] = useState(true);
    const [isLoadingOrdersPlaced, setIsLoadingOrdersPlaced] = useState(true);

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
        args: [productId, productName, category, priceCurrency.slice(1,), String(Number(price * 1e18)), description],
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

    const { config: configRefund } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "refund",
        args: [productId, purchaseId],
    })

    const { write: writeRefund, data: dataRefund } = useContractWrite(configRefund);
    const { isLoading: isLoadingRefund, isSuccess: isSuccessRefund } = useWaitForTransaction({
        hash: dataRefund?.hash,
    })

    async function getOrdersPlaced() {
        const res = await axios.get(`${baseURL}/ordersPlaced`, {
            params: { userAddress: address },
        });
        setOrdersPlaced(res.data || []);
        if (res.data.length === 0) {
            setIsLoadingOrdersPlaced(false);
        }
    }

    async function showAllProducts() {
        const res = await axios.get(`${baseURL}/allProducts`);
        const filteredProducts = res.data.filter(product => product.seller === address);
        setAllProducts(filteredProducts || []);
        // console.log(res.data);
        if (filteredProducts.length === 0) {
            setIsLoadingAllProduct(false);
        }
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
            render: (_, record) => (
                <>
                    D{record.payByCurrency}
                </>

            )
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
            render: (_, record) => (
                <Space size="middle">
                    {record.price / 1e18}
                </Space>
            )
        },
        {
            title: 'Price Currency',
            key: 'priceCurrency',
            dataIndex: 'priceCurrency',
            render: (_, record) => (
                <>
                    D{record.priceCurrency}
                </>
            )
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

    const showAddModal = () => {
        setAddModal(true);
    };

    const hideAddModal = () => {
        setAddModal(false);
    };

    const showDeleteModal = () => {
        setDeleteModal(true);
    };

    const hideDeleteModal = () => {
        setDeleteModal(false);
    };

    const showUpdateModal = () => {
        setUpdateModal(true);
    };

    const hideUpdateModal = () => {
        setUpdateModal(false);
    };

    const showRefundModal = () => {
        setRefundModal(true);
    }

    const hideRefundModal = () => {
        setRefundModal(false);
    }

    useEffect(() => {
        if (ordersPlaced.length === 0 && allProducts.length === 0) {
            getOrdersPlaced();
            showAllProducts();
            checkValidSeller();
        }
        console.log(isSuccessUpdateShipment)
        if (isSuccessDeleteProduct || isSuccessSellerSignUp || isSuccessUpdateShipment || isSuccessAddProduct || isSuccessRefund) {
            deleteProductForm.resetFields();
            updateShipmentForm.resetFields();
            addProductForm.resetFields();
            refundForm.resetFields();
            hideAddModal();
            hideDeleteModal();
            hideUpdateModal();
            hideRefundModal();
            checkValidSeller();
            getOrdersPlaced();
            showAllProducts();
            setSellerName("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deleteProductForm, updateShipmentForm, addProductForm, refundForm, isSuccessAddProduct, isSuccessSellerSignUp, isSuccessRefund, isSuccessDeleteProduct, isSuccessUpdateShipment]);

    return (
        isValidSeller ?
            <>
                &nbsp;
                <Button type="primary" onClick={showUpdateModal}>
                    Update Shipment
                </Button>
                <Modal
                    title="Update Shipment"
                    open={updateModal}
                    onCancel={hideUpdateModal}
                    okText="Update Shipment"
                    cancelText="Cancel"
                    confirmLoading={isLoadingUpdateShipment}
                    onOk={() => {
                        if (!(purchaseId.length > 0) || !(shipmentDetails.length > 0)) {
                            alert("Please enter all the fields!");
                            return;
                        }
                        writeUpdateShipment?.();
                    }}
                    okButtonProps={{ disabled: buttonDisabled }}
                    cancelButtonProps={{ disabled: isLoadingUpdateShipment }}
                    closable={false}

                >
                    <Form name="Update Shipment" layout="vertical"
                        form={updateShipmentForm}
                        onFieldsChange={() =>
                            setButtonDisabled(
                                updateShipmentForm.getFieldsError().some((field) => field.errors.length > 0)
                            )
                        }>
                        <Form.Item name="purchaseId" label="Purchase ID"
                            rules={[{
                                required: true,
                                message: "Please enter purchase id!",
                            }]}>
                            <Input
                                placeholder="0"
                                value={purchaseId}
                                onChange={(e) => setPurchaseId(e.target.value)}
                            />
                        </Form.Item>
                        <Form.Item name="shipmentDetails" label="Shipment Details"
                            rules={[{
                                required: true,
                                message: "Please enter shipment details!",
                            }]}>
                            <Input
                                placeholder="Shipping"
                                value={shipmentDetails}
                                onChange={(e) => setShipmentDetails(e.target.value)}
                            />
                        </Form.Item>

                    </Form>
                </Modal>

                &nbsp;
                <Button type="primary" onClick={showRefundModal} danger={true}>
                    Refund
                </Button>
                <Modal
                    title="Refund"
                    open={refundModal}
                    onCancel={hideRefundModal}
                    okText="Refund"
                    cancelText="Cancel"
                    confirmLoading={isLoadingRefund}
                    onOk={() => {
                        if (!(purchaseId.length > 0) || !(productId.length > 0)) {
                            alert("Please enter all the fields!");
                            return;
                        }
                        for (let i = 0; i < ordersPlaced.length; i++) {
                            if (ordersPlaced[i].purchaseId === purchaseId) {
                                if (ordersPlaced[i].shipmentStatus === "Order Canceled By Buyer, Payment Refunded") {
                                    alert("Order is already canceled by buyer, payment cannot be refunded!");
                                    return;
                                }
                                if (ordersPlaced[i].shipmentStatus !== "Order Canceled By Buyer, Payment will Be Refunded") {
                                    alert("Order is not canceled by buyer, payment cannot be refunded!");
                                    return;
                                }
                                break;
                            }
                        }
                        writeRefund?.();
                    }}
                    okButtonProps={{ disabled: buttonDisabled }}
                    cancelButtonProps={{ disabled: isLoadingRefund }}
                    closable={false}

                >
                    <Alert
                        message="Warning"
                        description="Refund for same product price currency and purchasing currency only !"
                        type="warning"
                        showIcon
                    />
                    <br />
                    <Form name="Refund" layout="vertical"
                        form={refundForm}
                        onFieldsChange={() =>
                            setButtonDisabled(
                                refundForm.getFieldsError().some((field) => field.errors.length > 0)
                            )
                        }>
                        <Form.Item name="productId" label="Product ID"
                            rules={[{
                                required: true,
                                message: "Please enter product id!",
                            }]}>
                            <Input
                                placeholder="SCSG1"
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                            />
                        </Form.Item>
                        <Form.Item name="purchaseId" label="Purchase ID"
                            rules={[{
                                required: true,
                                message: "Please enter purchase id!",
                            }]}>
                            <Input
                                placeholder="0"
                                value={purchaseId}
                                onChange={(e) => setPurchaseId(e.target.value)}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                <div style={{ width: '85vw' }} >
                    <Divider>Orders Placed</Divider>
                    <Table columns={columns}
                        dataSource={ordersPlaced}
                        pagination={{ position: ["bottomCenter"], pageSize: 3 }}
                        loading={isLoadingOrdersPlaced && ordersPlaced.length === 0}
                    />
                </div>

                &nbsp;
                <Button type="primary" onClick={showAddModal}>
                    Add Product
                </Button>
                <Modal
                    title="Add Product"
                    open={addModal}
                    onCancel={hideAddModal}
                    okText="Add Product"
                    cancelText="Cancel"
                    confirmLoading={isLoadingAddProduct}
                    onOk={() => {
                        console.log(productId);
                        if (productId.length === 0 || productName.length === 0 || category.length === 0 || price.length === 0 || priceCurrency === '' || description.length === 0) {
                            alert("Please enter all the fields!");
                            return;
                        }
                        writeAddProduct?.();
                    }
                    }
                    okButtonProps={{ disabled: buttonDisabled }}
                    cancelButtonProps={{ disabled: isLoadingAddProduct }}
                    closable={false}
                >
                    <Form name="Add Product" layout="vertical" form={addProductForm}
                        onFieldsChange={() =>
                            setButtonDisabled(
                                addProductForm.getFieldsError().some((field) => field.errors.length > 0)
                            )
                        }>
                        <Form.Item name="productId" label="Product ID"
                            rules={[{
                                required: true,
                                message: "Please enter product id!",
                            }]}>
                            <Input
                                placeholder="SCSG1"
                                value={productId}
                                onChange={(e) =>
                                    setProductId(e.target.value)}
                            />
                        </Form.Item>
                        <Form.Item name="productName" label="Product Name"
                            rules={[{
                                required: true,
                                message: "Please enter product name!",
                            }]}>
                            <Input
                                placeholder="Merlion keychain..."
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                            />
                        </Form.Item>
                        <Form.Item name="category" label="Category"
                            rules={[{
                                required: true,
                                message: "Please enter product category!",
                            }]}>
                            <Input
                                value={category}
                                placeholder="Souvenir..."
                                onChange={(e) => setCategory(e.target.value)}
                            />
                        </Form.Item>
                        <Form.Item name="price" label="Price"
                            rules={[{
                                required: true,
                                message: "Please enter product price!",
                            }]}>
                            <InputNumber
                                placeholder="0"
                                min="0.01"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e)}
                            />
                        </Form.Item>
                        <Form.Item name="priceCurrency" label="Price Currency"
                            rules={[{
                                required: true,
                                message: "Please enter product price currency!",
                            }]}>
                            <Select
                                placeholder="Select currency"
                                onChange={(value) => setPriceCurrency(value)}
                                allowClear
                            >
                                <Option value="DSGD">DSGD</Option>
                                <Option value="DMYR">DMYR</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="description" label="Description"
                            rules={[{
                                required: true,
                                message: "Please enter product description!",
                            }]}>
                            <Input
                                placeholder="Keychain..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                &nbsp;
                <Button type="primary" onClick={showDeleteModal} danger={true}>
                    Delete Product
                </Button>
                <DeleteProductModal
                    deleteModal={deleteModal}
                    hideDeleteModal={hideDeleteModal}
                    isLoadingDeleteProduct={isLoadingDeleteProduct}
                    productId={productId}
                    writeDeleteProduct={writeDeleteProduct}
                    setProductId={setProductId}
                    deleteProductForm={deleteProductForm}
                    buttonDisabled={buttonDisabled}
                    setButtonDisabled={setButtonDisabled} />

                <div style={{ width: '85vw' }} >
                    <Divider>My Products</Divider>
                    <Table columns={myProductsColumn}
                        dataSource={allProducts}
                        pagination={{ position: ["bottomCenter"], pageSize: 2 }}
                        loading={allProducts.length === 0 && isLoadingAllProduct}
                    />
                </div>
            </>
            : <div style={{ margin: "2% 0 0 5%", minWidth: "60vw" }}>
                <Form name="Sign Up" >
                    <p>You are not a seller! Please sign up as a seller.</p>
                    <Form layout="vertical">
                        <Form.Item label="Seller Name">
                            <Input
                                value={sellerName}
                                onChange={(e) => setSellerName(e.target.value)}
                            />
                        </Form.Item>
                        <br></br>
                        <Button type="primary" onClick={() => {
                            if (sellerName.length > 0) {
                                writeSellerSignUp?.();
                            }
                        }}
                            disabled={sellerName.length === 0}
                            loading={isLoadingSellerSignUp}>Sign Up</Button>
                    </Form>
                </Form>
            </div>
    )
}

export default Seller;
