//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";
import {ITaskTreasury} from "./gelato/ITaskTreasury.sol";

contract PartyApp is OpsReady, Ownable {
  using SafeMath for uint256;
  using Counters for Counters.Counter;

  uint256 public lastPartyStart = 0;
  bool public headachePresent = false;

  mapping(address => bytes32) taskIdByUser;

  constructor(address payable _ops, address payable _treasury)
    OpsReady(_ops, payable(_treasury))
  {
    lastPartyStart = block.timestamp;
  }

  // ============= =============  USER Misc ============= ============= //
  // #region USER Misc

  function headacheFinish() public {
    headachePresent = false;
  }

  // #endregion USER Misc

  // ============= =============  TASK Interaction ============= ============= //
  // #region TASK Interaction

  receive() external payable {}

  function createTaskNoPrepayment() public payable {
   
    require(taskIdByUser[msg.sender] == bytes32(0), "TASK_STILL_ACTIVE");
   
     require(msg.value > 0.1 ether || address(this).balance > 0.1 ether, "NO_FUNDING");

    bytes32 taskId = IOps(ops).createTaskNoPrepayment(
      address(this),
      /// sdad
      this.startPartyNoPrepayment.selector,
      address(this),
      abi.encodeWithSelector(this.checkerNoPrepayment.selector),
      ETH
    );
    taskIdByUser[msg.sender] = taskId;
  }

  function createTaskAndCancel() public {
    bytes32 taskId = IOps(ops).createTask(
      address(this),
      /// sdad
      this.startPartyandCancel.selector,
      address(this),
      abi.encodeWithSelector(this.checkerCancel.selector, msg.sender)
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

  function cancelTaskById(bytes32 _taskId) public {
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

    ITaskTreasury(treasury).withdrawFunds(payable(msg.sender), ETH, maxAmount);
  }

  function withdrawContract() external onlyOwner returns (bool) {
    (bool result, ) = payable(msg.sender).call{value: address(this).balance}(
      ""
    );
    return result;
  }

  // #endregion TREASURY Interaction

  // ============= =============  GELATO Interaction ============= ============= //
  // #region GELATO Interaction

  function checker()
    external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    // block.timestamp - lastPartyStart > 300 &&
    canExec = headachePresent == false;

    execPayload = abi.encodeWithSelector(this.startParty.selector);
  }

  function startParty() external onlyOps {
    require(headachePresent == false, "NOT_READY");
    // require(block.timestamp - lastPartyStart > 180, "NOT_YET_TIME");
    lastPartyStart = block.timestamp;
    headachePresent = true;
  }

  function checkerCancel(address user)
    external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = headachePresent == false;
    console.log(164);
    console.log(user);
    execPayload = abi.encodeWithSelector(
      this.startPartyandCancel.selector,
      user
    );
  }

  function startPartyandCancel(address user) external onlyOps {
    require(headachePresent == false, "NOT_READY");
    console.log(171);
    console.log(user);
    // require(block.timestamp - lastPartyStart > 300, "NOT_YET_TIME");
    cancelTaskById(taskIdByUser[user]);
    lastPartyStart = block.timestamp;
    headachePresent = true;
  }

  function checkerNoPrepayment()
    external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    // block.timestamp - lastPartyStart > 300 &&
    canExec = headachePresent == false;

    execPayload = abi.encodeWithSelector(this.startParty.selector);
  }

  function startPartyNoPrepayment() external onlyOps {
    require(headachePresent == false, "NOT_READY");
    // require(block.timestamp - lastPartyStart > 180, "NOT_YET_TIME");
    //// every task will be payed with a transfer, therefore receive(), we have to fund the contract
    uint256 fee;
    address feeToken;
    console.log(fee);
    console.log(feeToken);
    (fee, feeToken) = IOps(ops).getFeeDetails();

    _transfer(fee, feeToken);
    lastPartyStart = block.timestamp;
    headachePresent = true;
  }

  // #endregion GELATO Interaction
}
