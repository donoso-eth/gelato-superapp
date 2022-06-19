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
  bool public headachePresent = true;

  mapping(address => bytes32) taskIdByUser;

  constructor(address payable _ops, address payable _treasury)
    OpsReady(_ops, payable(_treasury))
  {
    lastPartyStart = block.timestamp;
  }

  // ============= =============  USER  ============= ============= //
  // #region USER Misc


  // #endregion USER Misc

  // ============= =============  TASK Interaction ============= ============= //
  // #region TASK Interaction

  receive() external payable {}

  function createTaskNoPrepayment() public payable {
   
    require(taskIdByUser[msg.sender] == bytes32(0), "TASK_STILL_ACTIVE");
   
     require(msg.value >= 0.1 ether || address(this).balance > 0.1 ether, "NO_FUNDING");

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




  // #endregion TASK Interaction

   // ============= =============  ADMIN && TREASURY ============= ============= //
   // #region ADMIN && TREASURY

  // Change Headache status to 'No headacche'
    function headacheFinish() public {
    headachePresent = false;
  }

    function headacheStart() public {
    headachePresent = true;
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

  // #endregion ADMIN && TREASURY

    // ============= ============= Create Simple Task Use Case Business Logic  ============= ============= //
    // #region Create Simple Task Use Case Business Logic 

    /**************************************************************************
     * Stop Stream Use Case Business Logic
     *
     * Step 1 : createTask() 
     *          - will create a gelato task
     *          - will store the taskId
     *
     * Step 2 : checkerstartParty() Function.
     *          - Check If the task can be executed , in rhis case if we have not headache
     *          - returns the execPayload of startParty()
     *
     * Step 3 : Executable Function: startParty()
     *          - will Start the party setting lastPartyStrt to block.timestamo
     *          - will cause a headache
     *************************************************************************/
    
    function createTask() public {
    require(taskIdByUser[msg.sender] == bytes32(0), "TASK_STILL_ACTIVE");

    bytes32 taskId = IOps(ops).createTask(
      address(this), /// Contract executing the task
      this.startParty.selector, /// Executable function's selector
      address(this), /// Resolver contract, in our case will be the same
      abi.encodeWithSelector(this.checkerStartParty.selector) /// Checker Condition
    );
    taskIdByUser[msg.sender] = taskId;
  }

  function checkerStartParty()
    external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = headachePresent == false;
    execPayload = abi.encodeWithSelector(this.startParty.selector);
  }

  function startParty() external onlyOps {
    require(headachePresent == false, "NOT_READY");
    lastPartyStart = block.timestamp;
    headachePresent = true;
  }

  // #endregion Create Simple Task Use Case Business Logic 



  function checkerCancel(address user)
    external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = headachePresent == false;

    execPayload = abi.encodeWithSelector(
      this.startPartyandCancel.selector,
      user
    );
  }

  function startPartyandCancel(address user) external onlyOps {
    require(headachePresent == false, "NOT_READY");

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
