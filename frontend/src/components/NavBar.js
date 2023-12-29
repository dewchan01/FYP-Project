import { Routes, Route } from 'react-router-dom';
import CurrencyStatus from "./CurrencyStatus";
import AccountDetails from "./AccountDetails";
import RecentActivity from "./RecentActivity";
import Shopping from "./Shopping";

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
      </Routes >
    </div >
    );
}

export default NavBar;