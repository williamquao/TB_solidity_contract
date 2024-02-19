// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TB_impl.sol";

contract TBProxy is Ownable {
    address public tbImplementation;

    constructor(address _impl) {
        tbImplementation = _impl;
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
        require(_impl != address(0), "Invalid implementation address");
        tbImplementation = _impl;
    }
}
