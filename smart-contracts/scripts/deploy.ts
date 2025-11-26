const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy EBTApplication
  const EBTApplication = await ethers.getContractFactory("EBTApplication");
  const ebtApplication = await EBTApplication.deploy();
  await ebtApplication.deployed();

  // Deploy FoodStamps
  const FoodStamps = await ethers.getContractFactory("FoodStamps");
  const foodStamps = await FoodStamps.deploy();
  await foodStamps.deployed();

  // Deploy ERC6551Registry
  const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
  const erc6551Registry = await ERC6551Registry.deploy();
  await erc6551Registry.deployed();

  // Deploy ERC6551Account
  const ERC6551Account = await ethers.getContractFactory("ERC6551Account");
  const erc6551Account = await ERC6551Account.deploy(erc6551Registry.address);
  await erc6551Account.deployed();

  // Deploy EBTProgram
  const EBTProgram = await ethers.getContractFactory("EBTProgram");
  const ebtProgram = await EBTProgram.deploy(ebtApplication.address, foodStamps.address, erc6551Registry.address);
  await ebtProgram.deployed();

  // Execute additional contract setups
  await erc6551Registry.setImplementation(ebtProgram.address);
  await erc6551Registry.setTokenContract(foodStamps.address);
  await foodStamps.setEBTProgram(ebtProgram.address);
  await ebtApplication.setProgramAsAdmin(ebtProgram.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
