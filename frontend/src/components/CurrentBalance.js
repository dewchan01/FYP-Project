import React, { useState, useEffect } from "react";
import { Card, Modal, InputNumber, Input } from "antd";
import { polygonMumbai } from "@wagmi/chains";
import DSGDTokenABI from "../DSGDToken.json";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";

function CurrentBalance({ address, dollars, getNameAndBalance }) {
  const [transferModal, setTransferModal] = useState(false);
  const [mintModal, setMintModal] = useState(false);
  const [burnModal, setBurnModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [mintAmount, setMintAmount] = useState(5);
  const [burnAmount, setBurnAmount] = useState(5);
  const [transferAmount, setTransferAmount] = useState(5);

  const { config: configTransfer } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_DSGD_CONTRACT_ADDRESS,
    abi: DSGDTokenABI,
    functionName: "transfer",
    args: [transferAddress, String(transferAmount * (1e18))],
  });

  const { write: writeTransfer, data: dataTransfer } = useContractWrite(configTransfer);

  const { config: configMint } = usePrepareContractWrite({
    chainId: polygonMumbai.id,
    address: process.env.REACT_APP_DSGD_CONTRACT_ADDRESS,
    abi: DSGDTokenABI,
    functionName: "mint",
    args: [address, String(mintAmount * (1e18))],
  });

  const { write: writeMint, data: dataMint } = useContractWrite(configMint);

  const { config: configBurn } = usePrepareContractWrite({
    chainId: process.env.REACT_APP_DSGD_CONTRACT_ADDRESS,
    abi: DSGDTokenABI,
    functionName: "burn",
    args: [String(burnAmount * (1e18))],
  });

  const { write: writeBurn, data: dataBurn } = useContractWrite(configBurn);

  const { isLoading: isLoadingMint, isSuccess: isSuccessMint } = useWaitForTransaction({
    hash: dataMint?.hash,
  })

  const { isLoading: isLoadingTransfer, isSuccess: isSuccessTransfer } = useWaitForTransaction({
    hash: dataTransfer?.hash,
  })

  const { isLoading: isLoadingBurn, isSuccess: isSuccessBurn } = useWaitForTransaction({
    hash: dataBurn?.hash,
  })

  const showTransferModal = () => {
    setTransferModal(true);
  };
  const hideTransferModal = () => {
    setTransferModal(false);
  };
  const showMintModal = () => {
    setMintModal(true);
  };
  const hideMintModal = () => {
    setMintModal(false);
  };
  const showBurnModal = () => {
    setBurnModal(true);
  };
  const hideBurnModal = () => {
    setBurnModal(false);
  };

  useEffect(() => {
    if (isSuccessMint || isSuccessTransfer || isSuccessBurn) {
      getNameAndBalance();
      hideMintModal();
      hideTransferModal();
      hideBurnModal();
      //prompt tx is successful
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessMint,isSuccessTransfer,isSuccessBurn])


  return (
    <Card title="Current Balance" style={{ width: "100%" }}>
      <div className="currentBalance">
        <div style={{ lineHeight: "70px" }}>{dollars} DSGD </div>
        <div style={{ fontSize: "20px" }}>Available</div>
      </div>
      <div className="balanceOptions">
        <Modal
          title="Transfer Tokens"
          open={transferModal}
          onOk={() => {
            if (transferAmount > 0 && address !== transferAddress && transferAmount <= dollars) {
              writeTransfer?.();
            }
          }
          }
          confirmLoading={isLoadingTransfer}
          onCancel={hideTransferModal}
          okText="Transfer"
          cancelText="Cancel"
        >
          <p>Amount (DSGD)</p>
          <InputNumber value={transferAmount} onChange={(val) => setTransferAmount(val)} />
          <p>To (address)</p>
          <Input placeholder="0x..." value={transferAddress} onChange={(val) => setTransferAddress(val.target.value)} />
          {transferAddress === address && (
            <p style={{ color: 'red' }}>You cannot transfer token to your own address.</p>
          )}
        </Modal>
        <div className="extraOption" onClick={showTransferModal}>Transfer Tokens</div>
        {address === process.env.REACT_APP_DSGD_CONTRACT_OWNER && (
          <>
            <div className="extraOption" onClick={() => {
              showMintModal();
            }}>Mint Tokens</div>
            <Modal
              title="Mint Tokens"
              open={mintModal}
              onOk={() => {
                if (mintAmount > 0) {
                  writeMint?.();
                }
              }
              }
              onCancel={hideMintModal}
              okText="Mint"
              confirmLoading={isLoadingMint}
              cancelText="Cancel"
            >
              <p>Amount (DSGD)</p>
              <InputNumber value={mintAmount} onChange={(val) => setMintAmount(val)} />
            </Modal>
            <div className="extraOption" onClick={() => {
              showBurnModal();
            }}>Burn Tokens</div>
            <Modal
              title="Burn Tokens"
              open={burnModal}
              onOk={() => {
                if (burnAmount <= dollars) {
                  writeBurn?.();
                }
              }
              }
              onCancel={hideBurnModal}
              okText="Burn"
              confirmLoading={isLoadingBurn}
              cancelText="Cancel"
            >
              <p>Amount (DSGD)</p>
              <InputNumber value={burnAmount} onChange={(val) => setBurnAmount(val)} />
            </Modal>
          </>
        )}
      </div>
    </Card>
  );
}

export default CurrentBalance;