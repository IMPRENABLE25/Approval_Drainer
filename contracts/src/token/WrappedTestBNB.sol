// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Enveloppe du tBNB natif pour les exercices nécessitant un ERC-20.
/// @dev Sans valeur et destinée au BNB Smart Chain Testnet uniquement.
contract WrappedTestBNB is ERC20, ReentrancyGuard {
    error ZeroAmount();
    error NativeTransferFailed();

    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);

    constructor() ERC20("Wrapped Test BNB", "WTBNB") {}

    function deposit() public payable {
        if (msg.value == 0) revert ZeroAmount();
        _mint(msg.sender, msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    receive() external payable {
        deposit();
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        _burn(msg.sender, amount);
        (bool success,) = payable(msg.sender).call{value: amount}("");
        if (!success) revert NativeTransferFailed();
        emit Withdrawal(msg.sender, amount);
    }
}
