// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./ERC-6909.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TBImpl is Ownable(msg.sender), ERC6909 {

    event MinterReplaced(
        uint tokenId,
        address indexed oldMinter,
        address indexed newMinter
    );
    event MinterRemoved(address indexed minter);
    event TokenInterTransferAllowed(uint tokenId, bool isTransferable);
    event TokenItrAfterExpiryAllowed(uint tokenId, bool isTransferable);
    event TokenInterTransfered(
        address indexed from,
        address indexed receiver,
        uint amount
    );
    bool public isContractPaused;

    enum Status {
        DEPOSIT,
        WITHDRAW
    }

    struct TransferDest {
        uint tokenId;
        uint amount;
        address receiver;
    }
    
    struct TransferParam{
        address from;
        TransferDest[] transferDest;
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

    mapping(uint => Token) public TokenMetadata;
    mapping(address => uint[]) public minterTokensMetadata;
    mapping(address => bool) public minterExist;

    error isPaused();
    error isNotPaused();
    error minterAlreadyExist();
    error isResume();
    error isMature();
    error nonExistantToken();
    error tokenAlreadyExist();
    error invalidInputList();
    error itrNotPaused();
    error itrPaused();
    error itrAfterExpiryNotPaused();
    error itrAfterExpiryIsPaused();
    error isTokenOperator();
    error notOperator();
    error isFrozen();
    error notFrozen();
    error invalidAddress();
    error notMinter();
    error isAMinter();
    error isActiveMinter();
    error isNotOwner();
    error invalidExpiration();
    error invalidInterest();
    error isNotTokenMinter();
    error invalidAmount();
    error fromIsReceiver();
    error insufficientBalance();
    error isNotOwnerNorOperator();

    modifier notMatured(uint _tokenId) {
        if(block.timestamp > TokenMetadata[_tokenId].expirationDate) revert isMature();
        _;
    }

    modifier tokenExist(uint _tokenId) {
        if(TokenMetadata[_tokenId].expirationDate == 0) revert nonExistantToken();
        _;
    }


    //----------------------------------------------------------------------------
    // Contract execution pause/resume
    //----------------------------------------------------------------------------

    //Pause contract execution
    function pause() external onlyOwner {
        if(isContractPaused) revert isPaused();
        isContractPaused = true;
    }

    //Resume contract execution
    function resume() external onlyOwner {
        if(!isContractPaused) revert isNotPaused();
        isContractPaused = false;
    }

    modifier notPausedContract() {
        if(isContractPaused) revert isPaused();
        _;
    }

    //----------------------------------------------------------------
    // INTER TRANSFER PAUSE AND RESUME
    //----------------------------------------------------------------
    // permit users to transfer a specific bond among themselves
    function resumeInterTransfer(
        uint _tokenId
    ) external onlyOwner tokenExist(_tokenId) {
        if(!TokenMetadata[_tokenId].tokenItrPaused) revert itrNotPaused();
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
        if(TokenMetadata[_tokenId].tokenItrPaused) revert itrPaused();
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
        if (!TokenMetadata[_tokenId].tokenItrPaused) return true;
        if (
            TokenMetadata[_tokenId].minter == _sender ||
            TokenMetadata[_tokenId].minter == _receiver
        ) return true;
        return false;
        
    }

    //----------------------------------------------------------------
    // INTER TRANSFER AFTER EXPIRY PAUSE AND RESUME
    //----------------------------------------------------------------

    function resumeItrAfterExpiry(
        uint _tokenId
    ) external onlyOwner tokenExist(_tokenId) {
        if(!TokenMetadata[_tokenId].tokenItrExpiryPaused) revert itrAfterExpiryNotPaused();

        TokenMetadata[_tokenId].tokenItrExpiryPaused = false;
        emit TokenItrAfterExpiryAllowed(
            _tokenId,
            TokenMetadata[_tokenId].tokenItrExpiryPaused
        );
    }

    function pauseItrAfterExpiry(
        uint _tokenId
    ) external onlyOwner tokenExist(_tokenId) {
        if(TokenMetadata[_tokenId].tokenItrExpiryPaused) revert itrAfterExpiryIsPaused();
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
        if (!TokenMetadata[_tokenId].tokenItrExpiryPaused) return true;
        if (
            TokenMetadata[_tokenId].expirationDate > block.timestamp ||
            TokenMetadata[_tokenId].minter == _receiver
        ) return true;
        return false;
        
    }

    //----------------------------------------------------------------
    // MINTER IS OPERATOR
    //----------------------------------------------------------------
    function setMinterAsOperator(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        if(TokenMetadata[_tokenId].minterIsOperator) revert isTokenOperator();
        TokenMetadata[_tokenId].minterIsOperator = true;
    }

    function unsetMinterAsOperator(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        if(!TokenMetadata[_tokenId].minterIsOperator) revert notOperator();
        TokenMetadata[_tokenId].minterIsOperator = false;
    }

    //----------------------------------------------------------------
    // FREEZE TRANSFER OF TOKEN
    //----------------------------------------------------------------
    function freezeToken(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        if(TokenMetadata[_tokenId].tokenFrozen) revert isFrozen();
        TokenMetadata[_tokenId].tokenFrozen = true;
    }

    function unfreezeToken(uint _tokenId) external onlyOwner tokenExist(_tokenId){
        if(!TokenMetadata[_tokenId].tokenFrozen) revert notFrozen();
        TokenMetadata[_tokenId].tokenFrozen = false;
    }

    modifier isNotFrozenToken(uint _tokenId) {
        if(TokenMetadata[_tokenId].tokenFrozen) revert isFrozen();
        _;
    }

    //----------------------------------------------------------------------------
    // Minter role
    //----------------------------------------------------------------------------

    function addMinter(address _minter) external onlyOwner {
        if(_minter == address(0)) revert invalidAddress();
        if(minterExist[_minter]) revert minterAlreadyExist();
        minterTokensMetadata[_minter] =  new uint[](0);
        minterExist[_minter] = true;
    }

    function replaceMinter(
        address _OldMinter,
        address _newMinter
    ) public onlyOwner notPausedContract {
        if(_OldMinter == address(0) || _newMinter == address(0)) revert invalidAddress();
        
        if(!minterExist[_OldMinter]) revert notMinter();
        
        if(minterExist[_newMinter]) revert isAMinter();

        // replace old minter with new minter in all minted tokens
        for (uint i = 0; i < minterTokensMetadata[_OldMinter].length; i++) {
            uint tokenId = minterTokensMetadata[_OldMinter][i];
            
            // mint previous minter balance to new minter and burn previous minter balance
            _mint(_newMinter, tokenId, balanceOf[_OldMinter][tokenId]);
            _burn(_OldMinter, tokenId, balanceOf[_OldMinter][tokenId]);
            //add  new minter with respective tokens
            minterTokensMetadata[_newMinter].push(tokenId);
            TokenMetadata[tokenId].minter = _newMinter;
            emit MinterReplaced(tokenId, _OldMinter, _newMinter);
        }
        //remove OldMinter
        delete minterTokensMetadata[_OldMinter];
        minterExist[_newMinter] = true;
        minterExist[_OldMinter] = false;


    }

    function removeMinter(
        address _minter
    ) external onlyOwner notPausedContract isMinter(_minter){
        if(_minter == address(0)) revert invalidAddress();
        //cannot remove minter if tight to a token
        
        if(minterTokensMetadata[_minter].length >= 1) revert isActiveMinter();
        minterExist[_minter] = false;
        delete minterTokensMetadata[_minter];
        emit MinterRemoved(_minter);
    }

    function _isTokenMinter(
        uint _tokenId,
        address _minter
    ) internal view isMinter(_minter) returns (bool) {
        if (TokenMetadata[_tokenId].minter == _minter) return true;
        return false;
        
    }

    modifier isMinter(address _minter) {
        if(!minterExist[_minter]) revert notMinter();
        _;
    }

    //----------------------------------------------------------------------------
    // Operators
    //----------------------------------------------------------------------------

    // handle both additions and removals of operators for specific tokens
    function updateOperators(
        OperatorParam[] memory upl
    ) public notPausedContract {
        for (uint i = 0; i < upl.length; i++) {
            OperatorParam memory param = upl[i];
            //if action is ADD, check if owner is caller and add operator
            if (param.action == OperatorAction.Add) {
                if(param.owner != msg.sender){
                    revert isNotOwner();
                }
                setOperator(param.operator, true);
            } 
            //if action is REMOVE, check if owner is caller and operator exist, then delete operator
            else {

                if (
                    param.owner == msg.sender &&
                    isOperator[msg.sender][param.operator] == true
                ) {
                    setOperator(param.operator, false);
                }
            }
        }
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
     function checkOwnerAndOperators(TransferParam[] calldata _transfers) public view returns (bool) {
        bool isOwnerOrOperator;
        for (uint i = 0; i < _transfers.length; i++) {
                address from = _transfers[i].from;
                TransferDest[] calldata transferDest = _transfers[i].transferDest;
            for (uint j = 0; j < transferDest.length; j++) {
                uint tokenId = transferDest[j].tokenId;
                //if caller is not sender, check if caller is operator or minter
                if (msg.sender != from) {
                    if (
                        !isOperator[from][msg.sender] ||
                        minterIsOperator(tokenId, msg.sender)
                    ) {
                       isOwnerOrOperator =  true;
                    }
                } 
                if(msg.sender == from && balanceOf[msg.sender][tokenId]>0){
                    isOwnerOrOperator =  true;
                }
            }   
            
        }
        return isOwnerOrOperator;
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
        if(TokenMetadata[_tokenId].minter != address(0)){
            revert tokenAlreadyExist();
        }
        
        if(_expirationDate <= block.timestamp) revert invalidExpiration();
                
        if(_interestRate == 0) revert invalidInterest();

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
        minterTokensMetadata[msg.sender].push(_tokenId);
    }

    function burn(uint _tokenId, uint _amount) external notPausedContract tokenExist(_tokenId){
        uint balance = balanceOf[msg.sender][_tokenId];
        if(!_isTokenMinter(_tokenId, msg.sender)) revert isNotTokenMinter();
        if(balance <= _amount || _amount == 0) revert invalidAmount();
        _burn(msg.sender, _tokenId, _amount);
    }

    function makeTransfer(
       TransferParam[] calldata _transfers
    ) external notPausedContract { 
        if(!checkOwnerAndOperators(_transfers)){
            revert isNotOwnerNorOperator();
        }
        for (uint i = 0; i < _transfers.length; i++) {
            address from = _transfers[i].from;
            TransferDest[] calldata transferDest = _transfers[i].transferDest;
            for (uint j = 0; j < transferDest.length; j++) {
                uint tokenId = transferDest[j].tokenId;
                uint amount = transferDest[j].amount;
                address receiver = transferDest[j].receiver;

                if(!_interTransferAllowed(tokenId, from, receiver)) revert itrPaused();
                
                if(!_isInterTransferAfterExpiryAllowed(tokenId, receiver)) revert itrAfterExpiryIsPaused();
                
                if(from == receiver) revert fromIsReceiver();
                                
                if(balanceOf[from][tokenId] < amount) revert insufficientBalance();
       
                transfer(receiver, tokenId, amount);
                
            }
        }
    }
}