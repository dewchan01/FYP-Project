const hre = require("hardhat");
const { network, run, ethers } = hre;
require("dotenv").config();

async function main() {
  let contract_owner = await ethers.getSigners();

  // Deploy the mCBDC contract
  const ECommerce = await ethers.getContractFactory("ECommerce");
  const ECommerceContract = await ECommerce.connect(contract_owner[2]).deploy(process.env.MCBDC_CONTRACT_ADDRESS);

  await ECommerceContract.deployed();
  console.log(`ECommerce is deployed to ${ECommerceContract.address} by ${contract_owner[2].address}`);

  // Verify the ECommerceContract contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(ECommerceContract.address, [process.env.MCBDC_CONTRACT_ADDRESS], "contracts/ECommerce.sol:ECommerce");
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
