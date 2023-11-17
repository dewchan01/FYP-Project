import React, { useState,useEffect } from "react";
import { Modal,Card,Input } from "antd";
import { usePrepareContractWrite, useContractWrite,useWaitForTransaction  } from "wagmi";
import { UserOutlined } from "@ant-design/icons";
import { polygonMumbai } from "@wagmi/chains";
import matic from "../matic.png";
import ABI from "../Payment.json";

function AccountDetails({ address, name, balance,getNameAndBalance }) {
  const [username, setUsername] = useState(""); // Add this state variable
  const [usernameModal, setUsernameModal] = useState(false); // Modal state

  const { config } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_PAYMENT_CONTRACT_ADDRESS,
    abi: ABI,
    functionName: "addName",
    args: [username],
  });

  const { write, data } = useContractWrite(config);

  const { isLoading,isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const showUsernameModal = () => {
    setUsernameModal(true);
  };
  const hideUsernameModal = () => {
    setUsernameModal(false);
  };

  useEffect(()=>{
    if(isSuccess){
      getNameAndBalance();
      hideUsernameModal();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isSuccess])

  return (
    <Card title="Account Details" style={{ width: "100%" }}>
      <div className="accountDetailRow">
        <UserOutlined style={{ color: "#767676", fontSize: "25px" }} />
        <div>
          <div className="accountDetailHead"> {name} </div>
          <div className="accountDetailBody">
            {" "}
            Address: {address.slice(0, 4)}...{address.slice(38)}
          </div>
        </div>
      </div>
      <div className="accountDetailRow">
        <img src={matic} alt="maticLogo" width={25} />
        <div>
          <div className="accountDetailHead"> Native Matic Tokens</div>
          <div className="accountDetailBody">{balance} Matic</div>
        </div>
      </div>
      <div className="balanceOptions">
        <div className="extraOption" onClick={() => showUsernameModal()}>Set Username</div>
        {/* <div className="extraOption">Switch Accounts</div> */}
      </div>

      <Modal
        title="Set Username"
        open={usernameModal}
        onOk={() => {
          write?.();
        }}
        confirmLoading={isLoading}
        onCancel={hideUsernameModal}
      >
        <Input
          placeholder="Enter your new username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </Modal>
    </Card>
  );
}

export default AccountDetails;