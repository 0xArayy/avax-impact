// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AttributionDemo, StrictCalldataDemo } from "../src/AttributionDemo.sol";
import { BuilderRegistry } from "../src/BuilderRegistry.sol";

interface Vm {
    function envUint(string calldata name) external view returns (uint256 value);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract DeployMVP {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    event MVPDeployed(
        address indexed registry,
        address indexed attributionDemo,
        address indexed strictCalldataDemo
    );

    function run()
        external
        returns (
            BuilderRegistry registry,
            AttributionDemo attributionDemo,
            StrictCalldataDemo strictCalldataDemo
        )
    {
        uint256 privateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        registry = new BuilderRegistry();
        attributionDemo = new AttributionDemo();
        strictCalldataDemo = new StrictCalldataDemo();
        vm.stopBroadcast();

        emit MVPDeployed(address(registry), address(attributionDemo), address(strictCalldataDemo));
    }
}
