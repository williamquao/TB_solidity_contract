// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ERC-6909.sol";
import "./tb_interface.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract TBImpl is Ownable, ERC6909, ITB_impl, ReentrancyGuard {
    event BondCreated(
        address indexed bondMinter,
        string name,
        uint32 maturityDate,
        uint bondId
    );
    event TransferWithdrawal(
        address indexed sender,
        address indexed receiver,
        uint bondId,
        uint amount
    );
    event BondMinterReplacement(uint bondId, address indexed newMinter);
    event MintRemoval(uint bondId, address indexed newMinter, uint amount);
    event IsBondPaused(uint bondId, bool isPaused);
    event IsBondInterTransferAllowed(uint bondId, bool isTransferable);
    event BondTransferedAmongUsers(
        address indexed sender,
        address indexed receiver,
        uint amount
    );

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
        address minter;
    }

    mapping(uint => Bond) public Bonds;
    mapping(uint => DepositWithdrawal[]) public BondDepositWithdraws;
    mapping(address => uint[]) public minterBonds;
    mapping(uint => bool) public bondIsPaused;
    mapping(uint => bool) public bondInterTransfer;

    modifier notMatured(uint _bondId) {
        require(
            block.timestamp < Bonds[_bondId].maturityDate,
            "Bond is matured"
        );
        _;
    }

    modifier notPaused(uint _bondId) {
        require(!bondIsPaused[_bondId], "Bond is paused");
        _;
    }

    modifier bondExist(uint _bondId) {
        require(Bonds[_bondId].minter != address(0), "Bond doesn't exist");
        _;
    }

    modifier isMinter(uint _bondId) {
        require(Bonds[_bondId].minter == msg.sender, "Is not minter");
        _;
    }

    //Create bond and generate its respective token and mint bond balance to miner
    function createBond(
        uint _initialSupply,
        uint32 _maturityDate,
        string memory _name,
        address _minter
    ) external override onlyOwner returns (uint) {
        uint bondId = uint(
            keccak256((abi.encodePacked(_name, _initialSupply, _maturityDate)))
        );
        require(Bonds[bondId].initialSupply == 0, "Bond already exist");
        require(
            _minter != address(0) && _initialSupply > 0,
            "Address is invalid and Supply below 0"
        );
        require(
            _maturityDate > block.timestamp,
            "Maturity date must be above current time"
        );

        _mint(_minter, bondId, _initialSupply);
        Bonds[bondId] = Bond(_maturityDate, _initialSupply, _name, _minter);
        minterBonds[_minter].push(bondId);
        emit BondCreated(_minter, _name, _maturityDate, bondId);
        return bondId;
    }

    // minter call this function to transfer bond token to users equivalent to amount of bond purchased
    function deposit(
        uint _bondId,
        uint _amount,
        address _user
    )
        public
        bondExist(_bondId)
        isMinter(_bondId)
        notPaused(_bondId)
        notMatured(_bondId)
        nonReentrant
    {
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        BondDepositWithdraws[_bondId].push(
            DepositWithdrawal(
                _amount,
                block.timestamp,
                msg.sender,
                _user,
                Status.DEPOSIT
            )
        );
        bool success = transfer(_user, _bondId, _amount);
        require(success, "Transfer failed");
        emit TransferWithdrawal(msg.sender, _user, _bondId, _amount);
    }

    // minter can do a bulk deposit to max 20 users
    function depositBulk(
        DepositWithdrawalParams[20] calldata deposits
    ) external override {
        for (uint256 i = 0; i < deposits.length; i++) {
            uint256 bondId = deposits[i].bondId;
            uint256 amount = deposits[i].amount;
            address user = deposits[i].user;

            deposit(bondId, amount, user);
        }
    }

    // users can withdraw, that is they send their bond tokens back to the minter of the specific bond
    function withdraw(
        uint _bondId,
        uint _amount
    ) external bondExist(_bondId) notPaused(_bondId) nonReentrant {
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        //user approves contract to transfer a specific amount of bond token from it's wallet
        console.log("sender :", msg.sender);
        require(
            approve(address(this), _bondId, _amount),
            "Transfer approval failed"
        );
        require(
            transfer(Bonds[_bondId].minter, _bondId, _amount),
            "Transfer failed"
        );

        BondDepositWithdraws[_bondId].push(
            DepositWithdrawal(
                _amount,
                block.timestamp,
                msg.sender,
                Bonds[_bondId].minter,
                Status.WITHDRAW
            )
        );

        emit TransferWithdrawal(
            msg.sender,
            Bonds[_bondId].minter,
            _bondId,
            _amount
        );
    }

    // only Owner can update the minter of a specific bond
    function updateBondMinter(
        uint _bondId,
        address _newMinter
    ) public onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(_newMinter != address(0), "Address is invalid");
        address prevMinter = Bonds[_bondId].minter;
        require(prevMinter != _newMinter, "Already current minter");
        console.log("minter: ", prevMinter, balanceOf[prevMinter][_bondId]);

        Bonds[_bondId].minter = _newMinter;
        // mint previous minter balance to new minter and burn previous minter balance
        _mint(_newMinter, _bondId, balanceOf[prevMinter][_bondId]);
        console.log("minter111: ", prevMinter, balanceOf[prevMinter][_bondId]);
        _burn(prevMinter, _bondId, balanceOf[prevMinter][_bondId]);
        emit BondMinterReplacement(_bondId, _newMinter);
    }

    // only Owner can remove the minter of a specific bond
    function removeMint(
        uint _bondId
    ) external override onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(
            block.timestamp > Bonds[_bondId].maturityDate,
            "Mint is linked to an active bond"
        );
        address minter = Bonds[_bondId].minter;
        //burn removed minter bond tokens
        _burn(minter, _bondId, balanceOf[minter][_bondId]);
        Bonds[_bondId].minter = address(0);
        emit MintRemoval(_bondId, minter, balanceOf[minter][_bondId]);
    }

    //replace minters in bulk with respect to associated bond
    function replaceMintBulk(
        ReplaceMintParams[20] calldata mints
    ) external override onlyOwner {
        for (uint256 i = 0; i < mints.length; i++) {
            uint bondId = mints[i].bondId;
            address newMinter = mints[i].newMinter;
            updateBondMinter(bondId, newMinter);
        }
    }

    // freeze all activities of a specific bond
    function pauseBond(
        uint _bondId
    ) external override onlyOwner bondExist(_bondId) notPaused(_bondId) {
        bondIsPaused[_bondId] = true;
        emit IsBondPaused(_bondId, bondIsPaused[_bondId]);
    }

    // resume all activities of a specific bond
    function resumeBond(
        uint _bondId
    ) external override onlyOwner bondExist(_bondId) {
        require(bondIsPaused[_bondId], "Bond not paused");
        bondIsPaused[_bondId] = false;
        emit IsBondPaused(_bondId, bondIsPaused[_bondId]);
    }

    // permit users to transfer a specific bond among themselves
    function enableInterTransfer(
        uint _bondId
    ) external override onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(!bondInterTransfer[_bondId], "Already enabled");
        bondInterTransfer[_bondId] = true;
        emit IsBondInterTransferAllowed(_bondId, bondInterTransfer[_bondId]);
    }

    // prevent users from transfering a specific bond among themselves
    function disableInterTransfer(
        uint _bondId
    ) external override onlyOwner bondExist(_bondId) notPaused(_bondId) {
        require(bondInterTransfer[_bondId], "Already disabled");
        bondInterTransfer[_bondId] = false;
        emit IsBondInterTransferAllowed(_bondId, bondInterTransfer[_bondId]);
    }

    // user transfer bond among themselves
    function transferBondAmongUsers(
        uint _bondId,
        uint _amount,
        address _receiver
    )
        external
        override
        bondExist(_bondId)
        notPaused(_bondId)
        notMatured(_bondId)
    {
        require(bondInterTransfer[_bondId], "Bond is not transferable");
        require(
            balanceOf[msg.sender][_bondId] >= _amount,
            "Insufficient balance"
        );
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        require(transfer(_receiver, _bondId, _amount), "Transfer failed");
        emit BondTransferedAmongUsers(msg.sender, _receiver, _amount);
    }
}
