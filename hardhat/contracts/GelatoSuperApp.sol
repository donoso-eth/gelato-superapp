//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {ISuperfluid, ISuperAgreement, ISuperToken, ISuperApp, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

import {CFAv1Library} from "@superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";
import {ITaskTreasury} from "./gelato/ITaskTreasury.sol";


struct PlanStream {
  uint256 plannedStart;
  StreamConfig stream;

}

struct StreamConfig {
  address sender;
  address receiver;
  uint256 duration;
  int96 flowRate;
}



contract GelatoSuperApp is SuperAppBase, OpsReady, Ownable  {
  using SafeMath for uint256;
  using Counters for Counters.Counter;

  uint256 lastExecuted;
  uint256 public count;

  ISuperfluid public host; // host
  IConstantFlowAgreementV1 public cfa; // the stored constant flow agreement class address
  ISuperToken superToken;

  using CFAv1Library for CFAv1Library.InitData;
  CFAv1Library.InitData internal _cfaLib;

  mapping(address => bytes32) public taskIdByUser;
  mapping(bytes32 => address) public addressdByTaskId;

  constructor(
    ISuperfluid _host,
    ISuperToken _superToken,
    address payable _ops,
    address _treasury
  ) OpsReady(_ops, payable(_treasury)) {
    host = _host;

    superToken = _superToken;
    cfa = IConstantFlowAgreementV1(
      address(
        host.getAgreementClass(
          keccak256(
            "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
          )
        )
      )
    );

     _cfaLib = CFAv1Library.InitData(_host, cfa);

    uint256 configWord = SuperAppDefinitions.APP_LEVEL_FINAL |
      SuperAppDefinitions.BEFORE_AGREEMENT_CREATED_NOOP |
      SuperAppDefinitions.BEFORE_AGREEMENT_UPDATED_NOOP |
      SuperAppDefinitions.BEFORE_AGREEMENT_TERMINATED_NOOP;

    host.registerApp(configWord);

    lastExecuted = block.timestamp;
  }

  // ============= =============  Modifiers ============= ============= //
  // #region Modidiers

  modifier onlyHost() {
    require(msg.sender == address(host), "RedirectAll: support only one host");
    _;
  }

  modifier onlyExpected(ISuperToken _superToken, address agreementClass) {
    require(_isSameToken(_superToken), "RedirectAll: not accepted token");
    require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
    _;
  }

  // endregion

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


  function planStream(PlanStream memory config)external {

      console.log(block.timestamp + config.plannedStart);

      bytes32 taskId = IOps(ops).createTimedTask(
      uint128(block.timestamp + config.plannedStart),
      3600,
      address(this),
      this.startStream.selector,
      address(this),
      abi.encodeWithSelector(this.checkerPlanStream.selector, config.stream),
      ETH,
      true
    );
      taskIdByUser[config.stream.sender] = taskId;

  }

  function checkerPlanStream(StreamConfig memory stream)   external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = true;
    console.log(stream.receiver);
    execPayload = abi.encodeWithSelector(
      this.startStream.selector,
      stream
    );
  }

  function startStream(StreamConfig memory stream) external onlyOps {
    
   // bytes memory userData = abi.encode(stream.duration,stream.receiver);
    console.log(stream.sender);
    console.log(stream.receiver);
    console.log('streaming start');
    _cfaLib.createFlowByOperator(
      stream.sender,
      stream.receiver,
      superToken,
      stream.flowRate,
      "0x"
    );



    //// cancelprevoius task

    bytes32 oldTaskId = taskIdByUser[stream.sender];
    cancelTaskbyId(oldTaskId);

    //// create new timed at

      bytes32 taskId = IOps(ops).createTimedTask(
      uint128(block.timestamp + stream.duration),
      3600,
      address(this),
      this.stopPlannedStream.selector,
      address(this),
      abi.encodeWithSelector(this.checkerStopPlanStream.selector, stream.sender,stream.receiver),
      ETH,
      true
    );
      taskIdByUser[stream.sender] = taskId;
  }


  function checkerStopPlanStream(address sender, address receiver)   external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = true;

    execPayload = abi.encodeWithSelector(
      this.stopPlannedStream.selector,
      address(sender),
      address(receiver)
    );
  }



  function stopPlannedStream(address sender, address receiver) external onlyOps{


        /////// STOP IF EXISTS incoming stream
    (, int96 inFlowRate, , ) = cfa.getFlow(superToken, sender,receiver);

    console.log(uint96(inFlowRate));
    if (inFlowRate > 0) {
      host.callAgreement(
        cfa,
        abi.encodeWithSelector(
          cfa.deleteFlow.selector,
          superToken,
          sender,
          receiver,
          new bytes(0) // placeholder
        ),
        "0x"
      );
    }
    bytes32 _taskId = taskIdByUser[sender];
    cancelTaskbyId(_taskId);


  }




    function cancelTask() public {
    bytes32 _taskId = taskIdByUser[msg.sender];
    require(_taskId != bytes32(0), "NO_TASK_AVAILABLE");
    IOps(ops).cancelTask(_taskId);
    taskIdByUser[msg.sender] = bytes32(0);
  }


  function cancelTaskbyId(bytes32 _taskId)public {
    IOps(ops).cancelTask(_taskId);
     taskIdByUser[msg.sender] = bytes32(0);
  }

  function stopstream(address sender, address receiver) external onlyOps {
    //// check if


    /////// STOP IF EXISTS outcoming stream
    (, int96 outFlowRate, , ) = cfa.getFlow(superToken,address(this),receiver);

    if (outFlowRate > 0) {
      host.callAgreement(
        cfa,
        abi.encodeWithSelector(
          cfa.deleteFlow.selector,
          superToken,
          address(this),
          receiver,
          new bytes(0) // placeholder
        ),
        "0x"
      );
    }

    /////// STOP IF EXISTS incoming stream
    (, int96 inFlowRate, , ) = cfa.getFlow(superToken, sender, address(this));

    if (inFlowRate > 0) {
      host.callAgreement(
        cfa,
        abi.encodeWithSelector(
          cfa.deleteFlow.selector,
          superToken,
          sender,
          address(this),
          new bytes(0) // placeholder
        ),
        "0x"
      );
    }
    bytes32 _taskId = taskIdByUser[sender];
    cancelTaskbyId(_taskId);

  }

  function checker(address sender, address receiver)
    external
    view
    returns (bool canExec, bytes memory execPayload)
  {
    canExec = true;

    execPayload = abi.encodeWithSelector(
      this.stopstream.selector,
      address(sender),
      address(receiver)
    );
  }

  function withdraw() external returns (bool) {
    (bool result, ) = payable(msg.sender).call{value: address(this).balance}(
      ""
    );
    return result;
  }

  receive() external payable {
    // your code here…
  }

  /**************************************************************************
   * SuperApp callbacks
   *************************************************************************/

  function afterAgreementCreated(
    ISuperToken _superToken,
    address _agreementClass,
    bytes32, // _agreementId,
    bytes calldata _agreementData,
    bytes calldata, // _cbdata,
    bytes calldata _ctx
  )
    external
    override
    onlyExpected(_superToken, _agreementClass)
    onlyHost
    returns (bytes memory newCtx)
  {
    newCtx = _ctx;

    (address sender, address receiver) = abi.decode(
      _agreementData,
      (address, address)
    );
    ISuperfluid.Context memory decodedContext = host.decodeCtx(_ctx);

    (address to, uint256 duration) = abi.decode(
      decodedContext.userData,
      (address, uint256)
    );
    console.log(duration);
    console.log(to);
    (, int96 inFlowRate, , ) = cfa.getFlow(superToken, sender, address(this));

    (newCtx, ) = host.callAgreementWithContext(
      cfa,
      abi.encodeWithSelector(
        cfa.createFlow.selector,
        superToken,
        to,
        inFlowRate,
        new bytes(0) // placeholder
      ),
      "0x",
      newCtx
    );
    
    bytes32 taskId = IOps(ops).createTimedTask(
      uint128(block.timestamp + duration),
      180,
      address(this),
      this.stopstream.selector,
      address(this),
      abi.encodeWithSelector(this.checker.selector, sender,to),
      ETH,
      true
    );
      taskIdByUser[sender] = taskId;
    //registerGelato and set call back find stream

    return newCtx;
  }

  function afterAgreementTerminated(
    ISuperToken, /*superToken*/
    address, /*agreementClass*/
    bytes32, // _agreementId,
    bytes calldata _agreementData,
    bytes calldata, /*cbdata*/
    bytes calldata _ctx
  ) external virtual override returns (bytes memory newCtx) {
    (address sender, ) = abi.decode(_agreementData, (address, address));

    newCtx = _ctx;
  }

  function afterAgreementUpdated(
    ISuperToken _superToken,
    address _agreementClass,
    bytes32, // _agreementId,
    bytes calldata _agreementData,
    bytes calldata, //_cbdata,
    bytes calldata _ctx
  )
    external
    override
    onlyExpected(_superToken, _agreementClass)
    onlyHost
    returns (bytes memory newCtx)
  {
    newCtx = _ctx;
    (address sender, address receiver) = abi.decode(
      _agreementData,
      (address, address)
    );

    (, int96 inFlowRate, , ) = cfa.getFlow(superToken, sender, address(this));
  }

  /**************************************************************************
   * INTERNAL HELPERS
   *************************************************************************/

  function _isCFAv1(address agreementClass) private view returns (bool) {
    return
      ISuperAgreement(agreementClass).agreementType() ==
      keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1");
  }

  function _isSameToken(ISuperToken _superToken) private view returns (bool) {
    return address(_superToken) == address(superToken);
  }
}
