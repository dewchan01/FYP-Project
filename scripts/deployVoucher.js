const hre = require("hardhat");
const { network, run, ethers } = hre;
require("dotenv").config();

async function main() {
  let contract_owner = await ethers.getSigners();

  // Deploy the mCBDC contract
  const Voucher = await ethers.getContractFactory("VoucherContract");
  const VoucherContract= await Voucher.connect(contract_owner[3]).deploy(process.env.MCBDC_CONTRACT_ADDRESS);

  await VoucherContract.deployed();
  console.log(`VoucherContract is deployed to ${VoucherContract.address} by ${contract_owner[3].address}`);

  // Verify the ECommerceContract contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(VoucherContract.address, [process.env.VOUCHER_CONTRACT_ADDRESS], "contracts/Voucher.sol:VoucherContract");
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
