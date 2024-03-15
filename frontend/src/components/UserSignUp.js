import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import ECommerceABI from "../ABI/ECommerce.json";
import { polygonMumbai } from "@wagmi/chains";
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card } from "antd";
import axios from "axios";
import apiUrl from "../apiConfig";

function UserSignUp({ address }) {
    const [form] = Form.useForm();
    const [buyerName, setBuyerName] = useState("");
    const [email, setEmail] = useState("");
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [isValidUser, setIsValidUser] = useState(false);
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const baseURL = apiUrl();

    const { config: configCreateAccount } = usePrepareContractWrite({
        chainId: polygonMumbai.id,
        address: process.env.REACT_APP_ECOMMERCE_CONTRACT_ADDRESS,
        abi: ECommerceABI,
        functionName: "createAccount",
        args: [buyerName, email, deliveryAddress],
    });

    const { write: writeCreateAccount, data: dataCreateAccount } = useContractWrite(configCreateAccount);
    const { isLoading: isLoadingCreateAccount, isSuccess: isSuccessCreateAccount } = useWaitForTransaction({
        hash: dataCreateAccount?.hash,
    });

    async function checkValidUser() {
        const res = await axios.get(`${baseURL}/isValidUser`, {
            params: { userAddress: address },
        });

        const response = res.data;
        // console.log(response);
        setIsValidUser(response);

    }

    useEffect(() => {
        if (isSuccessCreateAccount) {
            form.resetFields();
            alert("Account created successfully! Please connect again!");
            window.location.href="/";
        }
        checkValidUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuccessCreateAccount, form, isValidUser]);

    const handleFormValuesChange = (_, allValues) => {
        // Update state when form values change
        setBuyerName(allValues.buyerName);
        setEmail(allValues.email);
        setDeliveryAddress(allValues.deliveryAddress);
    };

    return (
        <div style={{ margin: "2% 0 0 5%" }}>
        {(!isValidUser) ?
                <Card title="User Sign Up" style={{ width: "70vw" }}>
                    <Form
                        form={form}
                        labelCol={{ flex: '200px' }}
                        labelAlign="left"
                        wrapperCol={{ flex: 1 }}
                        layout="horizontal"
                        size="large"
                        onFinish={writeCreateAccount}
                        onValuesChange={handleFormValuesChange}
                        onFieldsChange={() =>
                            setButtonDisabled(
                              form.getFieldsError().some((field) => field.errors.length > 0)
                            )
                          }
                        style={{ width: "65vw" }}
                    >
                        <Form.Item
                            name="buyerName"
                            label="Name"
                            rules={[{ required: true, message: "Please enter your name" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[{ required: true, type: "email", message: "Please enter a valid email address" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="deliveryAddress"
                            label="Delivery Address"
                            rules={[{ required: true, message: "Please enter your delivery address" }]}
                        >
                            <Input.TextArea />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" disabled={buttonDisabled} htmlType="submit" loading={isLoadingCreateAccount}>
                                Sign Up
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            : <Card title="User Sign Up" style={{ width: "70vw"  }}>
                <Form            
                    layout="horizontal"
                    size="large"
                    style={{ width: 1100 }}
                >
                    <Form.Item>
                            You have already signed up as user!
                        </Form.Item>
                        </Form>
            </Card>}
    </div>
    );

}

export default UserSignUp;
