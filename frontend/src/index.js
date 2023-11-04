import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { configureChains,createClient, WagmiConfig  } from 'wagmi';
import { mainnet, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';

const { chains, provider } = configureChains(
  [mainnet, polygonMumbai],
  [alchemyProvider({ apiKey: process.env.REACT_APP_ALCHEMY_API_KEY  }),
  publicProvider(),
]
);

const client = createClient({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  provider,
});


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <WagmiConfig client={client}>
        <App />
    </WagmiConfig>
  </React.StrictMode>
);