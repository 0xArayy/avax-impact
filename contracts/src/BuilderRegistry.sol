// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title BuilderRegistry
/// @notice Maps human-readable builder codes to their owner, payout address, and metadata.
/// @dev The registry does not authorize attributed transactions and never holds user funds.
contract BuilderRegistry {
    uint256 public constant MIN_CODE_LENGTH = 3;
    uint256 public constant MAX_CODE_LENGTH = 32;
    uint256 public constant MAX_METADATA_URI_LENGTH = 512;

    struct BuilderRecord {
        string code;
        address owner;
        address payoutAddress;
        string metadataURI;
        uint64 registeredAt;
        bool active;
    }

    error InvalidCodeLength(uint256 length);
    error InvalidCodeCharacter(uint256 index, bytes1 character);
    error InvalidCodeFormat();
    error MetadataURITooLong(uint256 length);
    error ZeroAddress();
    error CodeAlreadyRegistered(bytes32 codeHash);
    error CodeNotRegistered(bytes32 codeHash);
    error CodeInactive(bytes32 codeHash);
    error NotCodeOwner(bytes32 codeHash, address caller);

    event BuilderRegistered(
        bytes32 indexed codeHash,
        string code,
        address indexed owner,
        address indexed payoutAddress,
        string metadataURI
    );
    event PayoutAddressUpdated(
        bytes32 indexed codeHash, address indexed previousAddress, address indexed newAddress
    );
    event MetadataURIUpdated(bytes32 indexed codeHash, string previousURI, string newURI);
    event CodeOwnershipTransferred(
        bytes32 indexed codeHash, address indexed previousOwner, address indexed newOwner
    );
    event BuilderDeactivated(bytes32 indexed codeHash, address indexed owner);

    mapping(bytes32 codeHash => BuilderRecord record) private records;

    /// @notice Registers a unique builder code for the caller.
    function register(string calldata code, address payoutAddress, string calldata metadataURI)
        external
    {
        _validateCode(code);
        _validatePayoutAddress(payoutAddress);
        _validateMetadataURI(metadataURI);

        bytes32 hash = codeHash(code);
        if (records[hash].owner != address(0)) revert CodeAlreadyRegistered(hash);

        records[hash] = BuilderRecord({
            code: code,
            owner: msg.sender,
            payoutAddress: payoutAddress,
            metadataURI: metadataURI,
            registeredAt: uint64(block.timestamp),
            active: true
        });

        emit BuilderRegistered(hash, code, msg.sender, payoutAddress, metadataURI);
    }

    /// @notice Updates the payout address associated with an active builder code.
    function updatePayoutAddress(string calldata code, address newPayoutAddress) external {
        _validatePayoutAddress(newPayoutAddress);
        bytes32 hash = codeHash(code);
        BuilderRecord storage record = _activeRecordOwnedByCaller(hash);
        address previousAddress = record.payoutAddress;
        record.payoutAddress = newPayoutAddress;
        emit PayoutAddressUpdated(hash, previousAddress, newPayoutAddress);
    }

    /// @notice Updates the offchain metadata URI associated with an active builder code.
    function updateMetadataURI(string calldata code, string calldata newMetadataURI) external {
        _validateMetadataURI(newMetadataURI);
        bytes32 hash = codeHash(code);
        BuilderRecord storage record = _activeRecordOwnedByCaller(hash);
        string memory previousURI = record.metadataURI;
        record.metadataURI = newMetadataURI;
        emit MetadataURIUpdated(hash, previousURI, newMetadataURI);
    }

    /// @notice Transfers control of an active builder code to another address.
    function transferCode(string calldata code, address newOwner) external {
        if (newOwner == address(0)) revert ZeroAddress();
        bytes32 hash = codeHash(code);
        BuilderRecord storage record = _activeRecordOwnedByCaller(hash);
        address previousOwner = record.owner;
        record.owner = newOwner;
        emit CodeOwnershipTransferred(hash, previousOwner, newOwner);
    }

    /// @notice Permanently deactivates a builder code.
    /// @dev Deactivated codes cannot be re-registered, preventing identity takeover.
    function deactivateCode(string calldata code) external {
        bytes32 hash = codeHash(code);
        BuilderRecord storage record = _activeRecordOwnedByCaller(hash);
        record.active = false;
        emit BuilderDeactivated(hash, msg.sender);
    }

    /// @notice Resolves a code, including a record that has been deactivated.
    function resolve(string calldata code) external view returns (BuilderRecord memory) {
        bytes32 hash = codeHash(code);
        BuilderRecord storage record = records[hash];
        if (record.owner == address(0)) revert CodeNotRegistered(hash);
        return record;
    }

    /// @notice Returns true only when the code exists and is active.
    function isRegistered(string calldata code) external view returns (bool) {
        BuilderRecord storage record = records[codeHash(code)];
        return record.owner != address(0) && record.active;
    }

    /// @notice Validates a code using the same rules as registration.
    function validateBuilderCode(string calldata code) external pure returns (bool) {
        _validateCode(code);
        return true;
    }

    function codeHash(string memory code) public pure returns (bytes32) {
        return keccak256(bytes(code));
    }

    function _activeRecordOwnedByCaller(bytes32 hash)
        private
        view
        returns (BuilderRecord storage record)
    {
        record = records[hash];
        if (record.owner == address(0)) revert CodeNotRegistered(hash);
        if (!record.active) revert CodeInactive(hash);
        if (record.owner != msg.sender) revert NotCodeOwner(hash, msg.sender);
    }

    function _validateCode(string calldata code) private pure {
        bytes calldata value = bytes(code);
        uint256 length = value.length;
        if (length < MIN_CODE_LENGTH || length > MAX_CODE_LENGTH) {
            revert InvalidCodeLength(length);
        }

        if (value[0] == bytes1("-") || value[length - 1] == bytes1("-")) {
            revert InvalidCodeFormat();
        }

        bool previousWasHyphen;
        for (uint256 index = 0; index < length; ++index) {
            bytes1 character = value[index];
            bool isLowercaseLetter = character >= bytes1("a") && character <= bytes1("z");
            bool isNumber = character >= bytes1("0") && character <= bytes1("9");
            bool isHyphen = character == bytes1("-");
            if (!isLowercaseLetter && !isNumber && !isHyphen) {
                revert InvalidCodeCharacter(index, character);
            }
            if (isHyphen && previousWasHyphen) revert InvalidCodeFormat();
            previousWasHyphen = isHyphen;
        }
    }

    function _validatePayoutAddress(address payoutAddress) private pure {
        if (payoutAddress == address(0)) revert ZeroAddress();
    }

    function _validateMetadataURI(string calldata metadataURI) private pure {
        uint256 length = bytes(metadataURI).length;
        if (length > MAX_METADATA_URI_LENGTH) revert MetadataURITooLong(length);
    }
}
