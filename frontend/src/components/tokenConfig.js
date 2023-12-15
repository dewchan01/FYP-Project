import DSGDTokenABI from "../ABI/DSGDToken.json";
import DMYRTokenABI from "../ABI/DMYRToken.json";

export const tokenConfig = [
  {
    label: 'DSGD',
    key: '1',
    contractAddress: process.env.REACT_APP_DSGD_CONTRACT_ADDRESS,
    contractOwner: process.env.REACT_APP_DSGD_CONTRACT_OWNER,
    ABI: DSGDTokenABI,
  },
  {
    label: 'DMYR',
    key: '2',
    contractAddress: process.env.REACT_APP_DMYR_CONTRACT_ADDRESS,
    contractOwner: process.env.REACT_APP_DMYR_CONTRACT_OWNER,
    ABI: DMYRTokenABI,
  }
];

export const getLabelByKey = (key) => {
  const item = tokenConfig.find(item => item.key === key);
  return item ? item.label : null;
}

export const getContractAddressByKey = (key) => {
  const item = tokenConfig.find(item => item.key === key);
  return item ? item.contractAddress : null;
}

export const getContractOwnerByKey = (key) => {
  const item = tokenConfig.find(item => item.key === key);
  return item ? item.contractOwner : null;
}

export const getContractABIByKey = (key) => {
  const item = tokenConfig.find(item => item.key === key);
  return item ? item.ABI : null;
}
