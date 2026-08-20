// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { BuilderRegistry } from "../src/BuilderRegistry.sol";

contract RegistryActor {
    function register(
        BuilderRegistry registry,
        string calldata code,
        address payoutAddress,
        string calldata metadataURI
    ) external {
        registry.register(code, payoutAddress, metadataURI);
    }

    function updatePayoutAddress(
        BuilderRegistry registry,
        string calldata code,
        address payoutAddress
    ) external {
        registry.updatePayoutAddress(code, payoutAddress);
    }

    function updateMetadataURI(
        BuilderRegistry registry,
        string calldata code,
        string calldata metadataURI
    ) external {
        registry.updateMetadataURI(code, metadataURI);
    }

    function transferCode(BuilderRegistry registry, string calldata code, address newOwner)
        external
    {
        registry.transferCode(code, newOwner);
    }

    function deactivateCode(BuilderRegistry registry, string calldata code) external {
        registry.deactivateCode(code);
    }
}

contract BuilderRegistryTest {
    BuilderRegistry private registry;
    RegistryActor private alice;
    RegistryActor private bob;

    function setUp() public {
        registry = new BuilderRegistry();
        alice = new RegistryActor();
        bob = new RegistryActor();
    }

    function testRegisterAndResolve() public {
        alice.register(registry, "avax-impact", address(0xA11CE), "ipfs://builder-metadata");

        BuilderRegistry.BuilderRecord memory record = registry.resolve("avax-impact");
        require(_equal(record.code, "avax-impact"), "unexpected code");
        require(record.owner == address(alice), "unexpected owner");
        require(record.payoutAddress == address(0xA11CE), "unexpected payout address");
        require(_equal(record.metadataURI, "ipfs://builder-metadata"), "unexpected metadata");
        require(record.registeredAt > 0, "missing timestamp");
        require(record.active, "record should be active");
        require(registry.isRegistered("avax-impact"), "code should be registered");
    }

    function testRejectsInvalidCodes() public {
        _expectRegisterFailure("ab");
        _expectRegisterFailure("ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567");
        _expectRegisterFailure("Uppercase");
        _expectRegisterFailure("-leading");
        _expectRegisterFailure("trailing-");
        _expectRegisterFailure("double--hyphen");
        _expectRegisterFailure("invalid_code");
    }

    function testRejectsDuplicateRegistration() public {
        alice.register(registry, "avax-impact", address(0xA11CE), "");

        (bool succeeded,) = address(bob).call(
            abi.encodeCall(
                RegistryActor.register,
                (registry, "avax-impact", address(0xB0B), "ipfs://duplicate")
            )
        );
        require(!succeeded, "duplicate registration should revert");
    }

    function testOwnerCanUpdateAndTransfer() public {
        alice.register(registry, "avax-impact", address(0xA11CE), "ipfs://v1");
        alice.updatePayoutAddress(registry, "avax-impact", address(0xBEEF));
        alice.updateMetadataURI(registry, "avax-impact", "ipfs://v2");
        alice.transferCode(registry, "avax-impact", address(bob));

        BuilderRegistry.BuilderRecord memory record = registry.resolve("avax-impact");
        require(record.owner == address(bob), "ownership was not transferred");
        require(record.payoutAddress == address(0xBEEF), "payout address was not updated");
        require(_equal(record.metadataURI, "ipfs://v2"), "metadata was not updated");

        bob.updateMetadataURI(registry, "avax-impact", "ipfs://v3");
        record = registry.resolve("avax-impact");
        require(_equal(record.metadataURI, "ipfs://v3"), "new owner cannot update metadata");
    }

    function testRejectsUnauthorizedUpdate() public {
        alice.register(registry, "avax-impact", address(0xA11CE), "");

        (bool succeeded,) = address(bob).call(
            abi.encodeCall(
                RegistryActor.updatePayoutAddress, (registry, "avax-impact", address(0xB0B))
            )
        );
        require(!succeeded, "unauthorized update should revert");
    }

    function testDeactivationIsPermanent() public {
        alice.register(registry, "avax-impact", address(0xA11CE), "");
        alice.deactivateCode(registry, "avax-impact");

        require(!registry.isRegistered("avax-impact"), "deactivated code should not be active");
        BuilderRegistry.BuilderRecord memory record = registry.resolve("avax-impact");
        require(!record.active, "resolved record should show deactivation");

        (bool updateSucceeded,) = address(alice).call(
            abi.encodeCall(
                RegistryActor.updateMetadataURI, (registry, "avax-impact", "ipfs://revive")
            )
        );
        require(!updateSucceeded, "deactivated code should not be mutable");

        (bool registerSucceeded,) = address(bob).call(
            abi.encodeCall(RegistryActor.register, (registry, "avax-impact", address(0xB0B), ""))
        );
        require(!registerSucceeded, "deactivated code should not be reusable");
    }

    function testRejectsZeroAddresses() public {
        (bool payoutSucceeded,) = address(alice).call(
            abi.encodeCall(RegistryActor.register, (registry, "avax-impact", address(0), ""))
        );
        require(!payoutSucceeded, "zero payout address should revert");

        alice.register(registry, "second-code", address(0xA11CE), "");
        (bool ownerSucceeded,) = address(alice).call(
            abi.encodeCall(RegistryActor.transferCode, (registry, "second-code", address(0)))
        );
        require(!ownerSucceeded, "zero owner should revert");
    }

    function testRejectsOversizedMetadataURI() public {
        bytes memory oversized = new bytes(513);
        for (uint256 index = 0; index < oversized.length; ++index) {
            oversized[index] = bytes1("a");
        }

        (bool succeeded,) = address(alice).call(
            abi.encodeCall(
                RegistryActor.register,
                (registry, "avax-impact", address(0xA11CE), string(oversized))
            )
        );
        require(!succeeded, "oversized metadata URI should revert");
    }

    function testCodeHashMatchesKeccak256() public view {
        require(
            registry.codeHash("avax-impact") == keccak256(bytes("avax-impact")),
            "unexpected code hash"
        );
    }

    function _expectRegisterFailure(string memory code) private {
        (bool succeeded,) = address(alice).call(
            abi.encodeCall(RegistryActor.register, (registry, code, address(0xA11CE), ""))
        );
        require(!succeeded, "invalid code should revert");
    }

    function _equal(string memory first, string memory second) private pure returns (bool) {
        return keccak256(bytes(first)) == keccak256(bytes(second));
    }
}
