import React, { useState, useEffect } from "react";
import { Card, Modal, InputNumber, Input, Dropdown, Space, Menu } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { sepolia } from "@wagmi/chains";
import { usePrepareContractWrite, useContractWrite, useWaitForTransaction } from "wagmi";
import { tokenConfig, getLabelByKey, getContractABIByKey, getContractAddressByKey, getContractOwnerByKey } from "./tokenConfig";
import MCBDCABI from "../ABI/MCBDC.json";

function CurrentBalance({ address, sgd, myr, getBalance, selectedCurrency, setSelectedCurrency, getHistory }) {
  const [transferModal, setTransferModal] = useState(false);
  const [mintModal, setMintModal] = useState(false);
  const [burnModal, setBurnModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState("");
  const [mintAmount, setMintAmount] = useState(null);
  const [burnAmount, setBurnAmount] = useState(null);
  const [transferAmount, setTransferAmount] = useState(null);
  const [message, setMessage] = useState("");
  const items = tokenConfig;

  const BalanceDropdown = ({ sgd, myr, selectedCurrency, onCurrencyChange }) => {
    const onClick = ({ key }) => {
      onCurrencyChange(key);
    };

    const menu = (
      <Menu onClick={onClick}>
        {items.map(item => (
          <Menu.Item key={item.key}>{item.label}</Menu.Item>
        ))}
      </Menu>
    );

    return (
      <Dropdown overlay={menu} trigger={['click']}>
        <a style={{ color: "black" }} onClick={(e) => e.preventDefault()}>
          <Space>
            {selectedCurrency === '1' && (
              <div style={{ lineHeight: "70px" }}>{(sgd !== "..." ? Number(sgd).toFixed(2) : sgd)} </div>
            )}
            {selectedCurrency === '2' && (
              <div style={{ lineHeight: "70px" }}>{(myr !== "..." ? Number(myr).toFixed(2) : myr)} </div>
            )}
            <div style={{ fontSize: "20px" }}>
              {selectedCurrency === '1' ? 'DSGD' : 'DMYR'}
              <DownOutlined />
            </div>
          </Space>
        </a>
      </Dropdown>
    );
  };

  const { config: configTransfer } = usePrepareContractWrite({
    chainId: sepolia.id,
    address: process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS,
    abi: MCBDCABI,
    functionName: "localTransfer",
    args: [transferAddress, String(transferAmount * (1e18)), getLabelByKey(selectedCurrency).slice(1,), message, false, "0x0000000000000000000000000000000000000000"],
  });

  const { write: writeTransfer, data: dataTransfer } = useContractWrite(configTransfer);

  const { config: configMint } = usePrepareContractWrite({
    chainId: sepolia.id,
    address: getContractAddressByKey(selectedCurrency),
    abi: getContractABIByKey(selectedCurrency),
    functionName: "mint",
    args: [address, String(mintAmount * (1e18))],
  });

  const { write: writeMint, data: dataMint } = useContractWrite(configMint);

  console.log(address, String(burnAmount), getContractAddressByKey(selectedCurrency))
  const { config: configBurn } = usePrepareContractWrite({
    chainId: sepolia.id,
    address: getContractAddressByKey(selectedCurrency),
    abi: getContractABIByKey(selectedCurrency),
    functionName: "burn",
    args: [address, String(burnAmount * (1e18))],
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
    getBalance();
    getHistory();
    if (isSuccessMint || isSuccessTransfer || isSuccessBurn) {
      getBalance();
      getHistory();
      hideMintModal();
      hideTransferModal();
      hideBurnModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessMint, isSuccessTransfer, isSuccessBurn])


  return (
    <Card title="Current Balance" style={{ width: "100%" }}>
      <div className="currentBalance">
        <BalanceDropdown
          sgd={sgd}
          myr={myr}
          selectedCurrency={selectedCurrency}
          onCurrencyChange={setSelectedCurrency}
        />
      </div>
      <div className="balanceOptions">
        <Modal
          title="Transfer Tokens"
          open={transferModal}
          onOk={() => {
            if (transferAmount <= 0  || transferAmount > (selectedCurrency === '1' ? sgd : myr) || address==="" || transferAmount===null|| message.length<=0) {
              alert("Please fill up the input fields!")
              return;
            }
            writeTransfer?.();
          }
          }
          confirmLoading={isLoadingTransfer}
          onCancel={hideTransferModal}
          okText="Transfer"
          cancelText="Cancel"
          cancelButtonProps={{ disabled: isLoadingTransfer }}
          closable={false}
          okButtonProps={{ disabled: address.length===0 || transferAmount===null || message.length===0 || address === transferAddress }}
        >
          <p><span style={{ color: "red" }}>*</span>Amount <strong>({getLabelByKey(selectedCurrency)})</strong></p>
          <InputNumber placeholder="0.01" min={0.01} value={transferAmount} onChange={(val) => setTransferAmount(val)} required={true} />
          <p><span style={{ color: "red" }}>*</span>To (address)</p>
          <Input placeholder="0x..." value={transferAddress} onChange={(val) => setTransferAddress(val.target.value)} required={true} />
          {transferAddress === address && (
            <p style={{ color: 'red' }}>You cannot transfer token to your own address.</p>
          )}
          <p><span style={{ color: "red" }}>*</span>Message</p>
          <Input required={true} placeholder="Send 1 DSGD..." value={message} onChange={(val) => setMessage(val.target.value)} />

        </Modal>

        <div className="extraOption" onClick={showTransferModal}>Local Transfer</div>
        {address === getContractOwnerByKey(selectedCurrency) && (
          <>
            <div className="extraOption" onClick={() => {
              showMintModal();
            }}>Mint</div>
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
              closable={false}
              cancelButtonProps={{ disabled: isLoadingMint }}
              okButtonProps={{ disabled: mintAmount <= 0 }}
            >
              <p><span style={{ color: "red" }}>*</span>Amount ({getLabelByKey(selectedCurrency)})</p>
              <InputNumber min={0.01} placeholder={0.01} value={mintAmount} onChange={(val) => setMintAmount(val)} />
            </Modal>

            <div className="extraOption" onClick={() => {
              showBurnModal();
            }}>Burn</div>
            <Modal
              title="Burn Tokens"
              open={burnModal}
              onCancel={hideBurnModal}
              okText="Burn"
              confirmLoading={isLoadingBurn}
              cancelText="Cancel"
              onOk={() => {
                if (burnAmount > (selectedCurrency === '1' ? sgd : myr)) {
                  alert("Insufficient balance");
                  return;
                }
                console.log(burnAmount);
                writeBurn();
              }
              }
              closable={false}
              cancelButtonProps={{ disabled: isLoadingBurn }}
              okButtonProps={{ disabled: burnAmount <= 0 }}
            >
              <p><span style={{ color: "red" }}>*</span>Amount ({getLabelByKey(selectedCurrency)})</p>
              <InputNumber min={0.01} placeholder={0.01} step={0.01} value={burnAmount} onChange={(val) => setBurnAmount(val)} />
            </Modal>
          </>
        )}
      </div>
    </Card>
  );
}

export default CurrentBalance;

