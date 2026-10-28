// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WrappedTestBNB} from "../contracts/src/token/WrappedTestBNB.sol";

contract WrappedTestBNBTest is Test {
    WrappedTestBNB internal wrapped;

    receive() external payable {}

    function setUp() public {
        wrapped = new WrappedTestBNB();
        vm.deal(address(this), 10 ether);
    }

    function test_DepositMintsOneToOneAndKeepsBacking() public {
        wrapped.deposit{value: 2 ether}();

        assertEq(wrapped.balanceOf(address(this)), 2 ether);
        assertEq(address(wrapped).balance, 2 ether);
    }

    function test_WithdrawBurnsAndReturnsNativeTestBnb() public {
        wrapped.deposit{value: 3 ether}();
        uint256 balanceBefore = address(this).balance;

        wrapped.withdraw(1 ether);

        assertEq(wrapped.balanceOf(address(this)), 2 ether);
        assertEq(address(wrapped).balance, 2 ether);
        assertEq(address(this).balance, balanceBefore + 1 ether);
    }

    function test_RevertWhenDepositingZero() public {
        vm.expectRevert(WrappedTestBNB.ZeroAmount.selector);
        wrapped.deposit();
    }

    function test_RevertWhenWithdrawingZero() public {
        vm.expectRevert(WrappedTestBNB.ZeroAmount.selector);
        wrapped.withdraw(0);
    }

    function test_RevertWhenWithdrawingMoreThanBalance() public {
        wrapped.deposit{value: 1 ether}();

        vm.expectRevert();
        wrapped.withdraw(2 ether);
    }
}
