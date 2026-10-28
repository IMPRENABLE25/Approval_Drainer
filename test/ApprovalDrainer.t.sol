// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ApprovalDrainer} from "../contracts/src/vulnerable/ApprovalDrainer.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test Token", "TEST") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }
}

contract ApprovalDrainerTest is Test {
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    TestToken internal token;
    ApprovalDrainer internal drainer;

    function setUp() public {
        token = new TestToken();
        drainer = new ApprovalDrainer();
        token.mint(alice, 100 ether);
    }

    function test_WalletConnectionAloneDoesNotAuthorizeTransfer() public {
        vm.expectRevert();
        drainer.exerciseAllowance(address(token), alice, bob, 1 ether);
        assertEq(token.balanceOf(alice), 100 ether);
    }

    function test_AllowancePermitsOnlyApprovedAmount() public {
        vm.prank(alice);
        token.approve(address(drainer), 10 ether);

        drainer.exerciseAllowance(address(token), alice, bob, 4 ether);
        assertEq(token.balanceOf(bob), 4 ether);
        assertEq(token.allowance(alice, address(drainer)), 6 ether);

        vm.expectRevert();
        drainer.exerciseAllowance(address(token), alice, bob, 7 ether);
    }

    function test_RevocationBlocksFurtherTransfers() public {
        vm.startPrank(alice);
        token.approve(address(drainer), 10 ether);
        token.approve(address(drainer), 0);
        vm.stopPrank();

        assertEq(token.allowance(alice, address(drainer)), 0);
        vm.expectRevert();
        drainer.exerciseAllowance(address(token), alice, bob, 1 ether);
    }

    function test_MaxAllowanceRemainsAfterTransfer() public {
        vm.prank(alice);
        token.approve(address(drainer), type(uint256).max);

        drainer.exerciseAllowance(address(token), alice, bob, 5 ether);
        assertEq(token.allowance(alice, address(drainer)), type(uint256).max);
    }

    function testFuzz_TransferNeverExceedsAllowance(uint96 allowanceAmount, uint96 requestedAmount) public {
        uint256 allowed = bound(uint256(allowanceAmount), 1, 100 ether);
        uint256 requested = bound(uint256(requestedAmount), allowed + 1, type(uint96).max);
        vm.prank(alice);
        token.approve(address(drainer), allowed);

        vm.expectRevert();
        drainer.exerciseAllowance(address(token), alice, bob, requested);
        assertEq(token.balanceOf(bob), 0);
    }

}
