// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Demonstrates a standard ABI-decoded call that accepts trailing attribution calldata.
contract AttributionDemo {
    event Ping(address indexed caller, uint256 value, uint256 result);

    function ping(uint256 value) external returns (uint256 result) {
        result = value + 1;
        emit Ping(msg.sender, value, result);
    }
}

/// @notice Demonstrates why attribution must remain opt-in: this contract rejects trailing bytes.
contract StrictCalldataDemo {
    error UnexpectedCalldataLength(uint256 actualLength);

    event StrictPing(address indexed caller, uint256 value);

    function strictPing(uint256 value) external {
        if (msg.data.length != 36) revert UnexpectedCalldataLength(msg.data.length);
        emit StrictPing(msg.sender, value);
    }
}
