import React, { useEffect, useState } from "react";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { sepolia } from "@wagmi/chains";
import { List, Card, Button, Modal, Form, Input, InputNumber, Select, Space, BackTop, DatePicker, Alert } from "antd";
import { LoginOutlined, WindowsFilled } from "@ant-design/icons"
import axios from "axios";
import VoucherABI from "../ABI/VoucherContract.json"
import { NFTStorage, Blob } from "nft.storage";
import { getContractABIByKey, getContractAddressByKey } from "./tokenConfig";
import apiUrl from "../apiConfig";

function Voucher({ address, isValidUser, myr, sgd }) {
    const baseURL = apiUrl();
    const { Option } = Select;
    const [createVoucherForm] = Form.useForm();
    const [updateAllowanceForm] = Form.useForm();
    const [allProducts, setAllProducts] = useState([]);
    const [allVouchers, setAllVouchers] = useState([]);
    const [campaignId, setCampaignId] = useState("");
    const [suitableProductIds, setSuitableProductIds] = useState([]);
    const [expirationDate, setExpirationDate] = useState("");
    const [expirationUTCDate, setExpirationUTCDate] = useState("");
    const [minSpend, setMinSpend] = useState("");
    const [value, setValue] = useState("");
    const [valueCurrency, setValueCurrency] = useState("");
    const [amount, setAmount] = useState("");
    const [cid, setCid] = useState("");
    const [voucherId, setVoucherId] = useState("");
    const [allowance, setAllowance] = useState("");
    const [allowanceCurrency, setAllowanceCurrency] = useState(0);
    const [createModal, setCreateModal] = useState(false);
    const [updateAllowanceModal, setUpdateAllowanceModal] = useState(false);
    const [shouldClaim, setShouldClaim] = useState(false);
    const [isCidAvailable, setIsCidAvailable] = useState(false);
    const [isCidLoading, setIsCidLoading] = useState(false);
    const [balanceOfAllVouchers, setBalanceOfAllVouchers] = useState([]);
    const [claimedList, setClaimedList] = useState([]);
    const client = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_TOKEN })
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [isLoadingVoucher, setIsLoadingVoucher] = useState(true)

    async function showAllVouchers() {
        const res = await axios.get(`${baseURL}/getAllVouchers`);
        setAllVouchers(res.data || []);
        if (res.data.length === 0) {
            setIsLoadingVoucher(false);
        }
    }

    async function balanceOf() {
        const res = await axios.get(`${baseURL}/getBalanceOfVoucher`, {
            params: { userAddress: process.env.REACT_APP_VOUCHER_CONTRACT_OWNER },
        });
        setBalanceOfAllVouchers(res.data || []);
    }

    async function showAllProducts() {
        const res = await axios.get(`${baseURL}/allProducts`);
        setAllProducts(res.data || []);
        console.log(res.data);
    }

    async function requestCID() {
        console.log("Remember to check balance!")
        if (!campaignId || suitableProductIds.length === 0 || !expirationDate || !minSpend || !value || !valueCurrency || !amount) {
            alert('One or more properties in voucher info is empty');
            return;
        }
        if ((valueCurrency === 'SGD' && sgd < value * amount / 1e18) || (valueCurrency === 'MYR' && myr < value * amount / 1e18)) {
            alert('Insufficient Balance');
            return;
        }
        try {
            setIsCidLoading(true);
            const VoucherInfo = new Blob([JSON.stringify({
                campaignId,
                voucherId: allVouchers.length,
                suitableProductIds,
                expirationDate,
                minSpend: minSpend,
                value: value,
                valueCurrency,
                amount,
            })], { type: 'application/json' })
            const cid = await client.storeBlob(VoucherInfo);
            setCid(cid);
            setIsCidAvailable(true);
        } catch (error) {
            console.error('Error calling API:', error);
        } finally {
            setIsCidLoading(false);
        }
    }

    async function getClaimedList() {
        const res = await axios.get(`${baseURL}/getClaimedList`, {
            params: { userAddress: address },
        })
        setClaimedList(res.data || []);
    }

    const showCreateModal = () => {
        setCreateModal(true);
    }

    const hideCreateModal = () => {
        setCreateModal(false);
    }

    const showUpdateAllowanceModal = () => {
        setUpdateAllowanceModal(true);
    }

    const hideUpdateAllowanceModal = () => {
        setUpdateAllowanceModal(false);
    }

    const { config: configCreateVoucher } = usePrepareContractWrite({
        chainId: sepolia.id,
        address: process.env.REACT_APP_VOUCHER_CONTRACT_ADDRESS,
        abi: VoucherABI,
        functionName: "createVoucher",
        args: [campaignId, suitableProductIds, expirationUTCDate, String(Number(minSpend * 1e18)), String(Number(value * 1e18)), valueCurrency.slice(1,), amount, cid],
    })

    const { write: writeCreateVoucher, data: dataCreateVoucher } = useContractWrite(configCreateVoucher);

    const { isLoading: isLoadingCreateVoucher, isSuccess: isSuccessCreateVoucher } = useWaitForTransaction({
        hash: dataCreateVoucher?.hash,
    })

    const { config: configClaimVoucher } = usePrepareContractWrite({
        chainId: sepolia.id,
        address: process.env.REACT_APP_VOUCHER_CONTRACT_ADDRESS,
        abi: VoucherABI,
        functionName: "claimVoucher",
        args: [String(voucherId)],
    })

    const { write: writeClaimVoucher, data: dataClaimVoucher } = useContractWrite(configClaimVoucher);

    const { isLoading: isLoadingClaimVoucher, isSuccess: isSuccessClaimVoucher } = useWaitForTransaction({
        hash: dataClaimVoucher?.hash,
    })

    const { config: configBurnVoucher } = usePrepareContractWrite({
        chainId: sepolia.id,
        address: process.env.REACT_APP_VOUCHER_CONTRACT_ADDRESS,
        abi: VoucherABI,
        functionName: "burnVoucher",
        args: []
    })

    const { write: writeBurnVoucher, data: dataBurnVoucher } = useContractWrite(configBurnVoucher);
    const { isLoading: isLoadingBurnVoucher, isSuccess: isSuccessBurnVoucher } = useWaitForTransaction({
        hash: dataBurnVoucher?.hash,
    })

    const { config: configUpdateAllowance } = usePrepareContractWrite({
        chainId: sepolia.id,
        address: getContractAddressByKey(allowanceCurrency),
        abi: getContractABIByKey(allowanceCurrency),
        functionName: "approve",
        args: [process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS, String(Number(allowance * 1e18))]
    })

    const { write: writeUpdateAllowance, data: dataUpdateAllowance } = useContractWrite(configUpdateAllowance);
    const { isLoading: isLoadingUpdateAllowance, isSuccess: isSuccessUpdateAllowance } = useWaitForTransaction({
        hash: dataUpdateAllowance?.hash,
    })

    const onValueCurrencyChange = (value) => {
        switch (value) {
            case 'SGD':
                setValueCurrency('DSGD');
                break;
            case 'MYR':
                setValueCurrency("DMYR");
                break;
            default:
        }
    }
    const handleClaim = (voucherId) => {
        setVoucherId(voucherId);
        setShouldClaim(true);
    }

    const handleConvertToUTC = (date) => {
        console.log("DATE", date)
        const localTimestamp = new Date(new Date(date)).getTime() - new Date(date).getTimezoneOffset() * 60000;
        const utcTimestamp = Math.floor(localTimestamp / 1000) + (new Date().getTimezoneOffset() * 60);
        setExpirationDate(date);
        setExpirationUTCDate(utcTimestamp);
    }

    useEffect(() => {
        console.log("CLAIMED:", claimedList)
        console.log("UTC", expirationUTCDate)
        console.log("VALUE", value)
        if (allProducts.length === 0) {
            balanceOf();
            showAllVouchers();
            showAllProducts();
        }
        if (claimedList.length === 0) {
            getClaimedList();
        }
        if (isValidUser && !isSuccessClaimVoucher && shouldClaim) {
            writeClaimVoucher?.();
        }
        console.log(isSuccessUpdateAllowance)
        if (isSuccessUpdateAllowance) {
            hideUpdateAllowanceModal();
            alert("Allowance update successfully!");
            updateAllowanceForm.resetFields();
        }
        if (isSuccessBurnVoucher) {
            balanceOf();
            showAllVouchers();
            getClaimedList();
            alert("Burn successfully!");
        }
        if (isSuccessClaimVoucher || isSuccessCreateVoucher) {
            createVoucherForm.resetFields();
            hideCreateModal();
            balanceOf();
            showAllVouchers();
            setShouldClaim(false);
            getClaimedList();
            setIsCidAvailable(false);
            setCid("");
            alert("Claimed or created successfully!");
            window.location.href = "/";
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuccessClaimVoucher, isSuccessCreateVoucher, isSuccessBurnVoucher, isSuccessUpdateAllowance, allProducts, voucherId, cid, valueCurrency, shouldClaim, createVoucherForm, allowanceCurrency, updateAllowanceForm, expirationUTCDate, suitableProductIds])
    return (
        <>
            <div style={{ margin: "20px 0 0 20px", display: "flex", flexDirection: "column" }}>
                <p><LoginOutlined /> Sign Up as user to claim your voucher or <a onClick={showCreateModal}>create your own voucher</a> &nbsp;
                    {address === process.env.REACT_APP_VOUCHER_CONTRACT_OWNER ?
                        <>
                            <Button type="primary" danger={true} loading={isLoadingBurnVoucher} onClick={writeBurnVoucher}>Burn Expired Voucher</Button>&nbsp;
                            <Button onClick={showUpdateAllowanceModal}>Update Allowance</Button>

                        </>
                        : null}</p>
                <Modal
                    title="Update Allowance"
                    open={updateAllowanceModal}
                    onCancel={hideUpdateAllowanceModal}
                    okText="Update"
                    cancelText="Cancel"
                    confirmLoading={isLoadingUpdateAllowance}
                    onOk={() => { writeUpdateAllowance() }}
                    okButtonProps={{ disabled: buttonDisabled }}
                    closable={false}
                    cancelButtonProps={{ disabled: isLoadingUpdateAllowance }}
                >
                    <Form name="Update Allowance" layout="vertical" form={updateAllowanceForm}
                        onFieldsChange={() => {
                            setButtonDisabled(
                                updateAllowanceForm.getFieldsError().some((field) => field.errors.length > 0)
                            )
                        }
                        }>
                        <Form.Item name="Allowance" label="Allowance"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the allowance!"
                                }
                            ]}>
                            <InputNumber
                                min="0"
                                value={allowance}
                                onChange={(value) => setAllowance(value)}
                            />
                        </Form.Item>
                        <Form.Item name="Currency" label="Currency"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the currency allowance!"
                                }
                            ]}>
                            <Space
                                style={{
                                    width: '20%',
                                }}
                                direction="vertical"
                            >
                                <Select
                                    placeholder="Select currency"
                                    onChange={(value) => setAllowanceCurrency(value)}
                                    allowClear
                                >
                                    <Option value="1">DSGD</Option>
                                    <Option value="2">DMYR</Option>
                                </Select>
                            </Space>
                        </Form.Item>
                    </Form>
                </Modal>
                <Modal
                    title="Create Voucher"
                    open={createModal}
                    onCancel={hideCreateModal}
                    okText={cid.length === 0 ? "Request CID" : "Create Voucher"}
                    cancelText="Cancel"
                    confirmLoading={isLoadingCreateVoucher || isCidLoading}
                    onOk={async () => {
                        console.log(cid);
                        if (cid.length === 0) {
                            await requestCID();
                        } else {
                            console.log(campaignId, suitableProductIds, expirationUTCDate, String(Number(minSpend * 1e18)), String(Number(value * 1e18)), valueCurrency.slice(1,), amount, cid)
                            writeCreateVoucher?.();
                        }
                    }
                    }
                    okButtonProps={{ disabled: buttonDisabled }}
                    closable={false}
                    cancelButtonProps={{ disabled: isLoadingCreateVoucher || isCidLoading || isCidAvailable }}
                >
                    <Alert showIcon message="Please reload window to check the new voucher is updated in product tab after creation." type="warning"></Alert>
                    <Form name="Create Voucher" layout="vertical" form={createVoucherForm}
                        onFieldsChange={() => {
                            setButtonDisabled(
                                createVoucherForm.getFieldsError().some((field) => field.errors.length > 0)
                            )
                        }}>
                        <Form.Item
                            label="Campaign Name"
                            name="Campaign Name"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the campaign name!"
                                }
                            ]}>
                            <Input
                                id="Campaign Name"
                                placeholder="CAM-01"
                                value={campaignId}
                                onChange={(e) =>
                                    setCampaignId(e.target.value)}
                            />
                        </Form.Item>
                        <Form.Item label="Suitable Product IDs" name="Suitable Product IDs"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input at least one product Id!"
                                }
                            ]}>
                            <Space
                                style={{
                                    width: '100%',
                                }}
                                direction="vertical"
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    style={{
                                        width: '100%',
                                    }}
                                    placeholder="Please select product ID"
                                    onChange={(selectedValues) => setSuitableProductIds((prevIds) => [...prevIds, ...selectedValues.map(value => value.trim())])}
                                    options={allProducts.map(product => ({ label: product.productId, value: product.productId }))}
                                />
                            </Space>
                        </Form.Item>
                        <Form.Item label="Expiry Date" name="Expiry Date"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the expiration date!"
                                }
                            ]}>
                            <DatePicker
                                showTime={{
                                    format: 'HH:mm:ss',
                                }}
                                format="YYYY-MM-DD HH:mm:ss"
                                label="Expiry Date" name="Expiry Date"
                                value={expirationDate}
                                onChange={
                                    (e) => {
                                        handleConvertToUTC(e)
                                    }}
                                disabledDate={d => !d || d.isBefore(new Date())}
                            />

                        </Form.Item>
                        <Form.Item label="Min Spend" name="Min Spend"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the minimum spending!"
                                }
                            ]}>
                            <InputNumber
                                min="0"
                                placeholder="0"
                                step="0.01"
                                value={minSpend}
                                onChange={(e) => setMinSpend(e)}
                            />
                        </Form.Item>


                        <Form.Item label="Value" name="Value"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the value of voucher!"
                                }
                            ]}
                        >
                            <InputNumber
                                value={value}
                                min="0.01"
                                step="0.01"
                                placeholder="1"
                                onChange={(e) => setValue(e)}
                            />
                        </Form.Item>
                        <Form.Item label="Value Currency" name="Value Currency"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the currency of voucher value!"
                                }
                            ]}>
                            <Select
                                placeholder="Select currency"
                                onChange={(value) => onValueCurrencyChange(value)}
                                allowClear
                            >
                                <Option value="SGD">DSGD</Option>
                                <Option value="MYR">DMYR</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Amount" name="Amount"
                            rules={[
                                {
                                    required: true,
                                    message: "Please input the distributed amount of voucher!"
                                }
                            ]}>
                            <InputNumber
                                min="1"
                                step="1"
                                placeholder="1"
                                value={amount}
                                onChange={(e) => setAmount(e)}
                            />
                        </Form.Item>
                        {isCidAvailable && <><p>Cid</p>
                            <Input
                                value={cid}
                                readOnly={true}
                                rules={[
                                    {
                                        required: true,
                                        message: "Store voucher failed! Please check with administrator!"
                                    }
                                ]}
                            />
                        </>
                        }
                    </Form>

                </Modal>

                <List
                    style={{ margin: "20px 0 0 0", width: "200%" }}
                    grid={{ gutter: 8, column: 4 }}
                    dataSource={allVouchers}
                    loading={isLoadingVoucher && allVouchers.length === 0}
                    renderItem={(voucher) => {
                        console.log(voucher)
                        const remainingDays = Math.ceil(Math.max(0, (new Date(voucher.expirationDate * 1000) - new Date()) / (1000 * 60 * 60 * 24)));
                        return (
                            <List.Item>
                                <Card
                                    title={<a href={voucher.uri} target="blank">Voucher ID: {voucher.voucherId}</a>}
                                    style={{ width: 200, textAlign: "center" }}
                                >
                                    <strong>{parseFloat(voucher.value) / 1e18} D{voucher.valueCurrency}</strong>
                                    <p><i>Suitable for {voucher.suitableProductIds}</i></p>
                                    {remainingDays > 0 ? <p> {remainingDays} day{remainingDays !== 1 ? 's' : ''} left</p> : <p>Expired</p>}
                                    <hr></hr>
                                    {address !== process.env.REACT_APP_VOUCHER_CONTRACT_OWNER
                                        ? <Button type="primary" loading={isLoadingClaimVoucher} disabled={!isValidUser || remainingDays <= 0 || claimedList.includes(String(voucher.voucherId))} onClick={() => handleClaim(voucher.voucherId)}>{claimedList.includes(String(voucher.voucherId)) ? "Claimed" : "Claim"}</Button>
                                        : null}
                                    <div style={{ fontSize: "smaller", display: "flex", justifyContent: "space-between" }}>
                                        <div>
                                            <br />
                                            Amount: {balanceOfAllVouchers[voucher.voucherId]} left
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <p>*T&C Applied<br />
                                                *Only apply on products tagged with {voucher.valueCurrency}</p>
                                        </div>
                                    </div>
                                </Card>
                            </List.Item>
                        );
                    }}
                />
            </div>
            <div>
                <BackTop />
            </div>
        </>
    )
}

export default Voucher;