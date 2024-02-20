// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface ITB_impl {
    struct DepositWithdrawalParams {
        uint bondId;
        uint amount;
        address user;
    }

    struct ReplaceMintParams {
        uint bondId;
        address newMinter;
    }
    function createBond(
        uint _initialSupply,
        uint32 _maturityDate,
        string memory _name,
        address _minter
    ) external returns (uint);
    function depositBulk(
        DepositWithdrawalParams[20] calldata deposits
    ) external;
    function withdraw(uint _bondId, uint _amount) external;
    function removeMint(uint _bondId) external;
    function replaceMintBulk(ReplaceMintParams[20] calldata mints) external;
    function pauseBond(uint _bondId) external;
    function resumeBond(uint _bondId) external;
    function enableInterTransfer(uint _bondId) external;
    function disableInterTransfer(uint _bondId) external;
    function transferBondAmongUsers(
        uint _bondId,
        uint _amount,
        address _receiver
    ) external;
}
