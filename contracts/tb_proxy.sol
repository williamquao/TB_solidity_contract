// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./tb_impl.sol";

contract TBProxy is Ownable(msg.sender) {
    address public tbImplementation;

    constructor(address _impl) {
        require(
            _isValidContractAddress(_impl),
            "Invalid implementation contract address"
        );
        tbImplementation = _impl;
    }

    //verify if provided address is a contract address
    function _isValidContractAddress(
        address _contractAddress
    ) internal view returns (bool) {
        uint size;
        assembly {
            size := extcodesize(_contractAddress)
        }
        return size > 0;
    }

    fallback() external {
        (bool success, bytes memory returnData) = tbImplementation.delegatecall(
            msg.data
        );
        if (!success) {
            assembly {
                // Revert with the returned data as the error message
                revert(add(returnData, 32), mload(returnData))
            }
        }
        assembly {
            switch eq(returndatasize(), 32)
            case 0 {
                let size := mload(returnData)
                return(returnData, size)
            }
            case 1 {
                let data := add(returnData, 32)
                let size := mload(returnData)
                return(data, size)
            }
        }
    }

    function upgradeImpl(address _impl) external onlyOwner {
        require(
            _isValidContractAddress(_impl),
            "Invalid implementation contract address"
        );
        tbImplementation = _impl;
    }
}
