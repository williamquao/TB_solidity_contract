// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "./TB_tokens.sol";
import "./ITB.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


contract TBImpl is Ownable, ReentrancyGuard, ITB_impl {

    event BondCreated(address indexed tokenAddress, address indexed bondMinter, string name, uint32 maturityDate, uint bondId);
    event TransferWithdrawal(address indexed tokenAddress, address indexed sender, address indexed receiver, uint amount);
    event BondMinterReplacement(uint bondId, address indexed newMinter);
    event MintRemoval(uint bondId, address indexed newMinter, uint amount);
    event IsBondPaused(uint bondId, bool isPaused);
    event IsBondInterTransferAllowed(uint bondId, bool isTransferable);
    event BondTransferedAmongUsers(address indexed sender, address indexed receiver, uint _amount);
    
    uint public constant unitPrice = 1000;

    enum Status {
        DEPOSIT,
        WITHDRAW
    }

    struct DepositWithdrawal {
        uint amountSent;
        uint timestamp;
        address senderAddress;
        address receiverAddress;
        Status status;
    }

    struct Bond {
        uint32 maturityDate;
        uint initialSupply;
        string name;
        string symbol;
        address tokenAddress;
        address minter;
    }


    mapping (uint => Bond) public Bonds;
    mapping (uint => DepositWithdrawal[]) public BondDepositWithdraws;
    mapping (address => uint[]) public minterBonds;
    mapping (uint => bool) public bondIsPaused;
    mapping (uint => bool) public bondInterTransfer;

    modifier notMatured(uint _bondId) {
        require(block.timestamp < Bonds[_bondId].maturityDate, "Bond has matured");
        _;
    }

    modifier notPaused(uint _bondId){
        require(!bondIsPaused[_bondId], "Bond is paused");
        _;
    }

    modifier bondExist(uint _bondId){
        require(Bonds[_bondId].tokenAddress != address(0), "Bond doesn't exist");
        _;
    }

    modifier isMinter(uint _bondId){
        require(Bonds[_bondId].minter == msg.sender, "Is not minter");
        _;
    }

    //Create bond and generate its respective token and mint bond balance to miner
    function createBond(uint _initialSupply, uint32 _maturityDate, string memory _name, string memory _symbol, address _minter) external override onlyOwner returns(uint, address){
        uint bondId = uint(keccak256((abi.encodePacked(_name, _symbol, _initialSupply, _maturityDate))));
        require(Bonds[bondId].initialSupply == 0, "Bond already exist");
        require(_minter != address(0) && _initialSupply > 0, "Address is invalid and Supply below 0");
        require(_maturityDate > block.timestamp, "Maturity date must be above current time");

        TBTokens token = new TBTokens(_name, _symbol, _initialSupply, bondId, _minter);
        Bonds[bondId] = Bond(_maturityDate, _initialSupply, _name, _symbol, address(token), _minter);
        emit BondCreated(address(token), _minter, _name, _maturityDate, bondId);
        return (bondId, address(token));

    }

    // minter call this function to transfer bond token to users equivalent to amount of bond purchased
    function deposit(uint _bondId, uint _amount, address _user) public bondExist(_bondId) isMinter(_bondId) notPaused(_bondId) notMatured(_bondId) nonReentrant {
        require(_amount >= unitPrice && _amount % unitPrice == 0, "Amount must be in multiples of unit price");
        BondDepositWithdraws[_bondId].push(DepositWithdrawal(_amount, block.timestamp, msg.sender, _user, Status.DEPOSIT));
        (bool success) = _bondToken(_bondId).transferToken(msg.sender, _user, _getAmountWei(_amount));
        require(success, "Transfer failed");
        emit TransferWithdrawal(address(_bondToken(_bondId)), msg.sender, _user, _amount);
    }

    // minter can do a bulk deposit to max 20 users
    function depositBulk(DepositWithdrawalParams[20] calldata deposits) external override {
        for (uint256 i = 0; i < deposits.length; i++) {
            uint256 bondId = deposits[i].bondId;
            uint256 amount = deposits[i].amount;
            address user = deposits[i].user;

            deposit(bondId, amount, user);
        }
    }

    // users can withdraw, that is they send their bond tokens back to the minter of the specific bond
    function withdraw(uint _bondId, uint _amount) external override  bondExist(_bondId) notPaused(_bondId) nonReentrant {
         require(_amount >= unitPrice && _amount % unitPrice == 0, "Amount must be in multiples of unit price");
         //user approves contract to transfer a specific amount of bond token from it's wallet
         console.log("sender.  :", msg.sender);
         require(_bondToken(_bondId).approveTokenUsage(msg.sender, address(this), _getAmountWei(_amount)), "Transfer approval failed");
         require(_bondToken(_bondId).transferFrom(msg.sender, Bonds[_bondId].minter, _getAmountWei(_amount)), "Transfer failed");

         BondDepositWithdraws[_bondId].push(DepositWithdrawal(_amount, block.timestamp, msg.sender, Bonds[_bondId].minter, Status.WITHDRAW));

         emit TransferWithdrawal(address(_bondToken(_bondId)), msg.sender, Bonds[_bondId].minter, _amount);
    }

    // only Owner can update the minter of a specific bond
    function updateBondMinter(uint _bondId, address _newMinter) public onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(_newMinter != address(0), "Address is invalid");
        address prevMinter = Bonds[_bondId].minter;
        require(prevMinter != _newMinter, "Already current minter");
        console.log("minter: ", prevMinter, _bondToken(_bondId).balanceOf(prevMinter));

        Bonds[_bondId].minter = _newMinter;
        // mint previous minter balance to new minter and burn previous minter balance
        mint(_bondId, _bondToken(_bondId).balanceOf(prevMinter));
        console.log("minter: ", prevMinter, _bondToken(_bondId).balanceOf(prevMinter));
        burn(_bondId, _bondToken(_bondId).balanceOf(prevMinter), prevMinter);
        emit BondMinterReplacement(_bondId, _newMinter);
    }

    // only Owner can remove the minter of a specific bond
    function removeMint(uint _bondId) external override  onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(block.timestamp > Bonds[_bondId].maturityDate, "Mint is linked to an active bond");
        address minter = Bonds[_bondId].minter;
        //burn removed minter bond tokens
        burn(_bondId, _bondToken(_bondId).balanceOf(minter), minter);
        Bonds[_bondId].minter = address(0);
        emit MintRemoval(_bondId, minter, _bondToken(_bondId).balanceOf(minter));
    }

    //return the token of a specific bond based on bond id
    function _bondToken(uint _bondId) internal view bondExist(_bondId) returns (TBTokens) {
        return TBTokens(Bonds[_bondId].tokenAddress);
    }

    function mint(uint _bondId, uint _amount) public onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(_amount > 0, "Amount must be greater than 0");
        _bondToken(_bondId).mint(Bonds[_bondId].minter, _amount);
    }
 
    //burn a specific bond token amount from minter balance
    function burn(uint _bondId, uint _amount, address _minter) public onlyOwner bondExist(_bondId) notPaused(_bondId){
        console.log("aaaaa: ", _bondToken(_bondId).balanceOf(_minter),_amount);
        require(_bondToken(_bondId).balanceOf(_minter) >= _amount, "Insufficient amount to burn");
        (bool success) = _bondToken(_bondId).burn(_minter, _amount);
        require(success, "Burn operation failed");
    }

    //replace minters in bulk with respect to associated bond
    function replaceMintBulk(ReplaceMintParams[20] calldata mints) external override  onlyOwner {
        for (uint256 i = 0; i < mints.length; i++) {
            uint bondId = mints[i].bondId;
            address newMinter = mints[i].newMinter;
            updateBondMinter(bondId, newMinter);
        }
    }

     // freeze all activities of a specific bond
    function pauseBond(uint _bondId) external override onlyOwner bondExist(_bondId) notPaused(_bondId) {
        bondIsPaused[_bondId] = true;
        emit IsBondPaused(_bondId,  bondIsPaused[_bondId]);
    }

    // resume all activities of a specific bond
    function resumeBond(uint _bondId) external override onlyOwner bondExist(_bondId) {
        require(bondIsPaused[_bondId], "Bond not paused");
        bondIsPaused[_bondId] = false;
        emit IsBondPaused(_bondId,  bondIsPaused[_bondId]);
    }

    // permit users to transfer a specific bond among themselves
    function enableInterTransfer(uint _bondId) external override onlyOwner bondExist(_bondId) notPaused(_bondId) {
            require(!bondInterTransfer[_bondId], "Already enabled");
            bondInterTransfer[_bondId] = true;
            emit IsBondInterTransferAllowed(_bondId,  bondInterTransfer[_bondId]);
    }

    // prevent users from transfering a specific bond among themselves
    function disableInterTransfer(uint _bondId) external onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(bondInterTransfer[_bondId], "Already disabled");
        bondInterTransfer[_bondId] = false;
        emit IsBondInterTransferAllowed(_bondId,  bondInterTransfer[_bondId]);

    }
    
    // user transfer bond among themselves
    function transferBondAmongUsers(uint _bondId, uint _amount, address _receiver) external override bondExist(_bondId) notPaused(_bondId) notMatured(_bondId) {
        require( bondInterTransfer[_bondId], "Bond is not transferable");
        require(_bondToken(_bondId).balanceOf(msg.sender) >= _getAmountWei(_amount), "Insufficient balance");
        require(_amount >= unitPrice && _amount % unitPrice == 0, "Amount must be in multiples of unit price");
        require(_bondToken(_bondId).transferToken(msg.sender, _receiver, _getAmountWei(_amount)), "Transfer failed");
        emit BondTransferedAmongUsers(msg.sender, _receiver, _amount);
    }

    function _getAmountWei(uint _amount) pure internal returns (uint){
        return _amount * 1e18;
    }

    function getBalanceByBond(uint _bondId, address _user) external view returns(uint){
        require(_user != address(0), "Address is invalid");
        return _bondToken(_bondId).balanceOf(_user);
    }


}
