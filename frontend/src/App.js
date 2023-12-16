import { useState, useEffect } from "react";
import "./App.css";
import logo from "./logo.svg";
import { Layout, Button } from "antd";
import CurrencyStatus from "./components/CurrencyStatus";
import AccountDetails from "./components/AccountDetails";
import RecentActivity from "./components/RecentActivity";
import { useConnect, useAccount, useDisconnect } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import axios from "axios";

const { Header, Content } = Layout;

function App() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
  });

  const [balance, setBalance] = useState("...");
  const [sgd, setSGD] = useState("...");
  const [myr, setMYR] = useState("...");
  const [history, setHistory] = useState(null);
  const [requests, setRequests] = useState({"0":[],"1":[],"2":[],"3":[],"4":[],"5":[]});
  const [balanceOfLink, setBalanceOfLink] = useState("...");
  const [rate, setFXRate] = useState("...");
  const [isFXRateResponseValid, setIsFXRateAvailable] = useState(false);
  const [expiringTime, setExpiringTime] = useState("...");
  const [tokenSymbol,setTokenSymbol] = useState("...");
  const [tokenAddress, setTokenAddress] = useState(null);

  function disconnectAndSetNull() {
    disconnect();
    setBalance("...");
    setSGD("...");
    setMYR("...");
    setHistory(null);
    setRequests(null);
    setTokenAddress(null);
    setExpiringTime(0);
  }

  function checkAccount(){
    if (window.ethereum) {
      const ethereum = window.ethereum;
    
      // Add an event listener to detect account changes
      ethereum.on('accountsChanged', (accounts) => {
        // `accounts` is an array of the current accounts
        const newAccount = accounts[0];
        // Handle the account change here
        console.log('MetaMask account changed to:', newAccount);
    
        // You can perform any actions or updates in response to the account change here
        // For example, call your `getNameAndBalance` function
        disconnectAndSetNull();
      });
    }
  }
  async function getBalance() {
    const res = await axios.get(`http://localhost:3001/getBalance`, {
      params: { userAddress: address },
    });

    const response = res.data;
    console.log(response);
    
    setBalance(String(response.balance));
    setSGD(String(response.sgd));
    setMYR(String(response.myr));
    
    checkAccount();
  }

  async function getHistory() {
    const res = await axios.get(`http://localhost:3001/getHistory`, {
      params: { userAddress: address },
    });

    const response = res.data;
    setHistory(response.history[0]);
    // console.log("History",response.history[0])

    checkAccount();
  }

  async function getRequests() {
    const res = await axios.get(`http://localhost:3001/getRequests`, {
      params: { userAddress: address },
    });
    let response;
    if (res== null){
      response = {}
    }else{
      response = res.data;
    }
    console.log(response);
    setRequests(response);

    checkAccount();
  }

  async function getBalanceOfLink(){
    const res = await axios.get(`http://localhost:3001/getBalanceOfLink`);
    const response = res.data;
    console.log(response);

    setBalanceOfLink(String(response.balance));
    checkAccount();
  }

  async function getFXRate(){
    const res = await axios.get(`http://localhost:3001/getFXRate`);
    const response = res.data;
    console.log(response);

    setFXRate(String(response.rate));
    setExpiringTime(String(response.expiringTime));
    setIsFXRateAvailable(response.availableStatus);

    checkAccount();
  }

  async function showTokenAddress(){
    const res = await axios.get(`http://localhost:3001/showTokenAddress`, {
      params: { token: tokenSymbol },
  });
    const response = res.data;
    console.log(response);

    setTokenSymbol(String(response.tokenSymbol));
    setTokenAddress(String(response.tokenAddress));

    checkAccount();
  }

  useEffect(() => {
    if (!isConnected) return;
    getBalance();
    getHistory();
    getRequests();
    getFXRate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <div className="App">
      <Layout>
        <Header className="header">
          <div className="headerLeft">
            <img src={logo} alt="logo" className="logo" />
            {isConnected && (
              <>
                <div
                  className="menuOption"
                  style={{ borderBottom: "1.5px solid black" }}
                >
                  Summary
                </div>
                <div className="menuOption">Activity</div>
                <div className="menuOption">{`Send & Request`}</div>
                <div className="menuOption">Wallet</div>
                <div className="menuOption">Help</div>
              </>
            )}
          </div>
          {isConnected ? (
            <Button type={"primary"} onClick={disconnectAndSetNull}>
              Disconnect Wallet
            </Button>
          ) : (
            <Button type={"primary"} onClick={()=>{
              console.log(requests); connect();
            }}>
              Connect Wallet
            </Button>
          )}
        </Header>
        <Content className="content">
          {isConnected ? (
            <>
              <div className="firstColumn">
                <CurrencyStatus sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate}/>
                <AccountDetails
                  address={address}
                  balance={balance}
                />
              </div>
              <div className="secondColumn">
                <RecentActivity history={history} address={address}/>
              </div>
            </>
          ) : (
            <div>Please Login</div>
          )}
        </Content>
      </Layout>
    </div>
  );
}

export default App;
