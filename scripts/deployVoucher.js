const hre = require("hardhat");
const { network, run, ethers } = hre;
require("dotenv").config();

async function main() {
  let contract_owner = await ethers.getSigners();

  const VoucherContract = await ethers.deployContract("VoucherContract", [process.env.MCBDC_CONTRACT_ADDRESS], contract_owner[3]);

  await VoucherContract.waitForDeployment();
  console.log(`VoucherContract is deployed to ${VoucherContract.target} by ${contract_owner[3].address}`);

  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(VoucherContract.target, [process.env.MCBDC_CONTRACT_ADDRESS], "contracts/Voucher.sol:VoucherContract");
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
