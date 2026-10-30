// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeTokenVault} from "../contracts/SafeTokenVault.sol";

contract VaultTestToken is ERC20 {
    constructor() ERC20("Vault Test Token", "VTT") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}

contract SafeTokenVaultTest is Test {
    address internal owner = makeAddr("owner");
    address internal thirdParty = makeAddr("thirdParty");
    VaultTestToken internal token;
    SafeTokenVault internal vault;

    function setUp() public {
        token = new VaultTestToken();
        vault = new SafeTokenVault();
        token.mint(owner, 100 ether);
    }

    function test_OwnerDepositPullsOnlyOwnersTokens() public {
        vm.startPrank(owner);
        token.approve(address(vault), 10 ether);
        vault.deposit(token, 10 ether);
        vm.stopPrank();

        assertEq(token.balanceOf(owner), 90 ether);
        assertEq(token.balanceOf(address(vault)), 10 ether);
        assertEq(vault.deposited(token, owner), 10 ether);
    }

    function test_ThirdPartyCannotUseOwnersAllowanceToDepositForItself() public {
        vm.prank(owner);
        token.approve(address(vault), 10 ether);

        vm.expectRevert();
        vm.prank(thirdParty);
        vault.deposit(token, 10 ether);

        assertEq(token.balanceOf(owner), 100 ether);
        assertEq(vault.deposited(token, owner), 0);
        assertEq(vault.deposited(token, thirdParty), 0);
    }

    function test_ThirdPartyCannotWithdrawOwnersDeposit() public {
        vm.startPrank(owner);
        token.approve(address(vault), 10 ether);
        vault.deposit(token, 10 ether);
        vm.stopPrank();

        vm.expectRevert(abi.encodeWithSelector(SafeTokenVault.InsufficientDeposit.selector, 0, 1 ether));
        vm.prank(thirdParty);
        vault.withdraw(token, 1 ether);

        assertEq(token.balanceOf(owner), 90 ether);
        assertEq(token.balanceOf(thirdParty), 0);
        assertEq(vault.deposited(token, owner), 10 ether);
    }

    function test_OwnerWithdrawsOnlyToSelf() public {
        vm.startPrank(owner);
        token.approve(address(vault), 10 ether);
        vault.deposit(token, 10 ether);
        vault.withdraw(token, 4 ether);
        vm.stopPrank();

        assertEq(token.balanceOf(owner), 94 ether);
        assertEq(token.balanceOf(address(vault)), 6 ether);
        assertEq(vault.deposited(token, owner), 6 ether);
    }
}
