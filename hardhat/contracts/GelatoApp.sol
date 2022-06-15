//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";
import {ITaskTreasury} from "./gelato/ITaskTreasury.sol";

contract GelatoApp is OpsReady, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    uint256 lastPartyStart = 0;
    bool headachePresent = false;

    mapping(address => bytes32) taskIdByUser;

    constructor(address payable _ops, address payable _treasury)
        OpsReady(_ops, payable(_treasury)) {}

    // ============= =============  USER Misc ============= ============= //
    // #region USER Misc

    function headacheFinish() public {
      headachePresent = false;
    }

    // #endregion USER Misc 


    // ============= =============  TASK Interaction ============= ============= //
    // #region TASK Interaction

    receive() external payable {}
   
    function createTaskNoPrePayment() public {
        require(taskIdByUser[msg.sender] == bytes32(0), "TASK_STILL_ACTIVE");
      
        //// every task will be payed with a transfer, therefore receive(), we have to fund the contract
        uint256 fee;
        address feeToken;

        (fee, feeToken) = IOps(ops).getFeeDetails();
        _transfer(fee, feeToken);

        bytes32 taskId = IOps(ops).createTaskNoPrepayment(
            address(this),
            /// sdad
            this.startParty.selector,
            address(this),
            abi.encodeWithSelector(this.checker.selector),
            ETH
        );
        taskIdByUser[msg.sender] = taskId;
    }

    function createTaskAndCancel() public {
        bytes32 taskId = IOps(ops).createTaskNoPrepayment(
            address(this),
            /// sdad
            this.startPartyandCancel.selector,
            address(this),
            abi.encodeWithSelector(this.checker.selector),
            ETH
        );
        taskIdByUser[msg.sender] = taskId;
    }

    function createTask() public {
        require(taskIdByUser[msg.sender] == bytes32(0), "TASK_STILL_ACTIVE");

        bytes32 taskId = IOps(ops).createTask(
            address(this),
            /// sdad
            this.startParty.selector,
            address(this),
            abi.encodeWithSelector(this.checker.selector)
        );
        taskIdByUser[msg.sender] = taskId;
    }

    function cancelTask() public {
        bytes32 _taskId = taskIdByUser[msg.sender];
        require(_taskId != bytes32(0), "NO_TASK_AVAILABLE");
        IOps(ops).cancelTask(_taskId);
        taskIdByUser[msg.sender] = bytes32(0);
    }

    function cancelTask(bytes32 _taskId) public {
        IOps(ops).cancelTask(_taskId);
        taskIdByUser[msg.sender] = bytes32(0);
    }

    // #endregion TASK Interaction

    // ============= =============  TREASURY USER Interaction ============= ============= //
    // #region TREASURY Interaction

    function fundGelato(uint256 amount) public payable {
        require(msg.value == amount, "NO_FUNDING");
        ITaskTreasury(treasury).depositFunds{value: amount}(
            address(this),
            ETH,
            amount
        );
    }

    function withdrawGelato() public onlyOwner {
        uint256 maxAmount = ITaskTreasury(treasury).userTokenBalance(
            address(this),
            ETH
        );
        ITaskTreasury(treasury).withdrawFunds(
            payable(msg.sender),
            ETH,
            maxAmount
        );
    }


    // #endregion TREASURY Interaction

    // ============= =============  GELATO Interaction ============= ============= //
    // #region GELATO Interaction

    function checker()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = headachePresent && (block.timestamp - lastPartyStart > 300);

        execPayload = abi.encodeWithSelector(this.startParty.selector);
    }

    function startParty() external onlyOps {
        require(headachePresent == true, "NOT_READY");
        require(block.timestamp - lastPartyStart > 300, "NOT_YET_TIME");
        lastPartyStart = block.timestamp;
        headachePresent = true;
    }

    function checkerCancel()
        external
        view
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = headachePresent && (block.timestamp - lastPartyStart > 300);

        execPayload = abi.encodeWithSelector(this.startPartyandCancel.selector);
    }

    function startPartyandCancel() external onlyOps {
        require(headachePresent == true, "NOT_READY");
        require(block.timestamp - lastPartyStart > 300, "NOT_YET_TIME");
        cancelTask(taskIdByUser[msg.sender]);
        lastPartyStart = block.timestamp;
        headachePresent = true;
    }

    // #endregion GELATO Interaction
}
