import { useState, useEffect } from "react";
import "./App.css";
import logo from "./logo.svg";
import { Layout, Button, Menu, Alert } from "antd";
import Marquee from 'react-fast-marquee';
import CurrencyStatus from "./components/CurrencyStatus";
import AccountDetails from "./components/AccountDetails";
import RecentActivity from "./components/RecentActivity";
import { useConnect, useAccount, useDisconnect, useContractRead } from "wagmi";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
import { useNavigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import axios from "axios";
import LINK_TOKEN_ABI from "./ABI/LINKTOKEN.json";
import apiUrl from "./apiConfig";
import ReactPlayer from "react-player";
import VisitedCount from "./components/VisitedCount";

const { Header, Content } = Layout;

function App() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const baseURL = apiUrl();
  const { connect } = useConnect({
    connector: new MetaMaskConnector(),
    onError: (error) => {
      alert(` Wallet Connection Error: ${error.message}`);
    },
    onSuccess: () => {
      const res = axios.post(baseURL + "/db", { address, time: new Date() });
      if (res.status === 200) {
        console.log("Data inserted successfully");
      } else {
        console.error("Error when inserting data to db:", res.statusText);
      }
      getLastAccessDate();
    }
  });


  const LINK_CONTRACT_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const [balance, setBalance] = useState("...");
  const [sgd, setSGD] = useState("...");
  const [myr, setMYR] = useState("...");
  const [history, setHistory] = useState(null);
  const [requests, setRequests] = useState(null);
  const [rate, setFXRate] = useState("...");
  const [isFXRateResponseValid, setIsFXRateAvailable] = useState(false);
  const [expiringTime, setExpiringTime] = useState("...");
  const [, setTokenAddress] = useState(null);
  const [lastLoginDate, setLastLoginDate] = useState(null);

  function disconnectAndSetNull() {
    disconnect();
    setBalance("...");
    setSGD("...");
    setMYR("...");
    setHistory(null);
    setRequests(null);
    setTokenAddress(null);
    setExpiringTime(0);
    window.location.href = "/";    
  }

  function checkAccount() {
    if (window.ethereum) {
      const ethereum = window.ethereum;

      ethereum.on('accountsChanged', (accounts) => {
        const newAccount = accounts[0];
        console.log('MetaMask account changed to:', newAccount);
        disconnectAndSetNull();
      });
    }
  }

  async function getLastAccessDate() {
    const res = await axios.get(`${baseURL}/user_last_log_in`, {
      params: { userAddress: address },
    });
    setLastLoginDate(res.data.time);
  }
  async function getBalance() {
    const res = await axios.get(`${baseURL}/getBalance`, {
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
    const res = await axios.get(`${baseURL}/getHistory`, {
      params: { userAddress: address },
    });

    const response = res.data;
    setHistory(response.history);
    checkAccount();
  }

  async function getRequests() {
    const res = await axios.get(`${baseURL}/getRequests`, {
      params: { userAddress: address },
    });
    let response;
    if (res.data == null) {
      response = {}
    } else {
      response = res.data;
    }
    console.log(response);
    setRequests(response);

    checkAccount();
  }

  async function getFXRate() {
    const res = await axios.get(`${baseURL}/getFXRate`);
    const response = res.data;
    console.log(response);

    setFXRate(String(response.rate));
    setExpiringTime(String(response.expiringTime));
    setIsFXRateAvailable(response.availableStatus);

    checkAccount();
  }

  const BalanceOfLINKToken = () => {
    const { data: readData, isLoading: readLoading } = useContractRead({
      address: LINK_CONTRACT_ADDRESS,
      abi: LINK_TOKEN_ABI,
      functionName: 'balanceOf',
      args: [process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS],
    });

    if (readLoading) return <Alert banner>Loading...</Alert>

    return (
      <div>
        {readData && window.location.pathname === "/" && (
          <Alert
            banner
            message={
              <Marquee pauseOnHover gradient={false}>
                <span> Contribute to fund MCBDC Contract LINK TOKEN for requesting FX rate. Current MCBDC Contract ({process.env.REACT_APP_MCBDC_CONTRACT_ADDRESS}) has {(readData) / 1e18} LINK. At least 0.1 LINK Token to support request FX rate. <a href="https://sepolia.etherscan.io/token/0x779877A7B0D9E8603169DdbD7836e478b4624789#writeContract#F6" target="blank">Fund here by transferring LINK Token to MCBDC Contract.</a></span>
              </Marquee>
            }
          />
        )}
      </div>
    );
  }
  const navigate = useNavigate();

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
        <Header className="header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}>
          <div className="headerLeft">
            <a href="/" style={{ display: "flex", alignItems: "center" }} ><img src={logo} alt="logo" className="logo" /></a>
            {isConnected && (
              <>
                <Menu
                  className="menuOption"
                  mode="horizontal"
                  defaultSelectedKeys={[window.location.pathname]}
                  onClick={({ key }) => {
                    navigate(key);
                  }
                  }
                  items={[
                    { key: "/", label: "Wallet" },
                    { key: "/acc", label: "Account" },
                    { key: "/activity", label: "Activity" },
                    { key: "/sendAndRequest", label: "Send & Request" },
                    { key: "/shopping", label: "Shopping" },
                    { key: "/help", label: "Help" },
                  ]}
                />
              </>
            )}

          </div>
          {! isConnected && window.location.pathname === "/" && (<VisitedCount/>)}
          {isConnected ? (
            <Button type={"primary"} onClick={disconnectAndSetNull}>
              Disconnect Wallet
            </Button>
          ) : (
            <Button type={"primary"} onClick={async () => {
              try {
                await connect();
                console.log("Connected successfully!");
              } catch (error) {
                  console.error("Error when inserting data to db:", error.message);
              }
            }}>
              Connect Wallet
            </Button>
          )}
        </Header>
        <div>
          <NavBar style={{ display: "block" }}
            sgd={sgd} myr={myr} address={address} getBalance={getBalance}
            requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
            expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
            getRequests={getRequests} balance={balance} history={history} lastLoginDate={lastLoginDate} />
        </div>
        <BalanceOfLINKToken />
        <Content className="content">
          {isConnected && window.location.pathname === "/" ? (
            <>

              <div className="firstColumn">
                <CurrencyStatus
                  sgd={sgd} myr={myr} address={address} getBalance={getBalance}
                  requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
                  expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
                  getRequests={getRequests} />
                <AccountDetails
                  address={address}
                  balance={balance}
                  lastLoginDate={lastLoginDate}
                />

              </div>
              <div className="secondColumn">
                <RecentActivity history={history} address={address} />
              </div>
            </>
          ) : (!isConnected && window.location.pathname === "/") ?
            <div><p style={{ fontWeight: "bold", fontSize: "1.5rem" }}>Please Connect Your MetaMask Wallet !</p>
              <Alert showIcon type="error" message="Access is restricted solely to the MetaMask Extension configured with the Ethereum Sepolia Network and Alchemy RPC URL for web browsers."></Alert>
              <br />
              <Alert showIcon type="warning" message="Please take note this wallet app does not give any warranties and will not be liable for any loss, direct or indirect through continued use of this feature."></Alert>
              <p><br />Disclamers:
                <ol>
                  <li>E-Commerce Contract in <a target="blank" href="https://medium.datadriveninvestor.com/creating-shopping-smartcontract-f7f80add48c4">this article</a> is improved in this wallet app.</li>
                  <li>The structure of Voucher Contract is improved from <a href="https://github.com/opengovsg/cbdc-smart-contracts/tree/master" target="blank">this repo</a>.</li>
                  <li>Front-end is referred to <a href="https://youtu.be/IwfIxAJiNiw" target="blank">this video</a> to improve.</li>
                </ol>
              </p>All rights of other resources are reserved to <a target="blank" href="https://github.com/dewchan01">this developer</a>. Your feedback is welcome.<br />
              <br /><ReactPlayer controls="true" url="https://youtu.be/fdhfVwJP334"/>

            </div>
            : <div></div>
          }
        </Content>
      </Layout>
    </div>
  );
}



export default App;
