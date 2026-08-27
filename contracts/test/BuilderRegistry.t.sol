// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { BuilderRegistry, ICodeRegistry } from "../src/BuilderRegistry.sol";

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

    function testCanonicalResolverABI() public {
        alice.register(registry, "avax-impact", address(0xA11CE), "ipfs://builder-metadata");

        require(registry.isValidCode("avax-impact"), "registered code should be valid");
        require(registry.isRegistered("avax-impact"), "registered code should be active");
        require(
            registry.payoutAddress("avax-impact") == address(0xA11CE), "canonical payout mismatch"
        );
        require(
            _equal(registry.codeURI("avax-impact"), "ipfs://builder-metadata"),
            "canonical URI mismatch"
        );
    }

    function testCanonicalInterfaceSelectors() public pure {
        require(
            ICodeRegistry.payoutAddress.selector == bytes4(keccak256("payoutAddress(string)")),
            "unexpected payoutAddress selector"
        );
        require(
            ICodeRegistry.codeURI.selector == bytes4(keccak256("codeURI(string)")),
            "unexpected codeURI selector"
        );
        require(
            ICodeRegistry.isValidCode.selector == bytes4(keccak256("isValidCode(string)")),
            "unexpected isValidCode selector"
        );
        require(
            ICodeRegistry.isRegistered.selector == bytes4(keccak256("isRegistered(string)")),
            "unexpected isRegistered selector"
        );
    }

    function testCanonicalResolverRejectsInvalidWithoutBooleanReverts() public view {
        string[7] memory invalidCodes = [
            string(""),
            "ab",
            "Uppercase",
            "-leading",
            "trailing-",
            "double--hyphen",
            "invalid_code"
        ];

        for (uint256 index = 0; index < invalidCodes.length; ++index) {
            string memory code = invalidCodes[index];
            require(!registry.isValidCode(code), "invalid code reported valid");
            require(!registry.isRegistered(code), "invalid code reported registered");

            (bool payoutSucceeded,) =
                address(registry).staticcall(abi.encodeCall(BuilderRegistry.payoutAddress, (code)));
            require(!payoutSucceeded, "invalid payout lookup should revert");

            (bool uriSucceeded,) =
                address(registry).staticcall(abi.encodeCall(BuilderRegistry.codeURI, (code)));
            require(!uriSucceeded, "invalid URI lookup should revert");
        }
    }

    function testCanonicalResolverDistinguishesUnknownCode() public view {
        string memory code = "unknown-code";
        bytes32 hash = registry.codeHash(code);

        require(registry.isValidCode(code), "unknown code should still be well formed");
        require(!registry.isRegistered(code), "unknown code should not be registered");
        _requireLookupRevert(
            abi.encodeCall(BuilderRegistry.payoutAddress, (code)),
            BuilderRegistry.CodeNotRegistered.selector,
            hash
        );
        _requireLookupRevert(
            abi.encodeCall(BuilderRegistry.codeURI, (code)),
            BuilderRegistry.CodeNotRegistered.selector,
            hash
        );
    }

    function testCanonicalResolverDistinguishesInactiveCode() public {
        string memory code = "avax-impact";
        alice.register(registry, code, address(0xA11CE), "ipfs://builder-metadata");
        alice.deactivateCode(registry, code);
        bytes32 hash = registry.codeHash(code);

        require(registry.isValidCode(code), "inactive code should remain well formed");
        require(!registry.isRegistered(code), "inactive code should not be registered");
        _requireLookupRevert(
            abi.encodeCall(BuilderRegistry.payoutAddress, (code)),
            BuilderRegistry.CodeInactive.selector,
            hash
        );
        _requireLookupRevert(
            abi.encodeCall(BuilderRegistry.codeURI, (code)),
            BuilderRegistry.CodeInactive.selector,
            hash
        );

        BuilderRegistry.BuilderRecord memory record = registry.resolve(code);
        require(!record.active, "resolve extension should expose inactive record");
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
        require(
            registry.payoutAddress("avax-impact") == address(0xBEEF),
            "canonical payout did not track update"
        );
        require(
            _equal(registry.codeURI("avax-impact"), "ipfs://v3"),
            "canonical URI did not track update"
        );
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

    function testFuzzIsValidCodeNeverReverts(bytes calldata rawCode) public view {
        string memory code = string(rawCode);
        (bool validitySucceeded, bytes memory validityData) =
            address(registry).staticcall(abi.encodeCall(BuilderRegistry.isValidCode, (code)));
        require(validitySucceeded, "isValidCode reverted");
        require(validityData.length == 32, "invalid isValidCode return data");

        bool valid = abi.decode(validityData, (bool));
        (bool strictValidationSucceeded,) = address(registry).staticcall(
            abi.encodeCall(BuilderRegistry.validateBuilderCode, (code))
        );
        require(valid == strictValidationSucceeded, "validation APIs disagree");
        if (!valid) require(!registry.isRegistered(code), "invalid code reported registered");
    }

    function testFuzzCanonicalViewsTrackLifecycle(
        uint256 seed,
        address initialPayout,
        address updatedPayout,
        bytes32 metadataSeed
    ) public {
        if (initialPayout == address(0)) initialPayout = address(1);
        if (updatedPayout == address(0)) updatedPayout = address(2);
        string memory code = _validCode(seed);
        string memory metadata = string(abi.encodePacked("ipfs://", metadataSeed));

        alice.register(registry, code, initialPayout, "ipfs://initial");
        require(registry.isValidCode(code), "generated code should be valid");
        require(registry.payoutAddress(code) == initialPayout, "initial payout mismatch");

        alice.updatePayoutAddress(registry, code, updatedPayout);
        alice.updateMetadataURI(registry, code, metadata);
        require(registry.payoutAddress(code) == updatedPayout, "updated payout mismatch");
        require(_equal(registry.codeURI(code), metadata), "updated URI mismatch");

        alice.deactivateCode(registry, code);
        require(!registry.isRegistered(code), "inactive fuzz code reported registered");
        _requireLookupRevert(
            abi.encodeCall(BuilderRegistry.payoutAddress, (code)),
            BuilderRegistry.CodeInactive.selector,
            registry.codeHash(code)
        );
    }

    function _expectRegisterFailure(string memory code) private {
        (bool succeeded,) = address(alice).call(
            abi.encodeCall(RegistryActor.register, (registry, code, address(0xA11CE), ""))
        );
        require(!succeeded, "invalid code should revert");
    }

    function _requireLookupRevert(bytes memory callData, bytes4 errorSelector, bytes32 codeHash)
        private
        view
    {
        (bool succeeded, bytes memory revertData) = address(registry).staticcall(callData);
        require(!succeeded, "lookup should revert");
        require(
            keccak256(revertData) == keccak256(abi.encodeWithSelector(errorSelector, codeHash)),
            "unexpected lookup error"
        );
    }

    function _validCode(uint256 seed) private pure returns (string memory) {
        bytes16 alphabet = "0123456789abcdef";
        bytes memory code = new bytes(12);
        code[0] = bytes1("f");
        code[1] = bytes1("u");
        code[2] = bytes1("z");
        code[3] = bytes1("z");
        for (uint256 index = 4; index < code.length; ++index) {
            code[index] = alphabet[(seed >> ((index - 4) * 4)) & 0x0f];
        }
        return string(code);
    }

    function _equal(string memory first, string memory second) private pure returns (bool) {
        return keccak256(bytes(first)) == keccak256(bytes(second));
    }
}
