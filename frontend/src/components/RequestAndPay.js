import React, { useState, useEffect } from "react";
import { DollarOutlined, SwapOutlined, TransactionOutlined, DownOutlined } from "@ant-design/icons";
import { Modal, Input, InputNumber, Table, Button, Dropdown, Space, Menu, Alert, Checkbox } from "antd";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { polygonMumbai } from "@wagmi/chains";
import MCBDCABI from "../ABI/MCBDC.json";
import ECommerceABI from "../ABI/ECommerce.json";
import { getLabelByKey, tokenConfig } from "./tokenConfig";
import axios from "axios";
import apiUrl from "../apiConfig";

//check balanceOfLink
function RequestAndPay({ requests, getBalance, address, selectedCurrency, rate, expiringTime, isFXRateResponseValid, getFXRate, getHistory, getRequests }) {
  const [payModal, setPayModal] = useState(false);
  const [remitIntModal, setRemitIntModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [refundModal,setRefundModal] = useState(false);
  const [requestCurrency, setRequestCurrency] = useState("");
  const [productId, setProductId] = useState(null);
  const [purchaseId, setPurchaseId] = useState(null);
  const [toCurrency, setToCurrency] = useState("");
  const [requestAmount, setRequestAmount] = useState(null);
  const [swapAmount, setSwapAmount] = useState(null);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [requestAddress, setRequestAddress] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [swapMessage, setSwapMessage] = useState("");
  const [payIndex, setPayIndex] = useState(0);
  const [isValidSeller,setIsValidSeller] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(1);
  const [shouldDelete, setShouldDelete] = useState(false);
  const [shouldRate, setShouldRate] = useState(false);
  const [shouldSwap, setShouldSwap] = useState(false);
  const [shouldPay, setShouldPay] = useState(false);
  const [confirmChecked,setConfirmChecked] = useState(false);
  const [okText, setOkText] = useState("Please select requests!");

  const [isSuccessPay, setIsSuccessPay] = useState(false);
  const [isSuccessSwap, setIsSuccessSwap] = useState(false);
  const [isSuccessRate, setIsSuccessRate] = useState(false);
  const items = tokenConfig;
  const filteredTokens = tokenConfig.filter(item => item.key !== selectedCurrency);
  const baseURL = apiUrl();

  requests = requests?.['requests']?.slice();
  console.log("Requests", requests);

  async function checkValidSeller() {
    const res = await axios.get(`${baseURL}/isValidSeller`, {
        params: { userAddress: address },
    });

    const response = res.data;
    // console.log(response);
    setIsValidSeller(response);
}

  const { config: configPay } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "payRequest",
    args: [payIndex - 1, getLabelByKey(selectedCurrency).slice(1,)],
    // overrides: {
    //   value: String(Number(requests["1"][0])),
    // },
  });

  const { write: writePay, data: dataPay } = useContractWrite(configPay);

  const { config: configRequest } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "createRequest",
    args: [requestAddress, String(requestAmount * (10 ** 18)), requestCurrency.slice(1,), requestMessage],
  });

  const { write: writeRequest, data: dataRequest } = useContractWrite(configRequest);

  const { config: configDeleteRequest } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "deleteRequest",
    args: [deleteIndex - 1],
  });

  const { write: writeDeleteRequest, data: dataDeleteRequest } = useContractWrite(configDeleteRequest);

  const { config: configRate } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "requestFxRate",
    args: [getLabelByKey(selectedCurrency).slice(1,), toCurrency.slice(1,)],
  });

  const { write: writeRate, data: dataRate } = useContractWrite(configRate);

  const { config: configSwap } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "swapToken",
    args: [String(Number(swapAmount * 1e18)), recipientAddress, getLabelByKey(selectedCurrency).slice(1,), toCurrency.slice(1,), swapMessage],
  });

  const { write: writeSwap, data: dataSwap } = useContractWrite(configSwap);

  const { isLoading: isLoadingPay } = useWaitForTransaction({
    hash: dataPay?.hash,
    onSuccess: () => setIsSuccessPay(true),
  })

  const { isLoading: isLoadingRequest, isSuccess: isSuccessRequest } = useWaitForTransaction({
    hash: dataRequest?.hash,
  })

  const { isLoading: isLoadingDeleteRequest, isSuccess: isSuccessDeleteRequest } = useWaitForTransaction({
    hash: dataDeleteRequest?.hash,
  })

  const { isLoading: isLoadingSwap } = useWaitForTransaction({
    hash: dataSwap?.hash,
    onSuccess: () => setIsSuccessSwap(true),
  })

  const { isLoading: isLoadingRate } = useWaitForTransaction({
    hash: dataRate?.hash,
    onSuccess: () => setIsSuccessRate(true),
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

  const showRemitIntModal = () => {
    setRemitIntModal(true);
  }
  const hideRemitIntModal = () => {
    setRemitIntModal(false);
    setSwapAmount(null);
    setSwapMessage('');
    setRecipientAddress('');
    setToCurrency('');
    setConfirmChecked(false);
  }

  const showPayModal = () => {
    setPayModal(true);
    getFXRate();
  };
  const hidePayModal = () => {
    setPayModal(false);
  };

  const showRequestModal = () => {
    setRequestModal(true);
  };
  const hideRequestModal = () => {
    setRequestModal(false);
    setRequestCurrency('');
    setRequestAmount(null);
    setRequestMessage('');
    setRequestAddress('');
  };

  const showRefundModal = () => {
    setRefundModal(true);
  } 

  const hideRefundModal = () => {
    setRefundModal(false);
    setProductId('');
    setPurchaseId('');
  }

  const columns = [
    {
      title: "No",
      dataIndex: "No",
      key: "No",
    },
    {
      title: "Recipient",
      dataIndex: "Recipient",
      key: "Recipient",
    },
    {
      title: "Send",
      dataIndex: "Send",
      key: "Send",
    },
    {
      title: "Message",
      dataIndex: "Message",
      key: "Message",
    },
    {
      title: "Action",
      dataIndex: "Action",
      key: "Action",
      render: (_, record) => (
        <>
          {/* <Button type="primary" loading={isLoadingPay || isLoadingRate} onClick={() => handlePay(record.No)}>{((isSuccessRate && isFXRateResponseValid) || requests?.[record.No - 1]?.[5] === getLabelByKey(selectedCurrency).slice(1,)) ? "Pay" : "Request FX Rate"}</Button>
          &nbsp; */}
          <Button type="primary" disabled={isLoadingPay || isLoadingRate} loading={isLoadingDeleteRequest} onClick={() => handleDelete(record.No)}>Delete</Button>
        </>
      ),
    }
  ];

  const fieldNames = [
    "No",
    "Recipient",
    "Send",
    "Message",
    "Delete"
  ];

  const dataSource = requests?.map((item, index) => {
    const record = fieldNames.reduce((acc, field, i) => {
      if (requests) {
        if (field === "No" || field === "Action") {
          acc[field] = index + 1;
        } else if (field === "Recipient") {
          acc[field] = `${item[i].slice(0, 4)}...${item[i].slice(38)}`;
          acc[`is${field}`] = item[i] === address;
        } else if (field === "Send") {
          acc[field] = `${(item[i + 1] / 10 ** 18).toFixed(2)} D${item[i + 3]}`;
          acc[`is${field}`] = item[i] === address;
        } else if (field === "Message") {
          acc[field] = ` ${item[i + 4]}`;
        } else {
          acc[field] = item[i];
        }
      }
      return acc;
    }, {});
    return record;
  });

  const handlePay = (index) => {
    if (index === 0) {
      setOkText("Select Request");
      alert("Please select a request first!");
      return;
    }

    setPayIndex(index);
    const newToCurrency = "D" + requests?.[payIndex - 1]?.[5];
    setToCurrency(newToCurrency);
    const sameCurrency = requests?.[payIndex - 1]?.[5] === getLabelByKey(selectedCurrency).slice(1,);
    console.log("temp", sameCurrency)
    if (!isSuccessRate && !sameCurrency) {
      setShouldRate(true);
    }
    if ((isSuccessRate && !isSuccessPay && !sameCurrency) || (!isSuccessPay && sameCurrency)) {
      setShouldPay(true);
    }
  }

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setShouldDelete(true);
  };

  const menu = (
    <Menu onClick={(e) => handleCurrencyChange(e)}>
      {items.map(item => (
        <Menu.Item key={item.label}>{item.label}</Menu.Item>
      ))}
    </Menu>
  );

  const filteredMenu = (
    <Menu onClick={(e) => handleCurrencyChange(e)}>
      {filteredTokens.map(item => (
        <Menu.Item key={item.label}>{item.label}</Menu.Item>
      ))}
    </Menu>
  );

  const indexMenu = (
    <Menu onClick={(e) => handlePayIndexChange(e)}>
      {requests?.map((item, index) => (
        <Menu.Item key={index + 1}>{index + 1}</Menu.Item>
      ))}
    </Menu>

  );


  const handleCurrencyChange = (e) => {
    const newCurrency = e.key;
    if (remitIntModal || payModal) {
      setToCurrency(newCurrency);
    }
    if (requestModal) {
      setRequestCurrency(newCurrency);
    }
  }

  const handlePayIndexChange = (e) => {
    //confirm that pay first or modify order status
    const newIndex = e.key;
    setPayIndex(newIndex);
  }

  useEffect(() => {
    const sameCurrency = getLabelByKey(selectedCurrency).slice(1,) === toCurrency.slice(1,);
    const samePayRequestCurrency = requests?.[payIndex - 1]?.[5] === getLabelByKey(selectedCurrency).slice(1,);
    getFXRate();
    checkValidSeller();

    if (payIndex !== 0) {
      const newOkText = (!isSuccessRate && !isFXRateResponseValid && !samePayRequestCurrency)
        ? "Request FX Rate"
        : ((isSuccessRate && !isSuccessPay && isFXRateResponseValid) || samePayRequestCurrency)
          ? "Pay"
          : "Request FX Rate";
      setOkText(newOkText);
    }

    if (shouldRate && !isSuccessRate && !sameCurrency) {
      writeRate?.()
    }

    if (isSuccessRate) {
      getFXRate();
      getFXRate();
      setIsSuccessRate(true);
      setIsSuccessSwap(false);
      setIsSuccessPay(false);
      setShouldRate(false);
    }

    if (shouldDelete) {
      console.log(deleteIndex);
      writeDeleteRequest?.();
      setShouldDelete(false);
    }

    // console.log("Pay?", payIndex, !isSuccessPay, requests?.[payIndex - 1]?.[5], getLabelByKey(selectedCurrency).slice(1,));
    if (shouldPay) {
      writePay?.();
      setShouldRate(false);
      setShouldPay(false);
    }

    if (shouldSwap && confirmChecked) {
      writeSwap?.();
      setShouldRate(false);
      setShouldSwap(false);
    }

    if (isSuccessSwap) {
      setIsSuccessSwap(true);
      getBalance();
      getHistory();
      getFXRate();
      hideRemitIntModal();
      setIsSuccessSwap(false);
      setIsSuccessRate(false);
      setConfirmChecked(false);
    }
    if (isSuccessPay) {
      setIsSuccessPay(true);
      getBalance();
      getHistory();
      getFXRate();
      getRequests();
      hidePayModal();
      setIsSuccessRate(false);
      setShouldRate(false);
      setIsSuccessPay(false);
      if(requests?.[payIndex-1]?.[7].includes("refund") && isValidSeller){
          showRefundModal();
          setProductId(requests?.[payIndex-1]?.[7].split(" / ")[0].slice(7,)); 
          setPurchaseId(requests?.[payIndex-1]?.[7].split(" / ")[1]);
      }else{
      setPayIndex(0);
      setOkText("Select Request");
      }
    }
    if (isSuccessRequest || isSuccessDeleteRequest) {
      getRequests();
      hideRequestModal();
    }
    
    if(isSuccessRefund){
      hideRefundModal();
      setPayIndex(0);
      setOkText("Select Request");
    }
    // if (!isFXRateResponseValid) {
    //   setShouldRate(false);
    //   setIsSuccessRate(false);
    // }
    console.log("isSuccessRate?", isSuccessRate, isFXRateResponseValid, isSuccessPay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessPay, isSuccessRequest, isSuccessSwap, isSuccessRate, isSuccessDeleteRequest,isSuccessRefund, selectedCurrency, shouldRate, shouldDelete, shouldSwap, shouldPay, toCurrency, payIndex, isFXRateResponseValid,isValidSeller,productId,purchaseId])

  return (
    <>
      <Modal
        title="Cross Border Transaction"
        open={remitIntModal}
        onOk={() => {
          if (!isSuccessSwap && !isSuccessRate) {
            writeRate?.()
            getFXRate();
          }
          if (isSuccessRate && !isSuccessSwap && isFXRateResponseValid) {
            setShouldSwap(true);
          }
        }}
        confirmLoading={isLoadingSwap || isLoadingRate}
        onCancel={hideRemitIntModal}
        okText={(!isFXRateResponseValid) ? "Request FX Rate" : ((isSuccessRate && !isSuccessSwap && isFXRateResponseValid) ? "Make Transaction" : "Request FX Rate")}
        cancelText="Cancel"
        closable={false}
        cancelButtonProps={{ disabled: isLoadingSwap || isLoadingRate || isSuccessRate }}
        okButtonProps={{ disabled: recipientAddress === "" || swapAmount === "" || swapMessage === "" || toCurrency === "" || (isFXRateResponseValid && isSuccessRate && !isSuccessSwap && !confirmChecked) }}
      >
        <Alert showIcon message="There could be an issue when the LINK Token is insufficient for requesting FX Rate." type="warning"></Alert>
        <p><span style={{ color: "red" }}>*</span>To (address)</p>
        <Input placeholder="0x..." value={recipientAddress} onChange={(val) => setRecipientAddress(val.target.value)} />
        <p><span style={{ color: "red" }}>*</span>Amount</p>
        <InputNumber min={0.01} placeholder={0.01} step={0.01} value={swapAmount} onChange={(val) => setSwapAmount(val)} />
        <p><span style={{ color: "red" }}>*</span>From Currency</p>
        <Input value={getLabelByKey(selectedCurrency)} readOnly={true} />
        <p><span style={{ color: "red" }}>*</span>Target Currency</p>
        <Dropdown overlay={filteredMenu} trigger={['click']}>
          <a style={{ color: 'black', fontSize: 'smaller', marginLeft: "5px" }} onClick={(e) => e.preventDefault()}>
            <Space>
              {(toCurrency === '') && <div>Select target currency</div>}
              {toCurrency === 'DSGD' && <div>DSGD</div>}
              {toCurrency === 'DMYR' && <div>DMYR</div>}
              <div>
                <DownOutlined />
              </div>
            </Space>
          </a>
        </Dropdown>
        {!isSuccessRate && !isFXRateResponseValid ? (
          <p></p>
        ) : (isSuccessRate && isFXRateResponseValid
          ?
          (
            <>
              <p>Rate for {expiringTime / 60}mins {"("}1{getLabelByKey(selectedCurrency)}: {(rate / 1e18).toFixed(6)}{toCurrency}{")"}</p>
              <Input value={(swapAmount * rate / 1e18).toFixed(2)} readOnly={true} />
            </>
          )
          : (
            <p style={{ color: "red" }}>Please request FX Rate!</p>
          ))
        }
        <p><span style={{ color: "red" }}>*</span>Message</p> 

        <Input placeholder="Lunch Bill..." value={swapMessage} onChange={(val) => setSwapMessage(val.target.value)} />
        {!isSuccessRate && !isFXRateResponseValid ? (
          <p></p>
        ) : (isSuccessRate && isFXRateResponseValid
          ?
          (
            <>
              <p>
                <Checkbox checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
                &nbsp;
                <i>Reminder: Please <strong>confirm</strong> your transaction details to continue transaction.</i>
              </p>
            </>
          )
          : (
            <p></p>
          ))
        }
      </Modal>

      <Modal
        title="Recent Requests"
        open={payModal}
        onCancel={hidePayModal}
        confirmLoading={isLoadingPay || isLoadingRate}
        okText={okText}
        onOk={() => {
          if (payIndex !== 0) {
            handlePay(payIndex);
          }
        }}
        width={880}
        closable={false}
        cancelButtonProps={{ disabled: isLoadingPay || isLoadingRate || isSuccessRate || isLoadingDeleteRequest }}
        okButtonProps={{ disabled: payIndex === 0 }}
      >
        {requests && requests.length > 0 && (
          <>
            <Table
              dataSource={dataSource}
              address={address}
              columns={columns}
              pagination={{ position: ["bottomCenter"], pageSize: 3 }}
            />
            <p>Pay by: <strong>{getLabelByKey(selectedCurrency)}</strong>&nbsp;&nbsp;
              <span style={{ color: "red" }}>*</span>Index No: &nbsp;
              {/* <InputNumber value={payIndex} onChange={(val) => setPayIndex(val)} /> */}
              <Space>
                <Dropdown overlay={indexMenu} trigger={['click']}>
                  <a style={{ color: "black", fontSize: 'smaller', marginLeft: "5px" }} onClick={(e) => e.preventDefault()}>
                    {(payIndex === 0) ? "Select request" : payIndex}
                    &nbsp;<DownOutlined />
                  </a>
                </Dropdown>
              </Space>
              {(!isSuccessRate || !isFXRateResponseValid) || requests?.[payIndex - 1]?.[5] === getLabelByKey(selectedCurrency).slice(1,) ? (
                <p></p>
              ) : (isSuccessRate && isFXRateResponseValid
                ?
                (
                  <>
                    <p>Rate for {expiringTime / 60}mins {"("}1{getLabelByKey(selectedCurrency)}: {(rate / 1e18).toFixed(6)}{requests?.[payIndex - 1]?.[5]}{")"}</p>
                    <p>Payable Amount: {(requests?.[payIndex - 1]?.[3] / rate).toFixed(2)}{getLabelByKey(selectedCurrency)}</p>
                  </>
                )
                : (
                  <p style={{ color: "red" }}>Please request FX Rate!</p>
                ))
              }
            </p>
          </>
        )}
      </Modal>

      <Modal
        title="Pay Refund"
        open={refundModal}
        onCancel={hideRefundModal}
        confirmLoading={isLoadingRefund}
        okText="Yes"
        cancelText="No"
        onOk={() => {
          console.log("CHECK product and purchase id",productId,purchaseId)
          writeRefund?.();
        }
        }
        closable={false}
        cancelButtonProps={{ disabled: isLoadingRefund }}
      >
        <Alert showIcon message="Seller paying refund is detected. If you are doing so, please modify the status by clicking the button 'YES' below." type="warning" />
      </Modal>

      <Modal
        title="Request A Payment"
        open={requestModal}
        onOk={() => {
          if (requestAddress !== address) { // Check if requestAddress is not equal to userAddress
            console.log(requestMessage)
            writeRequest?.();
          }
        }}
        confirmLoading={isLoadingRequest}
        onCancel={hideRequestModal}
        okText="Proceed To Request"
        cancelText="Cancel"
        closable={false}
        cancelButtonProps={{ disabled: isLoadingRequest }}
        okButtonProps={{ disabled: requestAddress === address || requestAmount === 0 || requestCurrency === "" || requestMessage === "" || requestAddress === "" }}
      >
        <p><span style={{ color: "red" }}>*</span>From (address)</p>
        <Input placeholder="0x..." value={requestAddress} onChange={(val) => setRequestAddress(val.target.value)} />
        {requestAddress === address && (
          <p style={{ color: 'red' }}>You cannot request payment from your own address.</p>
        )}
        <p><span style={{ color: "red" }}>*</span>Amount</p>
        <InputNumber placeholder={0.01} min={0.01} value={requestAmount} onChange={(val) => setRequestAmount(val)} />
        <p><span style={{ color: "red" }}>*</span>Receive Currency</p>
        <Dropdown overlay={menu} trigger={['click']}>
          <a style={{ color: 'black', fontSize: 'smaller', marginLeft: "5px" }} onClick={(e) => e.preventDefault()}>
            <Space>
              {(requestCurrency === '') && <div>Select receive currency</div>}
              {requestCurrency === 'DSGD' && <div>DSGD</div>}
              {requestCurrency === 'DMYR' && <div>DMYR</div>}
              <div>
                <DownOutlined />
              </div>
            </Space>
          </a>
        </Dropdown>
        <p><span style={{ color: "red" }}>*</span>Message</p>
        <Input placeholder="Lunch Bill..." value={requestMessage} onChange={(val) => setRequestMessage(val.target.value)} />
      </Modal>

      <div className="requestAndPay" >
        <div
          className="quickOption"
          onClick={() => {
            showRemitIntModal();
          }}
        // style={{ height: (window.location.pathname === "/sendAndRequest" ? "200px" : 0)}}
        >
          <TransactionOutlined style={{ fontSize: "26px" }} />
          Remit Int.
        </div>
        <div
          className={`quickOption ${requests && requests?.length > 0 ? "quickOption" : "quickOption-disabled"}`}
          onClick={() => {
            if (requests && requests.length > 0) {
              showPayModal();
            }
          }}
        // style={{ height: (window.location.pathname === "/sendAndRequest" ? "200px" : 0)}}
        >
          <DollarOutlined style={{ fontSize: "26px" }} />
          Pay
          {requests && requests && (
            <div className={`numReqs ${requests && requests?.length > 0 ? "numReqs" : "numReqs-disabled"}`}>{requests.length}</div>
          )}
        </div>
        <div
          className="quickOption"
          onClick={() => {
            showRequestModal();
          }}
        // style={{ height: (window.location.pathname === "/sendAndRequest" ? "200px" : 0)}}
        >
          <SwapOutlined style={{ fontSize: "26px" }} />
          Request
        </div>
      </div>
    </>
  );
}

export default RequestAndPay;