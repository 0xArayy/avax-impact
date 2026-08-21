// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AttributionDemo, StrictCalldataDemo } from "../src/AttributionDemo.sol";

contract AttributionDemoTest {
    bytes16 private constant ERC_8021_MARKER = 0x80218021802180218021802180218021;

    function testStandardAbiCallAcceptsAttributionSuffix() public {
        AttributionDemo demo = new AttributionDemo();
        bytes memory normalCalldata = abi.encodeCall(AttributionDemo.ping, (41));
        bytes memory suffix =
            abi.encodePacked(bytes("avax-impact"), uint8(11), uint8(0), ERC_8021_MARKER);

        (bool succeeded, bytes memory returndata) =
            address(demo).call(bytes.concat(normalCalldata, suffix));

        require(succeeded, "attributed ABI call should succeed");
        require(abi.decode(returndata, (uint256)) == 42, "unexpected result");
    }

    function testStrictContractRejectsAttributionSuffix() public {
        StrictCalldataDemo demo = new StrictCalldataDemo();
        bytes memory normalCalldata = abi.encodeCall(StrictCalldataDemo.strictPing, (41));
        bytes memory suffix =
            abi.encodePacked(bytes("avax-impact"), uint8(11), uint8(0), ERC_8021_MARKER);

        (bool succeeded,) = address(demo).call(bytes.concat(normalCalldata, suffix));

        require(!succeeded, "strict calldata contract should reject suffix");
    }
}
