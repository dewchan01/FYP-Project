import React, { useEffect, useState } from "react";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { polygonMumbai } from "@wagmi/chains";
import { List, Card, Button, Modal, Form, Input, InputNumber, Select, Space, BackTop } from "antd";
import axios from "axios";
import VoucherABI from "../ABI/VoucherContract.json"
import { NFTStorage, Blob } from "nft.storage";
import { getContractABIByKey, getContractAddressByKey } from "./tokenConfig";

function Voucher({ address, isValidUser }) {
    const { Option } = Select;
    const [createVoucherForm] = Form.useForm();
    const [updateAllowanceForm] = Form.useForm();
    const [allProducts, setAllProducts] = useState([]);
    const [allVouchers, setAllVouchers] = useState([]);
    const [campaignId, setCampaignId] = useState("");
    const [suitableProductIds, setSuitableProductIds] = useState([]);
    const [expirationDate, setExpirationDate] = useState(null);
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

    async function showAllVouchers() {
        const res = await axios.get("http://localhost:3001/getAllVouchers");
        setAllVouchers(res.data || []);
        // console.log(res.data);
    }

    async function balanceOf() {
        const res = await axios.get("http://localhost:3001/getBalanceOfVoucher", {
            params: { userAddress: process.env.REACT_APP_VOUCHER_CONTRACT_OWNER },
        });
        setBalanceOfAllVouchers(res.data || []);
    }

    async function showAllProducts() {
        const res = await axios.get("http://localhost:3001/allProducts");
        setAllProducts(res.data || []);
        console.log(res.data);
        // console.log(res.data);
    }

    async function requestCID() {
        try {
            setIsCidLoading(true);  // Set loading state
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
        const res = await axios.get("http://localhost:3001/getClaimedList", {
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
        chainId: polygonMumbai.id,
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
        chainId: polygonMumbai.id,
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
        chainId: polygonMumbai.id,
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
        chainId: polygonMumbai.id,
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
        const localTimestamp = new Date(new Date(date)).getTime() - new Date(date).getTimezoneOffset() * 60000;
        const utcTimestamp = Math.floor(localTimestamp / 1000) + (new Date().getTimezoneOffset() * 60);
        setExpirationDate(date);
        setExpirationUTCDate(utcTimestamp);
    }

    useEffect(() => {
        console.log("CLAIMED:", claimedList)
        console.log("UTC", expirationUTCDate)
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

        if (isSuccessClaimVoucher || isSuccessCreateVoucher || isSuccessBurnVoucher) {
            createVoucherForm.resetFields();
            hideCreateModal();
            balanceOf();
            showAllVouchers();
            setShouldClaim(false);
            getClaimedList();
            setIsCidAvailable(false);
            setCid("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuccessClaimVoucher, isSuccessCreateVoucher, isSuccessBurnVoucher, isSuccessUpdateAllowance, allProducts, voucherId, cid, valueCurrency, shouldClaim, createVoucherForm, allowanceCurrency, updateAllowanceForm])
    return (
        <>
            <div style={{ margin: "20px 0 0 20px" }}>
                <p>Claim your voucher or <a onClick={showCreateModal}>create your own voucher</a> &nbsp;
                    {address === process.env.REACT_APP_VOUCHER_CONTRACT_OWNER ?
                        <>
                            <Button type="primary" danger={true} loading={isLoadingBurnVoucher} onClick={writeBurnVoucher}>Burn Voucher</Button>&nbsp;
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
                >
                    <Form name="Update Allowance" layout="vertical" form={updateAllowanceForm}>
                        <Form.Item name="Allowance" label="Allowance">
                            <InputNumber
                                value={allowance}
                                onChange={(value) => setAllowance(value)}
                                required={true}
                                min="0"
                            />
                        </Form.Item>
                        <Form.Item name="Currency" label="Currency">
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
                            await requestCID(); // await here to wait for the CID before proceeding
                        } else {
                            writeCreateVoucher();
                        }
                    }
                    }
                >
                    <Form name="Create Voucher" layout="vertical" form={createVoucherForm}>
                        <Form.Item label="Campaign Name">
                            <Input
                                placeholder="CAM-01"
                                value={campaignId}
                                required={true}
                                onChange={(e) =>
                                    setCampaignId(e.target.value)}
                            />
                        </Form.Item>
                        <Form.Item label="Suitable Product IDs">
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
                                    required={true}
                                    onChange={(selectedValues) => setSuitableProductIds((prevIds) => [...prevIds, ...selectedValues.map(value => value.trim())])}
                                    options={allProducts.map(product => ({ label: product.productId, value: product.productId }))}
                                />
                            </Space>
                        </Form.Item>
                        <Form.Item label="Expiry Date">
                            <Input
                                type="datetime-local"
                                value={expirationDate}
                                required={true}
                                onChange={(e) => {
                                    handleConvertToUTC(e.target.value);
                                }}
                            />
                        </Form.Item>
                        <Form.Item label="Min Spend">
                            <InputNumber
                                min="0"
                                placeholder="0"
                                value={minSpend}
                                required={true}
                                onChange={(e) => setMinSpend(e)}
                            />
                        </Form.Item>


                        <Form.Item label="Value"
                        >
                            <InputNumber
                                value={value}
                                min="1"
                                placeholder="1"
                                required={true}
                                onChange={(e) => setValue(e)}
                            />
                        </Form.Item>
                        <Form.Item label="Value Currency">
                            <Select
                                placeholder="Select currency"
                                onChange={(value) => onValueCurrencyChange(value)}
                                allowClear
                            >
                                <Option value="SGD">DSGD</Option>
                                <Option value="MYR">DMYR</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item label="Amount">
                            <InputNumber
                                min="1"
                                step={1}
                                placeholder="1"
                                value={amount}
                                required={true}
                                onChange={(e) => setAmount(e)}
                            />
                        </Form.Item>
                        {isCidAvailable && <><p>Cid </p>
                            <Input
                                value={cid}
                                readOnly={true}
                                required={true}
                            />
                        </>
                        }
                    </Form>
                </Modal>

                {allVouchers.length === 0 && <p>Loading vouchers...</p>}
                <List
                    style={{ margin: "20px 0 0 0", width: 1000 }}
                    grid={{ gutter: 8, column: 4 }}
                    dataSource={allVouchers}
                    renderItem={(voucher) => {
                        const remainingDays = Math.ceil(Math.max(0, (new Date(voucher.expirationDate * 1000) - new Date()) / (1000 * 60 * 60 * 24)));
                        return (
                            <List.Item>
                                <Card
                                    title={<a href={voucher.uri} target="blank">Voucher ID: {voucher.voucherId}</a>}
                                    // title={(voucher.organizer!==process.env.REACT_APP_VOUCHER_CONTRACT_OWNER)?"Seller Voucher":"Platform Voucher"}
                                    style={{ width: 200, textAlign: "center" }}
                                >
                                    {/* <p style={{ fontWeight: "bold" }}>Voucher ID: {voucher.voucherId}</p> */}
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