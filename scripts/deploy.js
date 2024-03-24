const hre = require("hardhat");
const { network, run, ethers } = hre;

async function main() {
  let contract_owner = await ethers.getSigners();
  const dsgdContract = await ethers.deployContract("DSGDToken", [], contract_owner[0]);

  await dsgdContract.waitForDeployment();
  console.log(`DSGD Token is deployed to ${dsgdContract.target} by ${contract_owner[0].address}`);

  const dmyrContract = await ethers.deployContract("DMYRToken", [], contract_owner[1]);


  await dmyrContract.waitForDeployment();
  console.log(`DMYR Token is deployed to ${dmyrContract.target} by ${contract_owner[1].address}`);

  const mCBDCContract = await ethers.deployContract("MCBDC", [], contract_owner[2]);


  await mCBDCContract.waitForDeployment();
  console.log(`MCBDC is deployed to ${mCBDCContract.target} by ${contract_owner[2].address}`);

  const VoucherContract = await ethers.deployContract("VoucherContract", [mCBDCContract.target], contract_owner[3]);


  await VoucherContract.waitForDeployment();
  console.log(`VoucherContract is deployed to ${VoucherContract.target} by ${contract_owner[3].address}`);

  const ECommerceContract = await ethers.deployContract("ECommerce", [mCBDCContract.target, VoucherContract.target], contract_owner[3]);

  await ECommerceContract.waitForDeployment();
  console.log(`ECommerce is deployed to ${ECommerceContract.target} by ${contract_owner[3].address}`);

  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(dsgdContract.target, [], "contracts/DSGDToken.sol:DSGDToken");
    await verifyContract(dmyrContract.target, [], "contracts/DMYRToken.sol:DMYRToken");
    await verifyContract(mCBDCContract.target, [], "contracts/MCBDC.sol:MCBDC");
    await verifyContract(VoucherContract.target, [mCBDCContract.target], "contracts/Voucher.sol:VoucherContract");
    await verifyContract(ECommerceContract.target, [mCBDCContract.target, VoucherContract.target], "contracts/ECommerce.sol:ECommerce");
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
