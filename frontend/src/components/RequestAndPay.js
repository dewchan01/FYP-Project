import React, { useState, useEffect } from "react";
import { DollarOutlined, SwapOutlined, TransactionOutlined } from "@ant-design/icons";
import { Modal, Input, InputNumber } from "antd";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { polygonMumbai } from "@wagmi/chains";
import MCBDCABI from "../ABI/MCBDC.json";
import { getLabelByKey, getContractAddressByKey, getContractABIByKey } from "./tokenConfig";

//check balanceOfLink
function RequestAndPay({ requests, getBalance, address, selectedCurrency, rate, expiringTime, isFXRateResponseValid, getFXRate }) {
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

  requests = requests?.["requests"];

  const { config } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "payRequest",
    args: [0, getLabelByKey(selectedCurrency).slice(1,)],
    // overrides: {
    //   value: String(Number(requests["1"][0])),
    // },
  });

  const { write, data } = useContractWrite(config);

  const { config: configRequest } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "createRequest",
    args: [requestAddress, String(requestAmount * (10 ** 18)), requestCurrency.slice(1,), requestMessage],
  });

  const { write: writeRequest, data: dataRequest } = useContractWrite(configRequest);

  const { config: configRate } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "requestFxRate",
    args: [getLabelByKey(selectedCurrency).slice(1,), toCurrency.slice(1,)],
  });

  const { write: writeRate, data: dataRate } = useContractWrite(configRate);

  const { config: configApprove } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: getContractAddressByKey(selectedCurrency),
    abi: getContractABIByKey(selectedCurrency),
    functionName: "approve",
    args: [process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS, (swapAmount!==0)?String(Number(swapAmount*1e18)):String(Number(requests?.["2"]?.[0]))],
  });

  const { write: writeApprove, data: dataApprove } = useContractWrite(configApprove);

  const { config: configSwap } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "swapToken",
    args: [String(Number(swapAmount*1e18)), recipientAddress, getLabelByKey(selectedCurrency).slice(1,), toCurrency.slice(1,), swapMessage],
  });

  const { write: writeSwap, data: dataSwap } = useContractWrite(configSwap);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const { isLoading: isLoadingRequest, isSuccess: isSuccessRequest } = useWaitForTransaction({
    hash: dataRequest?.hash,
  })

  const { isLoading: isLoadingApprove, isSuccess: isSuccessApprove } = useWaitForTransaction({
    hash: dataApprove?.hash,
  })

  const { isLoading: isLoadingSwap, isSuccess: isSuccessSwap } = useWaitForTransaction({
    hash: dataSwap?.hash,
  })

  const { isLoading: isLoadingRate, isSuccess: isSuccessRate } = useWaitForTransaction({
    hash: dataRate?.hash,
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
    console.log(isSuccessRequest,isSuccessRate, isSuccessApprove,isSuccessSwap)
    if (isSuccess || isSuccessRequest || isSuccessSwap) {
      getBalance();
      getFXRate();
      hidePayModal();
      hideRequestModal();
      hideRemitIntModal();
      
    }
    if(isSuccessRate){
      getFXRate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isSuccessRequest, isSuccessSwap,isSuccessRate])

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
          else if (isSuccessRate && !isSuccessApprove && isFXRateResponseValid) {
            setInterval(getFXRate,3000);
            writeApprove?.()
          }
          else if (isSuccessApprove && !isSuccessSwap && isFXRateResponseValid) {
            writeSwap?.();
          }
        }}
        confirmLoading={isLoadingSwap || isLoadingApprove || isLoadingRate}
        onCancel={hideRemitIntModal}
        okText={(!isFXRateResponseValid) ? "Request FX Rate" : ((!isSuccessApprove && isSuccessRate && !isSuccessSwap && isFXRateResponseValid) ? "Approved to Make Transaction" : ((isSuccessApprove && isSuccessRate && !isSuccessSwap) ? "Make Transaction" : "Request FX Rate"))}
        cancelText="Cancel"
      >
        <p>To (address)</p>
        <Input placeholder="0x..." value={recipientAddress} onChange={(val) => setRecipientAddress(val.target.value)} required={true}/>
        <p>Amount</p>
        <InputNumber value={swapAmount} onChange={(val) => setSwapAmount(val)} />
        <p>From Currency</p>
        <Input value={getLabelByKey(selectedCurrency)} readOnly={true} />
        <p>Target Currency</p>
        <Input placeholder={getLabelByKey(String(selectedCurrency % 2 + 1))} value={toCurrency} onChange={(val) => setToCurrency(val.target.value)} required={true}/>
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
          :(
          <p style={{ color: "red" }}>Please request FX Rate!</p>
        ))
        }
        <p>Message</p>
        <Input placeholder="Lunch Bill..." value={swapMessage} onChange={(val) => setSwapMessage(val.target.value)} />
      </Modal>

      <Modal
        title="Confirm Payment"
        open={payModal}
        onOk={() => {
          if (!isSuccessApprove) {
            writeApprove?.()
          }
          else if (isSuccessApprove) {
            write?.();
          }
          if (isSuccess) {
            hidePayModal();
          }
        }}
        confirmLoading={isLoadingApprove || isLoading}
        onCancel={hidePayModal}
        okText={!isSuccessApprove ? "Approved to Pay" : "Proceed To Pay"} // Change the text based on isSuccessApprove
        cancelText="Cancel"
      >
        {requests && requests["0"] && (
          <>
            <h2>Sending payment to {requests["0"][0]}</h2>
            <h3>Value: {requests["2"][0] / 1e18} {requests["4"][0]}</h3>
            <p>"{requests["5"][0]}"</p>
            <p>Pay by <strong>{getLabelByKey(selectedCurrency)}</strong></p>
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
          className={`quickOption ${requests && requests["0"]?.length > 0 ? "quickOption" : "quickOption-disabled"}`}
          onClick={() => {
            if (requests && requests["0"].length > 0) {
              showPayModal();
            }
          }}
        >
          <DollarOutlined style={{ fontSize: "26px" }} />
          Pay
          {requests && requests["0"] && (
            <div className={`numReqs ${requests && requests["0"]?.length > 0 ? "numReqs" : "numReqs-disabled"}`}>{requests["0"].length}</div>
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