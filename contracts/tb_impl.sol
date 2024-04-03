// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./ERC-6909.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TBImpl is Ownable(msg.sender), ERC6909 {
    event minted(
        address indexed bondMinter,
        uint32 interestRate,
        uint indexed expirationDate,
        uint indexed initialSupply,
        uint tokenId
    );
    event TransferWithdrawal(
        address indexed sender,
        address indexed receiver,
        uint tokenId,
        uint amount,
        Status indexed status
    );
    event MinterReplaced(
        uint tokenId,
        address indexed oldMinter,
        address indexed newMinter
    );
    event MinterRemoved(address indexed newMinter);
    event TokenInterTransferAllowed(uint tokenId, bool isTransferable);
    event TokenItrAfterExpiryAllowed(uint tokenId, bool isTransferable);
    event TokenInterTransfered(
        address indexed sender,
        address indexed receiver,
        uint amount
    );
    event OperatorsUpdated(address indexed sender, bool isUpdated);
    event TokenBurned(uint tokenId, uint amount);

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

    struct Token {
        uint expirationDate;
        uint32 interestRate;
        address minter;
        bool minterIsOperator;
        bool tokenFrozen;
        bool tokenItrPaused;
        bool tokenItrExpiryPaused;
        string _name;
    }

    enum OperatorAction {
        Add,
        Remove
    }

    struct OperatorParam {
        OperatorAction action;
        address owner;
        uint tokenId;
        address operator;
    }

    struct minterToken {
        uint tokensMinted;
        uint tokenId;
    }

    mapping(uint => Token) public TokenMetadata;
    mapping(uint => DepositWithdrawal[]) public Transfers;
    mapping(address => minterToken[]) public minterTokensMetadata;
    mapping(address => mapping(uint => address)) public operator;
    mapping(address => address[]) public operatorForAll;

    modifier notMatured(uint _tokenId) {
        require(
            block.timestamp < TokenMetadata[_tokenId].expirationDate,
            "token is mature"
        );
        _;
    }

    modifier tokenExist(uint _tokenId) {
        require(
            TokenMetadata[_tokenId].expirationDate != 0,
            "Token does not exist"
        );
        _;
    }

    modifier isInputListValid(uint _length) {
        require(_length <= 15, "List should not be above 15");
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
    ) external onlyOwner tokenExist(_tokenId) {
        require(
            TokenMetadata[_tokenId].tokenItrPaused,
            "InterTransfer is not paused"
        );
        TokenMetadata[_tokenId].tokenItrPaused = false;
        emit TokenInterTransferAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrPaused
        );
    }

    // prevent users from transfering a specific bond among themselves
    function pauseInterTransfer(
        uint _tokenId
    ) external onlyOwner tokenExist(_tokenId) {
        require(
            !TokenMetadata[_tokenId].tokenItrPaused,
            "InterTransfer is already paused"
        );
        TokenMetadata[_tokenId].tokenItrPaused = true;
        emit TokenInterTransferAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrPaused
        );
    }

    function _interTransferAllowed(
        uint _tokenId,
        address _sender,
        address _receiver
    ) internal view returns (bool) {
        if (!TokenMetadata[_tokenId].tokenItrPaused) {
            return true;
        } else if (
            TokenMetadata[_tokenId].minter == _sender ||
            TokenMetadata[_tokenId].minter == _receiver
        ) {
            return true;
        } else {
            return false;
        }
    }

    //----------------------------------------------------------------
    // INTER TRANSFER AFTER EXPIRY PAUSE AND RESUME
    //----------------------------------------------------------------

    function resumeItrAfterExpiry(
        uint _tokenId
    ) external onlyOwner tokenExist(_tokenId) {
        require(
            TokenMetadata[_tokenId].tokenItrExpiryPaused,
            "InterTransfer after expiry is not paused"
        );
        TokenMetadata[_tokenId].tokenItrExpiryPaused = false;
        emit TokenItrAfterExpiryAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrExpiryPaused
        );
    }

    function pauseItrAfterExpiry(
        uint _tokenId
    ) external onlyOwner tokenExist(_tokenId) {
        require(
            !TokenMetadata[_tokenId].tokenItrExpiryPaused,
            "InterTransfer after expiry is already paused"
        );
        TokenMetadata[_tokenId].tokenItrExpiryPaused = true;
        emit TokenItrAfterExpiryAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrExpiryPaused
        );
    }

    function _isInterTransferAfterExpiryAllowed(
        uint _tokenId,
        address _receiver
    ) internal view returns (bool) {
        if (!TokenMetadata[_tokenId].tokenItrExpiryPaused) {
            return true;
        } else if (
            TokenMetadata[_tokenId].expirationDate > block.timestamp ||
            TokenMetadata[_tokenId].minter == _receiver
        ) {
            return true;
        } else {
            return false;
        }
    }

    //----------------------------------------------------------------
    // MINTER IS OPERATOR
    //----------------------------------------------------------------
    function setMinterAsOperator(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        require(
            !TokenMetadata[_tokenId].minterIsOperator,
            "Minter is already operator"
        );
        TokenMetadata[_tokenId].minterIsOperator = true;
    }

    function unsetMinterAsOperator(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        require(
            TokenMetadata[_tokenId].minterIsOperator,
            "Minter is not operator"
        );
        TokenMetadata[_tokenId].minterIsOperator = false;
    }

    //----------------------------------------------------------------
    // FREEZE TRANSFER OF TOKEN
    //----------------------------------------------------------------
    function freezeToken(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        require(!TokenMetadata[_tokenId].tokenFrozen, "Token already frozen");
        TokenMetadata[_tokenId].tokenFrozen = true;
    }

    function unfreezeToken(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        require(TokenMetadata[_tokenId].tokenFrozen, "Token not frozen");
        TokenMetadata[_tokenId].tokenFrozen = false;
    }

    modifier isNotFrozenToken(uint _tokenId) {
        require(!TokenMetadata[_tokenId].tokenFrozen, "Token is frozen");
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
    ) public onlyOwner notPausedContract {
        require(_newMinter != address(0), "Address is invalid");
        require(
            minterTokensMetadata[_OldMinter].length > 0,
            "Old minter does not exist"
        );
        require(
            minterTokensMetadata[_newMinter].length == 0,
            "New minter exist"
        );
        // replace old minter with new minter in all minted tokens
        for (uint i = 0; i < minterTokensMetadata[_OldMinter].length; i++) {
            uint tokenId = minterTokensMetadata[_OldMinter][i].tokenId;
            uint amount = minterTokensMetadata[_OldMinter][i].tokensMinted;
            
            // mint previous minter balance to new minter and burn previous minter balance
            _mint(_newMinter, tokenId, balanceOf[_OldMinter][tokenId]);
            _burn(_OldMinter, tokenId, balanceOf[_OldMinter][tokenId]);
            //add  new minter with respective tokens
            minterTokensMetadata[_newMinter].push(minterToken(amount, tokenId));
            TokenMetadata[tokenId].minter = _newMinter;
            emit MinterReplaced(tokenId, _OldMinter, _newMinter);
        }
        //remove OldMinter
        delete minterTokensMetadata[_OldMinter];
    }

    function removeMinter(
        address _minter
    ) external onlyOwner notPausedContract isMinter(_minter){
        require(_minter != address(0), "Address is invalid");
        //cannot remove minter if tight to a token
        require(
            minterTokensMetadata[_minter].length <= 1,
            "Cannot remove minter"
        );
        delete minterTokensMetadata[_minter];
        emit MinterRemoved(_minter);
    }

    function _isTokenMinter(
        uint _tokenId,
        address _minter
    ) internal view isMinter(_minter) returns (bool) {
        if (TokenMetadata[_tokenId].minter == _minter) {
            return true;
        } else {
            return false;
        }
    }

    modifier isMinter(address _minter) {
        require(
            minterTokensMetadata[_minter].length > 0,
            "Minter does not exist"
        );
        _;
    }

    //----------------------------------------------------------------------------
    // Operators
    //----------------------------------------------------------------------------

    // handle both additions and removals of operators for specific tokens
    function updateOperators(
        OperatorParam[] memory upl
    ) public notPausedContract isInputListValid(upl.length){
        for (uint i = 0; i < upl.length; i++) {
            OperatorParam memory param = upl[i];
            //if action is ADD, check if owner is caller and add operator
            if (param.action == OperatorAction.Add) {
                require(param.owner == msg.sender, "Caller not owner");
                operator[param.owner][param.tokenId] = param.operator;
                setOperator(param.operator, true);
            } 
            //if action is REMOVE, check if owner is caller and operator exist, then delete operator
            else {

                if (
                    param.owner == msg.sender &&
                    operator[param.owner][param.tokenId] == param.operator
                ) {
                    delete operator[param.owner][param.tokenId];
                    setOperator(param.operator, false);
                }
            }
        }
        emit OperatorsUpdated(msg.sender, true);
    }

    // update operators for all tokens of a caller
    function updateOperatorsForAll(
        address[] memory upl
    ) public notPausedContract isInputListValid(upl.length){
        address sender = msg.sender;
        address[] storage operators = operatorForAll[sender];

        for (uint256 i = 0; i < upl.length; i++) {
            address operatorx = upl[i];
            uint256 idx;
            // break if any prev operator is same as current operator
            for (idx = 0; idx < operators.length; idx++) {
                if (operators[idx] == operatorx) {
                    break;
                }
            }
            if (idx != operators.length) {
                // if current operator already exist in operators, remove it from operators list
                operators[idx] = operators[operators.length - 1];
                operators.pop();
                setOperator(operators[idx], false);
            } else {
                // else add it to operators list
                operators.push(operatorx);
                setOperator(operatorx, true);
            }
        }
        emit OperatorsUpdated(msg.sender, true);
    }

    // check if the minter is an operator for a token
    function minterIsOperator(
        uint _tokenId,
        address _sender
    ) public view returns (bool) {
        return
            TokenMetadata[_tokenId].minterIsOperator &&
            _sender == TokenMetadata[_tokenId].minter;
    }

    // check ownership and operator permissions for a  transfer
     function checkOwnerAndOperator(TransferParam memory _transfer) public view returns (bool) {
        address sender = _transfer.sender;
        uint tokenId = _transfer.tokenId;
        //if caller is not sender, check if caller is operator or minter
        if (msg.sender != sender) {
            if (
                (operator[msg.sender][tokenId] == sender ||
                    _isOperatorForAll(sender)) ||
                minterIsOperator(tokenId, msg.sender)
            ) {
                return true;
            }
        }else if(msg.sender == sender && balanceOf[msg.sender][tokenId]>0){
        return true;
        }
        return false;
    }

    function _isOperatorForAll(address _sender) internal view returns (bool) {
        bool isOpForAll = false;
        for (uint256 i = 0; i < operatorForAll[_sender].length; i++) {
            if (operatorForAll[_sender][i] == _sender) {
                isOpForAll = true;
                break;
            }
        }
        return isOpForAll;
    }

    //----------------------------------------------------------------------------
    // Mint & burn
    //----------------------------------------------------------------------------

    function mint(
        uint _expirationDate,
        uint32 _interestRate,
        uint _tokenId,
        uint _amount,
        bool _custodial,
        string memory _name
    ) external notPausedContract isMinter(msg.sender) {
        require(
            TokenMetadata[_tokenId].minter == address(0),
            "Token already exist"
        );
        require(
            _expirationDate > block.timestamp,
            "Expiration date must be above current time"
        );
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        require(_interestRate > 0, "Interest rate cannot be 0");
        TokenMetadata[_tokenId] = Token(
            _expirationDate,
            _interestRate,
            msg.sender,
            _custodial,
            false,
            _custodial,
            true,
            _name
        );
        // mint to the  minter address
        _mint(msg.sender, _tokenId, _amount);
        // add token to minters token lists
        minterTokensMetadata[msg.sender].push(minterToken(_amount, _tokenId));
        emit minted(
            msg.sender,
            _interestRate,
            _expirationDate,
            _amount,
            _tokenId
        );
    }

    function burn(uint _tokenId, uint _amount) external notPausedContract tokenExist(_tokenId){
        require(_isTokenMinter(_tokenId, msg.sender), "Not token minter");
        uint balance = balanceOf[msg.sender][_tokenId];
        require(balance > _amount, "Amount must be less than balance");
        require(_amount > 0, "Amount cannot be less than 0");
        if (balance > _amount) {
            _burn(msg.sender, _tokenId, _amount);
            for(uint i=0; i < minterTokensMetadata[msg.sender].length; i++){
                if(minterTokensMetadata[msg.sender][i].tokenId == _tokenId){
                    minterTokensMetadata[msg.sender][i].tokensMinted -= _amount;
                }
            }
        }
        else {
            revert("Insufficient balance");
        }
        emit TokenBurned(_tokenId, _amount);
    }

    //----------------------------------------------------------------------------
    // Transfer
    //----------------------------------------------------------------------------
  function _deposit(
        uint _tokenId,
        uint _amount,
        address _sender,
        address _receiver
    ) internal tokenExist(_tokenId) isNotFrozenToken(_tokenId) {
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        require(
            _amount <= balanceOf[_sender][_tokenId],
            "Insufficient balance"
        );
        Transfers[_tokenId].push(
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
    ) internal tokenExist(_tokenId) isNotFrozenToken(_tokenId) {
        require(
            _amount >= unitPrice && _amount % unitPrice == 0,
            "Amount must be in multiples of unit price"
        );
        require(
            _amount <= balanceOf[_sender][_tokenId],
            "Insufficient balance"
        );
        require(transfer(_receiver, _tokenId, _amount), "Transfer failed");

        Transfers[_tokenId].push(
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

    function _interTransfer(
        uint _tokenId,
        uint _amount,
        address _sender,
        address _receiver
    ) internal tokenExist(_tokenId) isNotFrozenToken(_tokenId) {
        TransferParam memory _transfer = TransferParam(_tokenId, _amount, _sender, _receiver);
        require(checkOwnerAndOperator(_transfer), "Sender must be Caller or operator");
        require(transfer(_receiver, _tokenId, _amount), "Transfer failed");
        emit TokenInterTransfered(_sender, _receiver, _amount);
    }

    function makeTransfer(
        TransferParam[] calldata _transfers
    ) external notPausedContract isInputListValid(_transfers.length) {
        for (uint i = 0; i < _transfers.length; i++) {
            uint tokenId = _transfers[i].tokenId;
            uint amount = _transfers[i].amount;
            address sender = _transfers[i].sender;
            address receiver = _transfers[i].receiver;

            require(
                _interTransferAllowed(tokenId, sender, receiver),
                "Inter transfer not allowed"
            );
            require(
                _isInterTransferAfterExpiryAllowed(tokenId, receiver),
                "Inter transfer after expiry not allowed"
            );
            require(
                sender != receiver,
                "Sender must be different from receiver"
            );

            require(
                amount >= unitPrice && amount % unitPrice == 0,
                "Amount must be in multiples of unit price"
            );
            require(
                balanceOf[sender][tokenId] >= amount,
                "Insufficient balance"
            );
            //if sender is token minter, it's a deposit else withdraw
            if (
                sender == TokenMetadata[tokenId].minter
            ) {
                require(
                    _isTokenMinter(tokenId, msg.sender),
                    "Caller must be token minter"
                );
                _deposit(tokenId, amount, sender, receiver);
            } else if (
                receiver == TokenMetadata[tokenId].minter 
            ) {
                require(
                    _isTokenMinter(tokenId, receiver),
                    "Receiver must be token minter"
                );
                _withdraw(tokenId, amount, sender, receiver);
            } else {
                _interTransfer(tokenId, amount, sender, receiver);
            }
        }
    }
}
