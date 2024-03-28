// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./ERC-6909.sol";
// import "./tb_interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TBImpl is Ownable, ERC6909 {
    event BondCreated(
        address indexed bondMinter,
        uint32 interestRate,
        uint32 indexed maturityDate,
        uint indexed initialSupply,
        uint bondId
    );
    event TransferWithdrawal(
        address indexed sender,
        address indexed receiver,
        uint bondId,
        uint amount,
        Status indexed status
    );
    event BondMinterReplacement(uint indexed bondId, address indexed newMinter);
    event MintRemoval(
        uint indexed bondId,
        address indexed newMinter,
        uint amount
    );
    event IsBondPaused(uint bondId, bool isPaused);
    event IsBondInterTransferAllowed(uint bondId, bool isTransferable);
    event BondTransferedAmongUsers(
        address indexed sender,
        address indexed receiver,
        uint amount
    );

    uint public constant unitPrice = 1000;
    bool public isContractPaused;

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

    struct TransferParam {
        uint tokenId;
        uint amount;
        address sender;
        address receiver;
    }

    // struct transferParam {
    //     address sender;
    //     DepositWithdrawalParams[] transferDestination;
    // }

    struct Token {
        uint32 expirationDate;
        uint32 interestRate;
        address minter;
        bool minterIsOperator;
        bool tokenFrozen;
        bool tokenItrPaused;
        bool tokenItrExpiryPaused;
    }

    struct minterToken {
        uint tokensMinted;
        uint tokenId;
    }

    mapping(uint => Token) public TokenMetadata;
    mapping(uint => DepositWithdrawal[]) public BondDepositWithdraws;
    mapping(address => minterToken[]) public minterTokensMetadata;

    modifier notMatured(uint _tokenId) {
        require(
            block.timestamp < TokenMetadata[_tokenId].expirationDate,
            "token is mature"
        );
        _;
    }

    modifier bondExist(uint _tokenId) {
        require(
            TokenMetadata[_tokenId].expirationDate != 0,
            "token does not exist"
        );
        _;
    }

    modifier isInputListValid(uint _length) {
        require(_length <= 15, "Deposit list should not be above 15");
        _;
    }

    //----------------------------------------------------------------------------
    // Contract execution pause/resume
    //----------------------------------------------------------------------------

    //Pause contract execution
    function pause() external onlyOwner {
        require(!isContractPaused, "contract is already paused");
        isContractPaused = true;
    }

    //Resume contract execution
    function resume() external onlyOwner {
        require(isContractPaused, "contract is already resumed");
        isContractPaused = false;
    }

    modifier notPausedContract() {
        require(!isContractPaused, "Contract is paused");
        _;
    }

    //----------------------------------------------------------------
    // INTER TRANSFER PAUSE AND RESUME
    //----------------------------------------------------------------
    // permit users to transfer a specific bond among themselves
    function resumeInterTransfer(
        uint _tokenId
    ) external onlyOwner bondExist(_tokenId) {
        require(
            TokenMetadata[_tokenId].tokenItrPaused,
            "InterTransfer is not paused"
        );
        TokenMetadata[_tokenId].tokenItrPaused = false;
        emit IsBondInterTransferAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrPaused
        );
    }

    // prevent users from transfering a specific bond among themselves
    function pauseInterTransfer(
        uint _tokenId
    ) external onlyOwner bondExist(_tokenId) {
        require(
            !TokenMetadata[_tokenId].tokenItrPaused,
            "InterTransfer is already paused"
        );
        TokenMetadata[_tokenId].tokenItrPaused = true;
        emit IsBondInterTransferAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrPaused
        );
    }

    modifier interTransferNotPaused(uint _tokenId) {
        require(
            !TokenMetadata[_tokenId].tokenItrPaused,
            "Intertransfer is paused for token"
        );
        _;
    }

    //----------------------------------------------------------------
    // INTER TRANSFER AFTER EXPIRY PAUSE AND RESUME
    //----------------------------------------------------------------

    function resumeItrAfterExpiry(
        uint _tokenId
    ) external onlyOwner bondExist(_tokenId) {
        require(
            TokenMetadata[_tokenId].tokenItrExpiryPaused,
            "InterTransfer after expiry is not paused"
        );
        TokenMetadata[_tokenId].tokenItrExpiryPaused = false;
        emit IsBondInterTransferAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrExpiryPaused
        );
    }

    function pauseItrAfterExpiry(
        uint _tokenId
    ) external onlyOwner bondExist(_tokenId) {
        require(
            !TokenMetadata[_tokenId].tokenItrExpiryPaused,
            "InterTransfer after expiry is already paused"
        );
        TokenMetadata[_tokenId].tokenItrExpiryPaused = true;
        emit IsBondInterTransferAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrExpiryPaused
        );
    }

    modifier interTransferAfterExpiryNotPaused(uint _tokenId) {
        require(
            !TokenMetadata[_tokenId].tokenItrExpiryPaused,
            "Intertransfer after token expiry is paused for token"
        );
        _;
    }

    //----------------------------------------------------------------
    // MINTER IS OPERATOR
    //----------------------------------------------------------------
    function setMinterAsOperator(uint _tokenId) external onlyOwner {
        require(
            !TokenMetadata[_tokenId].minterIsOperator,
            "Minter is already operator"
        );
        TokenMetadata[_tokenId].minterIsOperator = true;
    }

    function unsetMinterAsOperator(uint _tokenId) external onlyOwner {
        require(
            TokenMetadata[_tokenId].minterIsOperator,
            "Minter is not operator"
        );
        TokenMetadata[_tokenId].minterIsOperator = false;
    }

    //----------------------------------------------------------------
    // FREEZE TRANSFER OF TOKEN
    //----------------------------------------------------------------
    function freezeToken(uint _tokenId) external onlyOwner {
        require(!TokenMetadata[_tokenId].tokenFrozen, "Token already frozen");
        TokenMetadata[_tokenId].tokenFrozen = true;
    }

    function unfreezeToken(uint _tokenId) external onlyOwner {
        require(TokenMetadata[_tokenId].tokenFrozen, "Token not frozen");
        TokenMetadata[_tokenId].tokenFrozen = false;
    }

    modifier isNotFrozenToken(uint _tokenId) {
        require(!TokenMetadata[_tokenId].tokenFrozen, "Token is frozen");
        _;
    }

    modifier isTokenMinter(uint _tokenId) {
        require(
            TokenMetadata[_tokenId].minter == msg.sender,
            "Caller is not minter"
        );
        _;
    }

    modifier interTransferAllowed(uint _tokenId) {
        require(!TokenMetadata[_tokenId].tokenItrPaused, "Transfer failed");
        _;
    }

    //----------------------------------------------------------------------------
    // Minter role
    //----------------------------------------------------------------------------

    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Address is invalid");
        minterTokensMetadata[_minter].push();
    }

    function replaceMinter(
        address _OldMinter,
        address _newMinter
    ) public onlyOwner {
        require(_newMinter != address(0), "Address is invalid");
        require(
            minterTokensMetadata[_OldMinter].length > 0,
            "Minter does not exist"
        );
        for (uint i = 1; i < minterTokensMetadata[_OldMinter].length; i++) {
            uint tokenId = minterTokensMetadata[_OldMinter][i].tokenId;
            uint amount = minterTokensMetadata[_OldMinter][i].tokensMinted;
            require(_OldMinter != _newMinter, "Already current minter");
            TokenMetadata[tokenId].minter = _newMinter;
            // mint previous minter balance to new minter and burn previous minter balance
            _mint(_newMinter, tokenId, balanceOf[_OldMinter][tokenId]);
            _burn(_OldMinter, tokenId, balanceOf[_OldMinter][tokenId]);
            //add  new minter with respective tokens
            minterTokensMetadata[_newMinter].push(minterToken(amount, tokenId));
            emit BondMinterReplacement(tokenId, _newMinter);
        }
        //remove OldMinter's tokens
        delete minterTokensMetadata[_OldMinter];
    }

    //----------------------------------------------------------------------------
    // Operators
    //----------------------------------------------------------------------------
    modifier minterIsOperator(uint _tokenId) {
        require(
            TokenMetadata[_tokenId].minterIsOperator,
            "Minter is not operator"
        );
        _;
    }

    //----------------------------------------------------------------------------
    // Mint & burn
    //----------------------------------------------------------------------------

    function mint(
        uint32 _expirationDate,
        uint32 _interestRate,
        uint _tokenId,
        uint _amount,
        bool _custodial
    ) external isMinter notPausedContract {
        require(
            TokenMetadata[_tokenId].minter == address(0),
            "Token already exist"
        );
        require(
            _expirationDate > block.timestamp,
            "Maturity date must be above current time"
        );
        require(_amount > 0, "Amount cannot be less than 0");
        require(_interestRate > 0, "interest rate cannot be less than 0");
        TokenMetadata[_tokenId] = Token(
            _expirationDate,
            _interestRate,
            msg.sender,
            _custodial,
            false,
            _custodial,
            true
        );
        _mint(msg.sender, _tokenId, _amount);
        minterTokensMetadata[msg.sender].push(minterToken(_amount, _tokenId));
        emit BondCreated(
            msg.sender,
            _interestRate,
            _expirationDate,
            _amount,
            _tokenId
        );
    }

    modifier isMinter() {
        require(
            minterTokensMetadata[msg.sender].length > 0,
            "Minter does not exist"
        );
        _;
    }

    function burn(
        uint _tokenId,
        uint _amount
    ) external isMinter notPausedContract isTokenMinter(_tokenId) {
        require(_amount > 0, "Amount cannot be less than 0");
        uint balance = balanceOf[msg.sender][_tokenId];
        if (balance > _amount) {
            _burn(msg.sender, _tokenId, _amount);
        } else if (balance == _amount) {
            _burn(msg.sender, _tokenId, _amount);
            delete TokenMetadata[_tokenId];
        } else {
            revert("Insufficient balance");
        }
    }

    function _deposit(
        uint _tokenId,
        uint _amount,
        address _sender,
        address _receiver
    )
        internal
        bondExist(_tokenId)
        isNotFrozenToken(_tokenId)
        interTransferNotPaused(_tokenId)
        minterIsOperator(_tokenId)
        notMatured(_tokenId)
    {
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        require(
            _amount <= balanceOf[_sender][_tokenId],
            "Insufficient balance"
        );
        BondDepositWithdraws[_tokenId].push(
            DepositWithdrawal(
                _amount,
                block.timestamp,
                _sender,
                _receiver,
                Status.DEPOSIT
            )
        );
        bool success = transfer(_receiver, _tokenId, _amount);
        require(success, "Transfer failed");
        emit TransferWithdrawal(
            _sender,
            _receiver,
            _tokenId,
            _amount,
            Status.DEPOSIT
        );
    }

    // users can withdraw, that is they send their bond tokens back to the minter of the specific bond
    function _withdraw(
        uint _tokenId,
        uint _amount,
        address _sender,
        address _receiver
    )
        internal
        bondExist(_tokenId)
        isNotFrozenToken(_tokenId)
        interTransferNotPaused(_tokenId)
        interTransferAfterExpiryNotPaused(_tokenId)
        notMatured(_tokenId)
    {
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        require(
            _amount <= balanceOf[_sender][_tokenId],
            "Insufficient balance"
        );
        require(transfer(_receiver, _tokenId, _amount), "Transfer failed");

        BondDepositWithdraws[_tokenId].push(
            DepositWithdrawal(
                _amount,
                block.timestamp,
                _sender,
                _receiver,
                Status.WITHDRAW
            )
        );

        emit TransferWithdrawal(
            _sender,
            _receiver,
            _tokenId,
            _amount,
            Status.WITHDRAW
        );
    }

    function transfer(
        TransferParam[] calldata _transfers
    ) external notPausedContract isInputListValid(_transfers.length) {
        for (uint i = 0; i < _transfers.length; i++) {
            uint tokenId = _transfers[i].tokenId;
            //if sender is token minter, it's a deposit else withdraw
            if (_transfers[i].sender == TokenMetadata[tokenId].minter) {
                _deposit(
                    tokenId,
                    _transfers[i].amount,
                    _transfers[i].sender,
                    _transfers[i].receiver
                );
            } else {
                _withdraw(
                    tokenId,
                    _transfers[i].amount,
                    _transfers[i].sender,
                    _transfers[i].receiver
                );
            }
        }
    }
}
