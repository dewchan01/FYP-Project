import React, { useState, useEffect } from "react";
import { DollarOutlined, SwapOutlined } from "@ant-design/icons";
import { Modal, Input, InputNumber } from "antd";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction  } from "wagmi";
import { polygonMumbai } from "wagmi/chains";
import ABI from "../Payment.json";

function RequestAndPay({ requests, getNameAndBalance }) {

  const [payModal, setPayModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState(5);
  const [requestAddress, setRequestAddress] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  console.log(requests);

  const { config } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: "0x45aC5d28bd2a83E62F8132D958047027CC93a91c",
    abi: ABI,
    functionName: "payRequest",
    args: [0],
    overrides: {
      value: String(Number(requests["1"][0] * 1e18)),
    },
  });

  const { write, data } = useContractWrite(config);

  const { config: configRequest } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: "0x45aC5d28bd2a83E62F8132D958047027CC93a91c",
    abi: ABI,
    functionName: "createRequest",
    args: [requestAddress, requestAmount, requestMessage],
  });

  const { write: writeRequest, data: dataRequest } = useContractWrite(configRequest);


  const { isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const { isSuccess: isSuccessRequest } = useWaitForTransaction({
    hash: dataRequest?.hash,
  })


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

  useEffect(()=>{
    if(isSuccess || isSuccessRequest){
      getNameAndBalance();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isSuccess, isSuccessRequest])

  return (
    <>
      <Modal
        title="Confirm Payment"
        open={payModal}
        onOk={() => {
          write?.();
          hidePayModal();
        }}
        onCancel={hidePayModal}
        okText="Proceed To Pay"
        cancelText="Cancel"
      >
        {requests && requests["0"].length > 0 && (
          <>
            <h2>Sending payment to {requests["3"][0]}</h2>
            <h3>Value: {requests["1"][0]/1e18} DSGD</h3>
            <p>"{requests["2"][0]}"</p>
          </>
        )}
      </Modal>
      <Modal
        title="Request A Payment"
        open={requestModal}
        onOk={() => {
          writeRequest?.();
          hideRequestModal();
        }}
        onCancel={hideRequestModal}
        okText="Proceed To Request"
        cancelText="Cancel"
      >
        <p>Amount (DSGD)</p>
        <InputNumber value={requestAmount} onChange={(val)=>setRequestAmount(val*1e18)}/>
        <p>From (address)</p>
        <Input placeholder="0x..." value={requestAddress} onChange={(val)=>setRequestAddress(val.target.value)}/>
        <p>Message</p>
        <Input placeholder="Lunch Bill..." value={requestMessage} onChange={(val)=>setRequestMessage(val.target.value)}/>
      </Modal>
      <div className="requestAndPay">
        <div
          className="quickOption"
          onClick={() => {
            showPayModal();
          }}
        >
          <DollarOutlined style={{ fontSize: "26px" }} />
          Pay
          {requests && requests["0"].length > 0 && (
            <div className="numReqs">{requests["0"].length}</div>
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