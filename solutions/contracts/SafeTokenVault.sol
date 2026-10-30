// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Safer educational counterpart to ApprovalDrainer.
/// @dev Users can deposit only their own tokens; withdrawals always go back to the caller.
contract SafeTokenVault is ReentrancyGuard {
    using SafeERC20 for IERC20;

    mapping(IERC20 token => mapping(address account => uint256 amount)) public deposited;

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientDeposit(uint256 available, uint256 requested);
    error UnsupportedTokenBehavior(uint256 requested, uint256 received);

    event Deposited(address indexed account, address indexed token, uint256 amount);
    event Withdrawn(address indexed account, address indexed token, uint256 amount);

    function deposit(IERC20 token, uint256 amount) external nonReentrant {
        if (address(token) == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 balanceBefore = token.balanceOf(address(this));
        token.safeTransferFrom(msg.sender, address(this), amount);
        uint256 received = token.balanceOf(address(this)) - balanceBefore;
        if (received != amount) revert UnsupportedTokenBehavior(amount, received);

        deposited[token][msg.sender] += amount;
        emit Deposited(msg.sender, address(token), amount);
    }

    function withdraw(IERC20 token, uint256 amount) external nonReentrant {
        if (address(token) == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        uint256 available = deposited[token][msg.sender];
        if (amount > available) revert InsufficientDeposit(available, amount);

        deposited[token][msg.sender] = available - amount;
        uint256 balanceBefore = token.balanceOf(msg.sender);
        token.safeTransfer(msg.sender, amount);
        uint256 received = token.balanceOf(msg.sender) - balanceBefore;
        if (received != amount) revert UnsupportedTokenBehavior(amount, received);

        emit Withdrawn(msg.sender, address(token), amount);
    }
}
