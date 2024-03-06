import { Routes, Route } from 'react-router-dom';
import CurrencyStatus from "./CurrencyStatus";
import AccountDetails from "./AccountDetails";
import RecentActivity from "./RecentActivity";
import Shopping from "./Shopping";
import Help from "./Help";

function NavBar({ sgd, myr, address, getBalance,
  requests, rate, isFXRateResponseValid,
  expiringTime, getFXRate, getHistory,
  getRequests, balance, history }) {
  return (
    <div>
      <Routes>
        <Route path="/"></Route>
        <Route path="/acc"
          element={<AccountDetails
            address={address}
            balance={balance} />}></Route>
        <Route path="/activity" element={<RecentActivity history={history} address={address} />}></Route>
        <Route path="/sendAndRequest" element={<CurrencyStatus sgd={sgd} myr={myr} address={address} getBalance={getBalance}
          requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
          expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
          getRequests={getRequests} />}></Route>
        <Route path="/shopping" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance}
          requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
          expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
          getRequests={getRequests} />}>
        </Route>
        <Route path="/shopping/products" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance}
          requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
          expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
          getRequests={getRequests} />}>
        </Route>
        <Route path="/shopping/orders" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance}
          requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
          expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
          getRequests={getRequests} />}>
        </Route>
        <Route path="/shopping/seller" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance}
          requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
          expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
          getRequests={getRequests} />}>
        </Route>
        <Route path="/shopping/vouchers" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance}
          requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
          expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
          getRequests={getRequests} />}>
        </Route>
        <Route path="/shopping/sign-up" element={<Shopping sgd={sgd} myr={myr} address={address} getBalance={getBalance}
          requests={requests} rate={rate} isFXRateResponseValid={isFXRateResponseValid}
          expiringTime={expiringTime} getFXRate={getFXRate} getHistory={getHistory}
          getRequests={getRequests} />}>
        </Route>
        <Route path='/help' element={<Help />}></Route>
        <Route path="*" element={<div style={{ fontWeight: "bold", fontSize: "1.5rem", textAlign: "center", backgroundColor: "white" }}>404 Not Found</div>}></Route>
      </Routes >
    </div >
  );
}

export default NavBar;