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

contract GelatoSuperApp is SuperAppBase, OpsReady, Ownable {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    uint256 lastExecuted;
    uint256 public count;

    bool fundContractFlag = false;
    bool createStreamFlag = false;
    bool stopStreamFlag = false;

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
        require(
            msg.sender == address(host),
            "RedirectAll: support only one host"
        );
        _;
    }

    modifier onlyExpected(ISuperToken _superToken, address agreementClass) {
        require(_isSameToken(_superToken), "RedirectAll: not accepted token");
        require(_isCFAv1(agreementClass), "RedirectAll: only CFAv1 supported");
        _;
    }

    // endregion


    // ============= =============  ADMIN && TREASURY ============= ============= //
    // #region ADMIN && TREASURY

    //// Check if bonus track is available
    function isBonusReady() public view returns (bool bonusReady) {
        if (
            taskIdByUser[msg.sender] == bytes32(0) &&
            fundContractFlag == true &&
            createStreamFlag == true &&
            stopStreamFlag == true
        ) {
            bonusReady = true;
        } else {
            bonusReady = false;
        }
    }

    //// Cancel Task
    function cancelTask() public {
        bytes32 _taskId = taskIdByUser[msg.sender];
        require(_taskId != bytes32(0), "NO_TASK_AVAILABLE");
        IOps(ops).cancelTask(_taskId);
        taskIdByUser[msg.sender] = bytes32(0);
    }

    //// Cancel Task by Id
    function cancelTaskbyId(bytes32 _taskId, address sender) public {
        IOps(ops).cancelTask(_taskId);
        taskIdByUser[sender] = bytes32(0);
    }

    //// Fund Gelato Treasury
    function fundGelato(uint256 amount) public payable {
        require(msg.value == amount, "NO_FUNDING");
        ITaskTreasury(treasury).depositFunds{value: amount}(
            address(this),
            ETH,
            amount
        );
        fundContractFlag = true;
    }

    //// Withdraw Gelato Treasury
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

    //// Withdraw  Contract

    function withdraw() external returns (bool) {
        (bool result, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        return result;
    }

    receive() external payable {
        // your code here…
    }

    // #endregion ADMIN && TREASURY 


    // ============= ============= Stop Stream Use Case Business Logic ============= ============= //
    // #region Stop Stream Use Case Business Logic

    /**************************************************************************
     * Stop Stream Use Case Business Logic
     *
     * Step 1 : createStopStreamTask() Internal function call from the super app callback
     *          (after created Stream in which also a stream will be created to the receiver)
     *          - will create a gelato timed task that will lauchh with start-time at the desired duration of the stream
     *          - will store the taskId
     *
     * Step 2 : checkerStopStream() Function.
     *          - always return "canExec = true" as we are only waiting to the time to execute
     *          - returns the execPayload of stopStream()
     *
     * Step 3 : Executable Function: stopStream()
     *          - will stop the outcoming stream from super app to receiver
     *          - will stop the incoming stream from sender to super app
     *          - will cancel the task so it only be executed once (no need to stop the stream twice)
     *************************************************************************/

    function createStopStreamTask(
        uint256 duration,
        address sender,
        address to
    ) internal {
        bytes32 taskId = IOps(ops).createTimedTask(
            uint128(duration), //// timestamp at which the task should be first  executed (stream should stop)
            3600, /// Interval between executions, we will cancel after the first
            address(this), /// Contract executing the task
            this.stopStream.selector,  /// Executable function's selector
            address(this), /// Resolver contract, in our case will be the same
            abi.encodeWithSelector(this.checkerStopStream.selector, sender, to),/// Checker Condition
            ETH, ///  feetoken
            true /// we will use the treasury contract for funding
        );
        taskIdByUser[sender] = taskId;
        createStreamFlag = true;
    }

    function checkerStopStream(address sender, address receiver)
        external
        pure
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = true;

        execPayload = abi.encodeWithSelector(
            this.stopStream.selector,
            address(sender),
            address(receiver)
        );
    }

    function stopStream(address sender, address receiver) external onlyOps {
        //// check if

        /////// STOP IF EXISTS outcoming stream
        (, int96 outFlowRate, , ) = cfa.getFlow(
            superToken,
            address(this),
            receiver
        );

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
        (, int96 inFlowRate, , ) = cfa.getFlow(
            superToken,
            sender,
            address(this)
        );

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
        cancelTaskbyId(_taskId,sender);
        stopStreamFlag = true;
    }

    // #endregion Stop Stream Use Case Business Logic


    // ============= ============= Start and Stop Stream Bonus Track#1 ============= ============= //
    // #region Plan Future Start and Future Stop

    /**************************************************************************
     * Start and Stop Stream Use Case Business Logic
     * What makes this use case special is that we are concatenating two use cases
     * Start Stream(a) and StopStream (b) being the Start Stream Step 3a, the Stop Steam Step 1b
     *
     * Step 1a : planStream() Public function called by the user
     *          - msg.sender will grant full stream permissions to contract
     *          - will create a gelato timed task that will lauchh with start-time at the desired stream start
     *          - will store the taskId
     *
     * Step 2a : checkerPlanStream() Function.
     *          - always return "canExec = true" as we are only waiting to the time to execute
     *          - returns the execPayload of startStream()
     *
     * Step 3a and 1b : Executable Function: startStream()
     *                  - will create a stream from sender to receiver (contrat has acl permissions)
     *                  - will cancel the task so it only run once
     *                  - will create a timed task to stop the stream
     *                  - will store the new taskId
     *
     * Step 2b: checkerStopPlanStream() function
     *          - always return "canExec = true" as we are only waiting to the time to execute
     *          - returns the execPayload of stopPlannedStream()
     *
     * Step 3: Executable Function: stopPlannedStream()
     *          - will stop the stream between sender and recevier
     *          - will cabcel the task so it only runs once
     *          
     *************************************************************************/
    
    function planStream(PlanStream memory config) external {

        bytes32 taskId = IOps(ops).createTimedTask(
            uint128(config.plannedStart), //// timestamp at which the task should be first  executed (stream should start)
            600, /// Interval between executions, we will cancel after the first
            address(this), /// Contract executing the task 
            this.startStream.selector, /// Executable function's selector
            address(this), /// Resolver contract, in our case will be the same
            abi.encodeWithSelector(
                this.checkerPlanStream.selector,
                config.stream
            ), /// Checker Condition
           ETH,  ///  feetoken
           true /// we will use the treasury contract for funding 
        );
        taskIdByUser[config.stream.sender] = taskId;
 
    }

    function checkerPlanStream(StreamConfig memory stream)
        external
        pure
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = true;
        execPayload = abi.encodeWithSelector(this.startStream.selector, stream);
    }

    function startStream(StreamConfig memory stream) external onlyOps {
        // bytes memory userData = abi.encode(stream.duration,stream.receiver);
  
        _cfaLib.createFlowByOperator(
            stream.sender,
            stream.receiver,
            superToken,
            stream.flowRate,
            "0x"
        );

        //// cancelprevoius task

        bytes32 oldTaskId = taskIdByUser[stream.sender];
        cancelTaskbyId(oldTaskId, stream.sender);

        //// create new timed at

        bytes32 taskId = IOps(ops).createTimedTask(
            uint128(stream.duration),//// timestamp at which the task should be first executed (stream should stop)
            600, /// Interval between executions, we will cancel after the first execution
            address(this), /// /// Contract executing the task 
            this.stopPlannedStream.selector, /// Executable function's selector
            address(this), /// Resolver contract, in our case will be the same
            abi.encodeWithSelector(
                this.checkerStopPlanStream.selector,
                stream.sender,
                stream.receiver
            ), /// Checker Condition
            ETH, ///  feetoken
            true /// we will use the treasury contract for funding 
        );
        taskIdByUser[stream.sender] = taskId;
    }

    function checkerStopPlanStream(address sender, address receiver)
        external
        pure
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = true;

        execPayload = abi.encodeWithSelector(
            this.stopPlannedStream.selector,
            address(sender),
            address(receiver)
        );
    }

    function stopPlannedStream(address sender, address receiver)
        external
        onlyOps
    {
        /////// STOP IF EXISTS incoming stream
        (, int96 inFlowRate, , ) = cfa.getFlow(superToken, sender, receiver);

     
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
        cancelTaskbyId(_taskId,sender);
    }

    // #endregion Plan Future Start and Future Stop


    // ============= ============= SuperApp callbacks and helpers ============= ============= //
    // #region Stop SuperApp callbacks

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

        (, int96 inFlowRate, , ) = cfa.getFlow(
            superToken,
            sender,
            address(this)
        );

        /// start stream to receiver
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

        //Create the stop stream taks in gelato
        createStopStreamTask(duration, sender, to);

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

        (, int96 inFlowRate, , ) = cfa.getFlow(
            superToken,
            sender,
            address(this)
        );
    }

    /**************************************************************************
     * INTERNAL HELPERS
     *************************************************************************/

    function _isCFAv1(address agreementClass) private view returns (bool) {
        return
            ISuperAgreement(agreementClass).agreementType() ==
            keccak256(
                "org.superfluid-finance.agreements.ConstantFlowAgreement.v1"
            );
    }

    function _isSameToken(ISuperToken _superToken) private view returns (bool) {
        return address(_superToken) == address(superToken);
    }

    // #endregion Stop SuperApp callbacks
}
