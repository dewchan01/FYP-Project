import React, { useState, useEffect } from "react";
import { DollarOutlined, SwapOutlined, TransactionOutlined } from "@ant-design/icons";
import { Modal, Input, InputNumber, Table, Button } from "antd";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { polygonMumbai } from "@wagmi/chains";
import MCBDCABI from "../ABI/MCBDC.json";
import { getLabelByKey } from "./tokenConfig";

//check balanceOfLink
function RequestAndPay({ requests, getBalance, address, selectedCurrency, rate, expiringTime, isFXRateResponseValid, getFXRate, getHistory, getRequests }) {
  const [payModal, setPayModal] = useState(false);
  const [remitIntModal, setRemitIntModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [requestCurrency, setRequestCurrency] = useState("");
  const [toCurrency, setToCurrency] = useState("");
  const [requestAmount, setRequestAmount] = useState(0);
  const [swapAmount, setSwapAmount] = useState(0);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [requestAddress, setRequestAddress] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [swapMessage, setSwapMessage] = useState("");
  const [payIndex, setPayIndex] = useState(1);
  const [deleteIndex, setDeleteIndex] = useState(1);

  const [isSuccessSwap, setIsSuccessSwap] = useState(false);
  const [isSuccessRate, setIsSuccessRate] = useState(false);

  requests = requests?.['requests']?.slice();
  console.log("Requests", requests?.[0]);

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

  const { isLoading: isLoadingPay, isSuccess:isSuccessPay } = useWaitForTransaction({
    hash: dataPay?.hash,
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


  const showRemitIntModal = () => {
    setRemitIntModal(true);
  }
  const hideRemitIntModal = () => {
    setRemitIntModal(false);
  }

  const showPayModal = () => {
    setPayModal(true);
  };
  const hidePayModal = () => {
    setPayModal(false);
  };

  const showRequestModal = () => {
    setRequestModal(true);
  };
  const hideRequestModal = () => {
    setRequestModal(false);
  };
  useEffect(() => {
    if (isSuccessPay || isSuccessRequest || isSuccessSwap || isSuccessDeleteRequest) {
      getBalance();
      getHistory();
      getRequests();
      getFXRate();
      hidePayModal();
      hideRequestModal();
      hideRemitIntModal();
      setIsSuccessRate(false);
      setIsSuccessSwap(false);
    }
    console.log(isSuccessRate, isSuccessSwap)
    if (isSuccessRate) {
      getFXRate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessPay, isSuccessRequest, isSuccessSwap, isSuccessRate, isSuccessDeleteRequest])

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
          <Button type="primary" loading={isLoadingPay || isLoadingRate} onClick={() => handlePay(record.No)}>{((!isSuccessRate || !isFXRateResponseValid) && requests?.[record.No - 1]?.[5] !== getLabelByKey(selectedCurrency).slice(1,)) ? "Request FX Rate" : "Pay"}</Button>
          {/* <Popconfirm
            title="Delete request"
            description="Are you sure to delete this request?"
            onConfirm={ message.success(`Request ${record.No} is deleted!`)}
            onCancel={message.error('Request is not deleted!')}
            okText="Yes"
            cancelText="No"
          > */}
          &nbsp;
          <Button type="primary" loading={isLoadingDeleteRequest} onClick={() => handleDelete(record.No)}>Delete</Button>
          {/* </Popconfirm> */}
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
          acc[field] = ` ${item[i + 3]}`;
        } else {
          acc[field] = item[i];
        }
      }
      return acc;
    }, {});
    return record;
  });

  const handlePay = (index) => {
    setPayIndex(index);
    console.log(!isSuccessPay,requests?.[payIndex - 1]?.[5], getLabelByKey(selectedCurrency).slice(1,));

    if (!isSuccessRate && requests?.[payIndex - 1]?.[5] !== getLabelByKey(selectedCurrency).slice(1,)) {
      writeRate?.()
      getFXRate();
    }
    else if ((isSuccessRate && !isSuccessPay && isFXRateResponseValid && requests?.[payIndex - 1]?.[5] !== getLabelByKey(selectedCurrency).slice(1,)) || (!isSuccessPay && requests?.[payIndex - 1]?.[5] === getLabelByKey(selectedCurrency).slice(1,))) {
      setInterval(getFXRate, 3000);// late response while changing currency
      writePay?.()
    }
    else if (isSuccessPay) {
      hidePayModal();
    }
  }
  const handleDelete = (index) => {
    setDeleteIndex(index);
    writeDeleteRequest?.()
    // Implement your logic to handle the deletion of the item at the specified index
  };

  return (
    <>
      <Modal
        title="Cross Border Transaction"
        open={remitIntModal}
        onOk={() => {
          if (!isSuccessRate) {
            writeRate?.()
            getFXRate();
          }
          else if (isSuccessRate && !isSuccessSwap && isFXRateResponseValid) {
            setInterval(getFXRate, 3000);// late response while changing currency
            writeSwap?.();
          }
        }}
        confirmLoading={isLoadingSwap || isLoadingRate}
        onCancel={hideRemitIntModal}
        okText={(!isFXRateResponseValid) ? "Request FX Rate" : ((isSuccessRate && !isSuccessSwap && isFXRateResponseValid) ? "Make Transaction" : "Request FX Rate")}
        cancelText="Cancel"
      >
        <p>To (address)</p>
        <Input placeholder="0x..." value={recipientAddress} onChange={(val) => setRecipientAddress(val.target.value)} required={true} />
        <p>Amount</p>
        <InputNumber value={swapAmount} onChange={(val) => setSwapAmount(val)} required={true} />
        <p>From Currency</p>
        <Input value={getLabelByKey(selectedCurrency)} readOnly={true} />
        <p>Target Currency</p>
        <Input placeholder={getLabelByKey(String(selectedCurrency % 2 + 1))}
          value={toCurrency}
          onChange={(val) => setToCurrency(val.target.value)}
          onBlur={() => {
            if (getLabelByKey(String(selectedCurrency)) === toCurrency) {
              setToCurrency("");
            }
          }}
          required={true} />
        {getLabelByKey(String(selectedCurrency)) === toCurrency && (
          <p style={{ color: 'red' }}>You cannot make cross border transaction using same currency.</p>
        )}
        {!isSuccessRate && !isFXRateResponseValid ? (
          <p></p>
        ) : (isSuccessRate && isFXRateResponseValid
          ?
          (
            <>
              <p>Rate for {expiringTime / 60}mins {"("}1{getLabelByKey(selectedCurrency)}: {(rate / 1e18).toFixed(6)}{getLabelByKey(String(selectedCurrency % 2 + 1))}{")"}</p>
              <Input value={(swapAmount * rate / 1e18).toFixed(2)} readOnly={true} />
            </>
          )
          : (
            <p style={{ color: "red" }}>Please request FX Rate!</p>
          ))
        }
        <p>Message</p>
        <Input placeholder="Lunch Bill..." value={swapMessage} onChange={(val) => setSwapMessage(val.target.value)} />
      </Modal>

      <Modal
        title="Recent Requests"
        open={payModal}
        onCancel={hidePayModal}
        footer={null}
        width={880}
      >
        {requests && requests.length > 0 && (
          <>
            <Table
              dataSource={dataSource}
              address={address}
              columns={columns}
              pagination={{ position: ["bottomCenter"], pageSize: 3 }}
            />
            <p>Pay by: <strong>{getLabelByKey(selectedCurrency)}</strong></p>
          </>
        )}
      </Modal>

      <Modal
        title="Request A Payment"
        open={requestModal}
        onOk={() => {
          if (requestAddress !== address) { // Check if requestAddress is not equal to userAddress
            writeRequest?.();
          }
        }}
        confirmLoading={isLoadingRequest}
        onCancel={hideRequestModal}
        okText="Proceed To Request"
        cancelText="Cancel"
      >
        <p>From (address)</p>
        <Input placeholder="0x..." value={requestAddress} onChange={(val) => setRequestAddress(val.target.value)} />
        {requestAddress === address && (
          <p style={{ color: 'red' }}>You cannot request payment from your own address.</p>
        )}
        <p>Amount</p>
        <InputNumber value={requestAmount} onChange={(val) => setRequestAmount(val)} />
        <p>Receive Currency</p>
        <Input placeholder={getLabelByKey(selectedCurrency)} value={requestCurrency} onChange={(val) => setRequestCurrency(val.target.value)} />
        <p>Message</p>
        <Input placeholder="Lunch Bill..." value={requestMessage} onChange={(val) => setRequestMessage(val.target.value)} />
      </Modal>

      <div className="requestAndPay">
        <div
          className="quickOption"
          onClick={() => {
            showRemitIntModal();
          }}
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
        >
          <SwapOutlined style={{ fontSize: "26px" }} />
          Request
        </div>
      </div>
    </>
  );
}

export default RequestAndPay;