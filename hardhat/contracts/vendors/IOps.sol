// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IOps {

     function gelato() external view returns (address payable);

     function createTimedTask(
        uint128 _startTime,
        uint128 _interval,
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken,
        bool _useTreasury
    ) external returns (bytes32 task);

    /// @notice Create a task that tells Gelato to monitor and execute transactions on specific contracts
    /// @dev Requires funds to be added in Task Treasury, assumes treasury sends fee to Gelato via Ops
    /// @param _execAddress On which contract should Gelato execute the transactions
    /// @param _execSelector Which function Gelato should eecute on the _execAddress
    /// @param _resolverAddress On which contract should Gelato check when to execute the tx
    /// @param _resolverData Which data should be used to check on the Resolver when to execute the tx
    function createTask(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData
    ) external returns (bytes32 task);

    /// @notice Create a task that tells Gelato to monitor and execute transactions on specific contracts
    /// @dev Requires no funds to be added in Task Treasury, assumes tasks sends fee to Gelato directly
    /// @param _execAddress On which contract should Gelato execute the transactions
    /// @param _execSelector Which function Gelato should eecute on the _execAddress
    /// @param _resolverAddress On which contract should Gelato check when to execute the tx
    /// @param _resolverData Which data should be used to check on the Resolver when to execute the tx
    /// @param _feeToken Which token to use as fee payment
    function createTaskNoPrepayment(
        address _execAddress,
        bytes4 _execSelector,
        address _resolverAddress,
        bytes calldata _resolverData,
        address _feeToken
    ) external returns (bytes32 task);

    /// @notice Cancel a task so that Gelato can no longer execute it
    /// @param _taskId The hash of the task, can be computed using getTaskId()
    function cancelTask(bytes32 _taskId) external;
}