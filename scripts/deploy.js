const hre = require("hardhat");
const { network, run, ethers } = hre;

async function main() {
  // Deploy the DSGDToken contract
  const DSGDToken = await ethers.getContractFactory("DSGDToken");
  let [contract_owner] = await ethers.getSigners();
  const dsgdContract = await DSGDToken.connect(contract_owner).deploy();

  await dsgdContract.deployed();
  console.log(`DSGD Token is deployed to ${dsgdContract.address} by ${contract_owner.address}`);

  // Deploy the Payment contract
  const Payment = await ethers.getContractFactory("Payment");
  const paymentContract = await Payment.deploy(dsgdContract.address);

  await paymentContract.deployed();
  console.log(`Payment contract is deployed to ${paymentContract.address}`);

  // Verify the DSGDToken contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(dsgdContract.address, []);
  }

  // Verify the Payment contract
  if (network.name !== "localhost" && network.name !== "hardhat") {
    await verifyContract(paymentContract.address, [dsgdContract.address]);
  }
}

async function verifyContract(address, args) {
  try {
    await run("verify:verify", {
      address,
      constructorArguments: args,
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
