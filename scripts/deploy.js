const hre = require("hardhat");
const { network, run, ethers } = hre;

async function main() {
  let contract_owner = await ethers.getSigners();

  // Deploy the DSGDToken contract
  const DSGDToken = await ethers.getContractFactory("DSGDToken");
  const dsgdContract = await DSGDToken.connect(contract_owner[0]).deploy();

  await dsgdContract.deployed();
  console.log(`DSGD Token is deployed to ${dsgdContract.address} by ${contract_owner[0].address}`);

  // Deploy the DMYRToken contract
  const DMYRToken = await ethers.getContractFactory("DMYRToken");
  const dmyrContract = await DMYRToken.connect(contract_owner[1]).deploy();

  await dmyrContract.deployed();
  console.log(`DMYR Token is deployed to ${dmyrContract.address} by ${contract_owner[1].address}`);

  // Deploy the mCBDC contract
  const mCBDC = await ethers.getContractFactory("MCBDC");
  const mCBDCContract = await mCBDC.connect(contract_owner[2]).deploy();

  await mCBDCContract.deployed();
  console.log(`MCBDC is deployed to ${mCBDCContract.address} by ${contract_owner[2].address}`);

  // Verify the DSGDToken contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(dsgdContract.address, [], "contracts/DSGDToken.sol:DSGDToken");
  }

  // Verify the DMYRToken contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(dmyrContract.address, [], "contracts/DMYRToken.sol:DMYRToken");
  }

  // Verify the mCBDC contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(mCBDCContract.address, [], "contracts/MCBDC.sol:MCBDC");
  }
}

async function verifyContract(address, args, contractPath) {
  try {
    await run("verify:verify", {
      address,
      constructorArguments: args,
      contract: contractPath,
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Contract already verified!");
    } else {
      console.log(e);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
