// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ApprovalDrainer} from "../contracts/src/vulnerable/ApprovalDrainer.sol";
import {WrappedTestBNB} from "../contracts/src/token/WrappedTestBNB.sol";

/// @notice Déploie uniquement WTBNB et ApprovalDrainer sur BSC Testnet.
contract DeployBscTestnet is Script {
    function run() external {
        require(block.chainid == 97, "BSC Testnet only");
        uint256 deployerKey = vm.envUint("BSC_TESTNET_PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        WrappedTestBNB wrappedTbnb = new WrappedTestBNB();
        ApprovalDrainer drainer = new ApprovalDrainer();
        vm.stopBroadcast();

        console2.log("BSC Testnet chain ID:", block.chainid);
        console2.log("Wrapped test BNB (WTBNB):", address(wrappedTbnb));
        console2.log("ApprovalDrainer (intentionally vulnerable):", address(drainer));

        string memory deployment = vm.serializeUint("bscTestnet", "chainId", block.chainid);
        deployment = vm.serializeAddress("bscTestnet", "wrappedTbnb", address(wrappedTbnb));
        deployment = vm.serializeAddress("bscTestnet", "approvalDrainer", address(drainer));
        vm.writeJson(deployment, string.concat(vm.projectRoot(), "/deployments/bsc-testnet.json"));
    }
}
