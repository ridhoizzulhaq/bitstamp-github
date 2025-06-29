// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract BitstampNFT is ERC721URIStorage, EIP712 {
    using ECDSA for bytes32;

    string private constant NAME    = "BitstampNFT";
    string private constant VERSION = "1";

    // EIP-712 typehash for our voucher struct
    bytes32 private constant VOUCHER_TYPEHASH =
        keccak256("NFTVoucher(address recipient,string uri)");

    // Address that is authorized to sign minting vouchers
    address public immutable voucherSigner;

    // Keep track of which voucher digests have been redeemed
    mapping(bytes32 => bool) public redeemed;

    constructor(address _voucherSigner)
        ERC721("BitstampNFT", "BSTAMP")
        EIP712(NAME, VERSION)
    {
        voucherSigner = _voucherSigner;
    }

    /// @notice Defines the voucher structure for lazy minting
    struct NFTVoucher {
        address recipient; // who will receive the NFT
        string  uri;       // tokenURI for the NFT metadata
    }

    /**
     * @notice Redeem a signed voucher to mint an NFT
     * @param voucher    The NFTVoucher struct (recipient + metadata URI)
     * @param signature  EIP-712 signature from the authorized signer
     */
    function redeem(NFTVoucher calldata voucher, bytes calldata signature)
        external
        returns (uint256)
    {
        // 1. Recreate the EIP-712 digest that was signed
        bytes32 structHash = keccak256(
            abi.encode(
                VOUCHER_TYPEHASH,
                voucher.recipient,
                keccak256(bytes(voucher.uri))
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // 2. Recover the signer address
        address signer = digest.recover(signature);
        require(signer == voucherSigner, "Invalid or unauthorized signature");

        // 3. Prevent replay: mark this voucher used
        require(!redeemed[digest], "Voucher already redeemed");
        redeemed[digest] = true;

        // 4. Mint the NFT to the recipient
        //    Use the digest as a pseudo-random tokenId or simply hash it
        uint256 tokenId = uint256(digest);
        _safeMint(voucher.recipient, tokenId);
        _setTokenURI(tokenId, voucher.uri);

        return tokenId;
    }
}