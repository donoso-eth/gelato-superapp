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

  uint256 partyTime = 0;
  bool isDinnerReady;

  mapping(address => bytes32) taskIdByUser;

  constructor(address payable _ops, address payable _treasury)
    OpsReady(_ops, payable(_treasury))
  {
    isDinnerReady = false;
  }

  function fundGelato(uint256 amount) public payable {
    require(msg.value == 2 * amount, "NO_FUNDING");
     treasury.transfer(amount);

   // ITaskTreasury(treasury).depositFunds(address(this), ETH, amount, { value: depositAmount });
  }

  function withdrawGelato() public onlyOwner {
    uint256 maxAmount = ITaskTreasury(treasury).userTokenBalance(
      address(this),
      ETH
    );
    ITaskTreasury(treasury).withdrawFunds(payable(msg.sender), ETH, maxAmount);
  }

  receive() external payable {}

  function createTask() public {
    require(taskIdByUser[msg.sender] == bytes32(0), "TASK_STILL_ACTIVE");

    bytes32 taskId = IOps(ops).createTask(
      address(this),
      /// sdad
      this.setPartyTime.selector,
      address(this),
      abi.encodeWithSelector(this.checker.selector)
    );
    taskIdByUser[msg.sender] = taskId;
  }


  function checker() external view returns (bool canExec, bytes memory execPayload) {
    canExec = isDinnerReady;

    execPayload = abi.encodeWithSelector(this.setPartyTime.selector);
  }

  function setPartyTime() external onlyOps {
    require(isDinnerReady == true, "NOT_READY");
    partyTime = block.timestamp;
    isDinnerReady = false;
  }
}
