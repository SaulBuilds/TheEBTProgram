const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const { expect } = chai;

let ebtApplication, ebtProgram, foodStamps, erc6551Registry, erc6551Account;
let deployer, user, admin;

describe("EBT Program", function () {
  before(async function () {
    [deployer, user, admin] = await ethers.getSigners();

    const EBTApplication = await ethers.getContractFactory("EBTApplication");
    ebtApplication = await EBTApplication.connect(deployer).deploy();
    await ebtApplication.deployed();

    const FoodStamps = await ethers.getContractFactory("FoodStamps");
    foodStamps = await FoodStamps.connect(deployer).deploy();
    await foodStamps.deployed();

    const ERC6551Registry = await ethers.getContractFactory("ERC6551Registry");
    erc6551Registry = await ERC6551Registry.connect(deployer).deploy();
    await erc6551Registry.deployed();

    const ERC6551Account = await ethers.getContractFactory("ERC6551Account");
    erc6551Account = await ERC6551Account.connect(deployer).deploy(erc6551Registry.address);
    await erc6551Account.deployed();

    const EBTProgram = await ethers.getContractFactory("EBTProgram");
    ebtProgram = await EBTProgram.connect(deployer).deploy(ebtApplication.address, foodStamps.address, erc6551Registry.address);
    await ebtProgram.deployed();

    await erc6551Registry.connect(deployer).setImplementation(ebtProgram.address);
    await erc6551Registry.connect(deployer).setTokenContract(foodStamps.address);
    await foodStamps.connect(deployer).setEBTProgram(ebtProgram.address);
    await ebtApplication.connect(deployer).setProgramAsAdmin(ebtProgram.address);
  });

  it("allows users to apply for EBTProgram", async function () {
    await ebtApplication.connect(user).apply4EBT("test_user", "test_url", "test_twitter", 100, "test_id");

    const isApplicant = await ebtApplication.doesUserIdExist("test_id");
    expect(isApplicant).to.be.true;
  });

  it("allows admin to approve users", async function () {
    await ebtApplication.connect(deployer).approveUsers(["test_id"]);

    const isApproved = await ebtApplication.isUserApproved("test_id");
    expect(isApproved).to.be.true;
  });
  
  it("doesn't allow users to approve themselves", async function () {
    await expect(ebtApplication.connect(user).approveUsers(["test_id"]).catch((err) => {throw err.message;}))
      .to.eventually.be.rejectedWith("Caller is not an admin");
  });
  
  it("doesn't allow users to approve other users", async function () {
    // "user" is a non-admin account
    await expect(ebtApplication.connect(user).approveUsers(["userID1", "userID2"]).catch((err) => {throw err.message;}))
      .to.eventually.be.rejectedWith("Caller is not an admin");
  });

  it("allows approved users to mint tokens by paying the correct price", async function () {
    const mintPrice = ethers.utils.parseEther(".02"); // Replace "1" with the actual mint price
   
    const initialContractBalance = await ethers.provider.getBalance(ebtProgram.address);
    // User pays for the mint
    const mintTx = await ebtProgram.connect(user).mint("test_id", { value: ethers.utils.parseEther(".02") });
    const mintReceipt = await mintTx.wait();

    // Get the final balance of the contract
    const finalContractBalance = await ethers.provider.getBalance(ebtProgram.address);

    // Check if 0.02 ether was added to the contract's balance
    expect(finalContractBalance).to.equal(initialContractBalance.add(ethers.utils.parseEther(".02")));
      
    // Check if the minting process is successful, for example by checking if a token was minted
    const newTokenId = await ebtProgram.currentTokenId() - 1;
    const owner = await ebtProgram.ownerOf(newTokenId);
    expect(owner).to.equal(user.address);
  
    // Check if the appropriate amount of FoodStamps was minted for the user
    const accountAddress = await erc6551Registry.getAccount(user.address, ebtProgram.address, newTokenId);
    const foodStampsBalance = await foodStamps.balanceOf(accountAddress);
    expect(foodStampsBalance).to.equal(ethers.utils.parseEther("200000"));
  
    // Check if the appropriate amount of ether was deducted from the user's balance
    const newBalance = await user.getBalance();
    expect(newBalance.add(mintPrice)).to.equal(initialBalance.sub(mintReceipt.gasUsed.mul(mintReceipt.effectiveGasPrice)));
  });
});