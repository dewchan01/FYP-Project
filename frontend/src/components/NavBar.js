import { Spin, Button } from 'antd';
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const CurrencyStatus = lazy(() => import("./CurrencyStatus"));
const AccountDetails = lazy(() => import("./AccountDetails"));
const RecentActivity = lazy(() => import("./RecentActivity"));
const Shopping = lazy(() => import("./Shopping"));
const Help = lazy(() => import("./Help"));

function NavBar({ sgd, myr, address, getBalance, requests, rate, isFXRateResponseValid, expiringTime, getFXRate, getHistory, getRequests, balance, history, lastLoginDate }) {
  return (
    <div>
      <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}><Spin size="large" /></div>}>
        <Routes>
          <Route path="/" element={<div></div>}></Route>
          <Route path="/acc" element={<AccountDetails address={address} balance={balance} lastLoginDate={lastLoginDate} />}></Route>
          <Route path="/activity" element={<RecentActivity history={history} address={address} />}></Route>
          <Route path="/sendAndRequest" element={<CurrencyStatus sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory} getRequests={getRequests} />}></Route>
          <Route path="/shopping" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory} getRequests={getRequests} />}></Route>
          <Route path="/shopping/products" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory} getRequests={getRequests} />}></Route>
          <Route path="/shopping/orders" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory} getRequests={getRequests} />}></Route>
          <Route path="/shopping/seller" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory} getRequests={getRequests} />}></Route>
          <Route path="/shopping/vouchers" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory} getRequests={getRequests} />}></Route>
          <Route path="/shopping/sign-up" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance} requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid} expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory} getRequests={getRequests} />}></Route>
          <Route path="/help" element={<Help address={address}/>}></Route>
          <Route path="*" element={
            <div style={{ fontWeight: "bold", fontSize: "1.5rem", textAlign: "center", backgroundColor: "white" }}>
              404 Not Found
              <br/>
              <br/>
              <Button  type="primary" href="mailto:deweichan@gmail.com?subject=Report%20on%20404%20error%20on%20Blockchain%20Wallet%20Application">
                Report this issue
              </Button>
            </div>
          }></Route>

        </Routes>
      </Suspense>
    </div>
  );
}

export default NavBar;