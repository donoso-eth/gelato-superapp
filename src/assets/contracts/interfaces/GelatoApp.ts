/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface PartyAppInterface extends utils.Interface {
  functions: {
    "ETH()": FunctionFragment;
    "cancelTask()": FunctionFragment;
    "cancelTaskById(bytes32)": FunctionFragment;
    "checker()": FunctionFragment;
    "checkerCancel()": FunctionFragment;
    "createTask()": FunctionFragment;
    "createTaskAndCancel()": FunctionFragment;
    "createTaskNoPrePayment()": FunctionFragment;
    "fundGelato(uint256)": FunctionFragment;
    "gelato()": FunctionFragment;
    "headacheFinish()": FunctionFragment;
    "headachePresent()": FunctionFragment;
    "lastPartyStart()": FunctionFragment;
    "ops()": FunctionFragment;
    "owner()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "startParty()": FunctionFragment;
    "startPartyandCancel()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "treasury()": FunctionFragment;
    "withdrawContract()": FunctionFragment;
    "withdrawGelato()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "ETH", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "cancelTask",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "cancelTaskById",
    values: [BytesLike]
  ): string;
  encodeFunctionData(functionFragment: "checker", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "checkerCancel",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createTask",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createTaskAndCancel",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createTaskNoPrePayment",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "fundGelato",
    values: [BigNumberish]
  ): string;
  encodeFunctionData(functionFragment: "gelato", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "headacheFinish",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "headachePresent",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "lastPartyStart",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "ops", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "startParty",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "startPartyandCancel",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;
  encodeFunctionData(functionFragment: "treasury", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "withdrawContract",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawGelato",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "ETH", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "cancelTask", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "cancelTaskById",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "checker", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "checkerCancel",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "createTask", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "createTaskAndCancel",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createTaskNoPrePayment",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "fundGelato", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "gelato", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "headacheFinish",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "headachePresent",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "lastPartyStart",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "ops", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "startParty", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "startPartyandCancel",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "treasury", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawContract",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "withdrawGelato",
    data: BytesLike
  ): Result;

  events: {
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  { previousOwner: string; newOwner: string }
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export interface PartyApp extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: PartyAppInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    ETH(overrides?: CallOverrides): Promise<[string]>;

    cancelTask(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    cancelTaskById(
      _taskId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    checker(
      overrides?: CallOverrides
    ): Promise<[boolean, string] & { canExec: boolean; execPayload: string }>;

    checkerCancel(
      overrides?: CallOverrides
    ): Promise<[boolean, string] & { canExec: boolean; execPayload: string }>;

    createTask(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    createTaskAndCancel(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    createTaskNoPrePayment(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    fundGelato(
      amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    gelato(overrides?: CallOverrides): Promise<[string]>;

    headacheFinish(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    headachePresent(overrides?: CallOverrides): Promise<[boolean]>;

    lastPartyStart(overrides?: CallOverrides): Promise<[BigNumber]>;

    ops(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    startParty(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    startPartyandCancel(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    treasury(overrides?: CallOverrides): Promise<[string]>;

    withdrawContract(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    withdrawGelato(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  ETH(overrides?: CallOverrides): Promise<string>;

  cancelTask(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  cancelTaskById(
    _taskId: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  checker(
    overrides?: CallOverrides
  ): Promise<[boolean, string] & { canExec: boolean; execPayload: string }>;

  checkerCancel(
    overrides?: CallOverrides
  ): Promise<[boolean, string] & { canExec: boolean; execPayload: string }>;

  createTask(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  createTaskAndCancel(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  createTaskNoPrePayment(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  fundGelato(
    amount: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  gelato(overrides?: CallOverrides): Promise<string>;

  headacheFinish(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  headachePresent(overrides?: CallOverrides): Promise<boolean>;

  lastPartyStart(overrides?: CallOverrides): Promise<BigNumber>;

  ops(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  startParty(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  startPartyandCancel(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  treasury(overrides?: CallOverrides): Promise<string>;

  withdrawContract(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  withdrawGelato(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    ETH(overrides?: CallOverrides): Promise<string>;

    cancelTask(overrides?: CallOverrides): Promise<void>;

    cancelTaskById(
      _taskId: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    checker(
      overrides?: CallOverrides
    ): Promise<[boolean, string] & { canExec: boolean; execPayload: string }>;

    checkerCancel(
      overrides?: CallOverrides
    ): Promise<[boolean, string] & { canExec: boolean; execPayload: string }>;

    createTask(overrides?: CallOverrides): Promise<void>;

    createTaskAndCancel(overrides?: CallOverrides): Promise<void>;

    createTaskNoPrePayment(overrides?: CallOverrides): Promise<void>;

    fundGelato(amount: BigNumberish, overrides?: CallOverrides): Promise<void>;

    gelato(overrides?: CallOverrides): Promise<string>;

    headacheFinish(overrides?: CallOverrides): Promise<void>;

    headachePresent(overrides?: CallOverrides): Promise<boolean>;

    lastPartyStart(overrides?: CallOverrides): Promise<BigNumber>;

    ops(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    startParty(overrides?: CallOverrides): Promise<void>;

    startPartyandCancel(overrides?: CallOverrides): Promise<void>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;

    treasury(overrides?: CallOverrides): Promise<string>;

    withdrawContract(overrides?: CallOverrides): Promise<boolean>;

    withdrawGelato(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;
  };

  estimateGas: {
    ETH(overrides?: CallOverrides): Promise<BigNumber>;

    cancelTask(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    cancelTaskById(
      _taskId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    checker(overrides?: CallOverrides): Promise<BigNumber>;

    checkerCancel(overrides?: CallOverrides): Promise<BigNumber>;

    createTask(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    createTaskAndCancel(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    createTaskNoPrePayment(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    fundGelato(
      amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    gelato(overrides?: CallOverrides): Promise<BigNumber>;

    headacheFinish(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    headachePresent(overrides?: CallOverrides): Promise<BigNumber>;

    lastPartyStart(overrides?: CallOverrides): Promise<BigNumber>;

    ops(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    startParty(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    startPartyandCancel(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    treasury(overrides?: CallOverrides): Promise<BigNumber>;

    withdrawContract(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    withdrawGelato(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    ETH(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    cancelTask(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    cancelTaskById(
      _taskId: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    checker(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    checkerCancel(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    createTask(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    createTaskAndCancel(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    createTaskNoPrePayment(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    fundGelato(
      amount: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    gelato(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    headacheFinish(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    headachePresent(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    lastPartyStart(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ops(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    startParty(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    startPartyandCancel(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    treasury(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    withdrawContract(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    withdrawGelato(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
