//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import {ISuperfluid, ISuperAgreement, ISuperToken, ISuperApp, SuperAppDefinitions} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import {IConstantFlowAgreementV1} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import {SuperAppBase} from "@superfluid-finance/ethereum-contracts/contracts/apps/SuperAppBase.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import {OpsReady} from "./gelato/OpsReady.sol";
import {IOps} from "./gelato/IOps.sol";

contract GelatoSuperApp is SuperAppBase, OpsReady {
    using SafeMath for uint256;
    using Counters for Counters.Counter;

    uint256 lastExecuted;
    uint256 public count;

    ISuperfluid public host; // host
    IConstantFlowAgreementV1 public cfa; // the stored constant flow agreement class address
    ISuperToken superToken;

    mapping(address => bytes32) public taskIdByAddress;
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

    function startTask(uint256 _amount) external payable {
        require(msg.value == 0.1 ether, "NOT-BALANCE");
        // (bool success, ) = address(0x527a819db1eb0e34426297b03bae11F2f8B3A19E).call{value: 0.1 ether}("");
    }

    function cancelTask(bytes32 _taskId) external {
        IOps(ops).cancelTask(_taskId);
    }

    function stopstream(address receiver) external onlyOps {
        //// check if

        //// every task will be payed with a transfer, therefore receive(), we have to fund the contract
        uint256 fee;
        address feeToken;

        (fee, feeToken) = IOps(ops).getFeeDetails();

        _transfer(fee, feeToken);

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

    function checker(address sender)
        external
        returns (bool canExec, bytes memory execPayload)
    {
        canExec = true;

        execPayload = abi.encodeWithSelector(
            this.stopstream.selector,
            address(sender)
        );
    }

    function withdraw() external returns (bool) {
        (bool result, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
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

        (, int96 inFlowRate, , ) = cfa.getFlow(
            superToken,
            sender,
            address(this)
        );

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
            abi.encodeWithSelector(this.checker.selector, sender),
            ETH,
            false
        );

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
}
