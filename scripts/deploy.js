const hre = require("hardhat");
const { network, run, ethers } = hre;

async function main() {
  let contract_owner = await ethers.getSigners();

  // Deploy the DSGDToken contract
  // const DSGDToken = await ethers.getContractFactory("DSGDToken");
  // const dsgdContract = await DSGDToken.connect(contract_owner[0]).deploy();
  const dsgdContract = await ethers.deployContract("DSGDToken", [],contract_owner[0]);


  await dsgdContract.waitForDeployment();
  console.log(`DSGD Token is deployed to ${dsgdContract.target} by ${contract_owner[0].address}`);

  // Deploy the DMYRToken contract
  // const DMYRToken = await ethers.getContractFactory("DMYRToken");
  // const dmyrContract = await DMYRToken.connect(contract_owner[1]).deploy();
  const dmyrContract = await ethers.deployContract("DMYRToken", [],contract_owner[1]);


  await dmyrContract.waitForDeployment();
  console.log(`DMYR Token is deployed to ${dmyrContract.target} by ${contract_owner[1].address}`);

  // Deploy the mCBDC contract
  // const mCBDC = await ethers.getContractFactory("MCBDC");
  // const mCBDCContract = await mCBDC.connect(contract_owner[2]).deploy();
  const mCBDCContract = await ethers.deployContract("MCBDC", [],contract_owner[2]);


  await mCBDCContract.waitForDeployment();
  console.log(`MCBDC is deployed to ${mCBDCContract.target} by ${contract_owner[2].address}`);

  // const Voucher = await ethers.getContractFactory("VoucherContract");
  // const VoucherContract= await Voucher.connect(contract_owner[3]).deploy(mCBDCContract.address);
  const VoucherContract = await ethers.deployContract("VoucherContract", [mCBDCContract.target],contract_owner[3]);


  await VoucherContract.waitForDeployment();
  console.log(`VoucherContract is deployed to ${VoucherContract.target} by ${contract_owner[3].address}`);

  // const ECommerce = await ethers.getContractFactory("ECommerce");
  // const ECommerceContract = await ECommerce.connect(contract_owner[3]).deploy(mCBDCContract.address,VoucherContract.address);
  const ECommerceContract = await ethers.deployContract("ECommerce", [mCBDCContract.target,VoucherContract.target],contract_owner[3]);

  await ECommerceContract.waitForDeployment();
  console.log(`ECommerce is deployed to ${ECommerceContract.target} by ${contract_owner[3].address}`);

  // Verify the DSGDToken contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(dsgdContract.target, [], "contracts/DSGDToken.sol:DSGDToken");
    await verifyContract(dmyrContract.target, [], "contracts/DMYRToken.sol:DMYRToken");
    await verifyContract(mCBDCContract.target, [], "contracts/MCBDC.sol:MCBDC");
    await verifyContract(VoucherContract.target, [mCBDCContract.target], "contracts/Voucher.sol:VoucherContract");
    await verifyContract(ECommerceContract.target, [mCBDCContract.target,VoucherContract.target], "contracts/ECommerce.sol:ECommerce");
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
