// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { BuilderRegistry } from "../src/BuilderRegistry.sol";

interface RegistrationVm {
    function envAddress(string calldata name) external view returns (address value);
    function envString(string calldata name) external view returns (string memory value);
    function envUint(string calldata name) external view returns (uint256 value);
    function startBroadcast(uint256 privateKey) external;
    function stopBroadcast() external;
}

contract RegisterBuilder {
    RegistrationVm private constant vm =
        RegistrationVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external {
        uint256 privateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        BuilderRegistry registry = BuilderRegistry(vm.envAddress("REGISTRY_ADDRESS"));
        string memory builderCode = vm.envString("BUILDER_CODE");
        address payoutAddress = vm.envAddress("PAYOUT_ADDRESS");
        string memory metadataURI = vm.envString("METADATA_URI");

        vm.startBroadcast(privateKey);
        registry.register(builderCode, payoutAddress, metadataURI);
        vm.stopBroadcast();
    }
}
