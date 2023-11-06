import React, { useState, useEffect } from "react";
import { DollarOutlined, SwapOutlined } from "@ant-design/icons";
import { Modal, Input, InputNumber } from "antd";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { polygonMumbai } from "@wagmi/chains";
import PaymentABI from "../Payment.json";
import DSGDTokenABI from "../DSGDToken.json";

function RequestAndPay({ requests, getNameAndBalance, address }) {

  const [payModal, setPayModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [requestAmount, setRequestAmount] = useState(5);
  const [requestAddress, setRequestAddress] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  // console.log(getNameAndBalance);

  const { config } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: "0x45aC5d28bd2a83E62F8132D958047027CC93a91c",
    abi: PaymentABI,
    functionName: "payRequest",
    args: [0],
    // overrides: {
    //   value: String(Number(requests["1"][0])),
    // },
  });

  const { write, data } = useContractWrite(config);

  const { config: configRequest } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: "0x45aC5d28bd2a83E62F8132D958047027CC93a91c",
    abi: PaymentABI,
    functionName: "createRequest",
    args: [requestAddress, String(requestAmount * (10 ** 18)), requestMessage],
  });

  const { write: writeRequest, data: dataRequest } = useContractWrite(configRequest);

  const { config: configApprove } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: "0x5a02b2051203c2baFb143F5B396A8b7D46Ecc022",
    abi: DSGDTokenABI,
    functionName: "approve",
    args: ["0x45aC5d28bd2a83E62F8132D958047027CC93a91c", String(Number(requests["1"][0]))],
  });

  const { write: writeApprove, data: dataApprove } = useContractWrite(configApprove);

  const { isLoading,isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const { isLoading:isLoadingRequest, isSuccess: isSuccessRequest } = useWaitForTransaction({
    hash: dataRequest?.hash,
  })

  const { isLoading:isLoadingApprove, isSuccess: isSuccessApprove } = useWaitForTransaction({
    hash: dataApprove?.hash,
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

  useEffect(() => {
    if (isSuccess || isSuccessRequest) {
      getNameAndBalance();
      hidePayModal();
      hideRequestModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, isSuccessRequest, isSuccessApprove])

  return (
    <>
      <Modal
        title="Confirm Payment"
        open={payModal}
        onOk={() => {
          if(!isSuccessApprove){
          writeApprove()
          }
          if(isSuccessApprove){
          write?.();
          }
        }}
        confirmLoading={isLoadingApprove || isLoading}
        onCancel={hidePayModal}
        okText={!isSuccessApprove ? "Approved to Pay" : "Proceed To Pay"} // Change the text based on isSuccessApprove
        cancelText="Cancel"
      >
        {requests && requests["0"].length > 0 && (
          <>
            <h2>Sending payment to {requests["3"][0]}</h2>
            <h3>Value: {requests["1"][0] / 1e18} DSGD</h3>
            <p>"{requests["2"][0]}"</p>
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
        <p>Amount (DSGD)</p>
        <InputNumber value={requestAmount} onChange={(val) => setRequestAmount(val)}/>
        <p>From (address)</p>
        <Input placeholder="0x..." value={requestAddress} onChange={(val) => setRequestAddress(val.target.value)}/>
        {requestAddress === address && (
          <p style={{ color: 'red' }}>You cannot request payment from your own address.</p>
        )}
        <p>Message</p>
        <Input placeholder="Lunch Bill..." value={requestMessage} onChange={(val) => setRequestMessage(val.target.value)}/>
      </Modal>

      <div className="requestAndPay">
        <div
          className={`quickOption ${requests && requests["0"].length > 0 ? "quickOption" : "quickOption-disabled"}`}
          onClick={() => {
            if (requests && requests["0"].length > 0) {
              showPayModal();
            }
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