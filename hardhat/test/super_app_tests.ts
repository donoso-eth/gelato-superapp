/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer } from '@ethersproject/abstract-signer';
import { expect } from 'chai';

import {
  IOps,
  IOps__factory,
  ITaskTreasury,
  GelatoSuperApp__factory,
  GelatoSuperApp,
  ITaskTreasury__factory,
} from '../typechain-types';

import * as hre from 'hardhat';

import { ethers } from 'hardhat';
import {
  Framework,
  ConstantFlowAgreementV1,
} from '@superfluid-finance/sdk-core';
import { PlanStreamStruct } from '../typechain-types/GelatoSuperApp';
import { getTimestamp } from '../helpers/utils';

const gelatoAddress = '0x25aD59adbe00C2d80c86d01e2E05e1294DA84823';
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const FIVE_MINUTES = 5 * 60;
const FEETOKEN = hre.ethers.constants.AddressZero;
let GELATO_OPS = '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F';
let GELATO_TREASURY = '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';
let ops: IOps;
const HOST = '0xEB796bdb90fFA0f28255275e16936D25d3418603';
const superToken = '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f';

let taskTreasury: ITaskTreasury;
let gelatoSuperApp: GelatoSuperApp;

let deployer: Signer;
let deployerAddress: string;

let user: Signer;
let userAddress: string;

let executor: any;
let executorAddress: string;

let interval: number;
let execAddress: string;
let execSelector: string;
let execData: string;
let resolverAddress: string;
let resolverData: string;
let taskId: string;
let resolverHash: string;
let sf: Framework;
let flow: ConstantFlowAgreementV1;
let flowRate: string;
let planStreamConfig: PlanStreamStruct;
let result;
describe('Ops Automate Start/Stop stream', function () {
  before(async function () {
    [deployer, user] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();
    userAddress = await user.getAddress();

    gelatoSuperApp = await new GelatoSuperApp__factory(deployer).deploy(
      HOST,
      superToken,
      GELATO_OPS,
      GELATO_TREASURY
    );

    let provider = ethers.provider;

    sf = await Framework.create({
      networkName: 'mumbai',
      provider: provider,
      customSubgraphQueriesEndpoint:
        'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai',
      resolverAddress: '0x8C54C83FbDe3C59e59dd6E324531FB93d4F504d3',
    });

    flow = sf.cfaV1;

    result = await flow.getFlow({
      superToken,
      sender: deployerAddress,
      receiver: userAddress,
      providerOrSigner: deployer,
    });
    if (result.flowRate !== '0') {
      let deleteOperation = flow.deleteFlow({
        sender: deployerAddress,
        receiver: userAddress,
        superToken,
      });
      await deleteOperation.exec(deployer);
    }

    ops = IOps__factory.connect(GELATO_OPS, deployer);

    taskTreasury = ITaskTreasury__factory.connect(GELATO_TREASURY, deployer);
    await gelatoSuperApp.withdrawGelato();

    executorAddress = gelatoAddress;

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [executorAddress],
    });

    executor = await ethers.provider.getSigner(executorAddress);

    /////========== Give aCL permissions to =========== ///////

    let authOperation = await sf.cfaV1.authorizeFlowOperatorWithFullControl({
      flowOperator: gelatoSuperApp.address,
      superToken,
    });
    await authOperation.exec(deployer);

    ////========== Start Automated START/STOP STREAM ==========/////

    flowRate = ((10 * 10 ** 18) / (24 * 3600)).toFixed(0);

    planStreamConfig = {
      plannedStart: 300,
      stream: {
        sender: deployerAddress,
        receiver: userAddress,
        duration: 300,
        flowRate,
      },
    };
  });

  it('it should fund Treasury', async () => {
    const depositAmount = ethers.utils.parseEther('10');

    await gelatoSuperApp.fundGelato(depositAmount, { value: depositAmount });

    let treasuryBalance = +(
      await taskTreasury
        .connect(deployer)
        .userTokenBalance(gelatoSuperApp.address, ETH)
    ).toString();

    expect(treasuryBalance).to.equal(+depositAmount);
  });

  it('it should withdraw Treasury', async () => {
    await gelatoSuperApp.withdrawGelato();

    let treasuryBalance = +(
      await taskTreasury
        .connect(deployer)
        .userTokenBalance(gelatoSuperApp.address, ETH)
    ).toString();

    expect(treasuryBalance).to.equal(0);

    const depositAmount = ethers.utils.parseEther('10');
    await gelatoSuperApp.fundGelato(depositAmount, { value: depositAmount });
  });

  it('Plan Stream should create a task with correct Id', async () => {
    await gelatoSuperApp.planStream(planStreamConfig);

    let storedTaskId = await gelatoSuperApp.taskIdByUser(deployerAddress);
    let taskByUser = await ops.getTaskIdsByUser(gelatoSuperApp.address);
    expect(taskByUser.length).to.equal(1);
    expect(taskByUser[0]).to.be.equal(storedTaskId);
  });

  it('Exec should fail when time not elapsed', async () => {
    execData = await gelatoSuperApp.interface.encodeFunctionData(
      'startStream',
      [planStreamConfig.stream]
    );
    execAddress = gelatoSuperApp.address;
    execSelector = await ethers.utils.defaultAbiCoder.encode(
      ['string'],
      ['startStream']
    );
    resolverAddress = gelatoSuperApp.address;
    resolverData = await gelatoSuperApp.interface.encodeFunctionData(
      'checkerPlanStream',
      [planStreamConfig.stream]
    );

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ['address', 'bytes'],
        [resolverAddress, resolverData]
      )
    );

    await expect(
      ops
        .connect(executor)
        .exec(
          ethers.utils.parseEther('0.1'),
          ETH,
          gelatoSuperApp.address,
          true,
          true,
          resolverHash,
          execAddress,
          execData
        )
    ).to.be.revertedWith('Ops: exec: Too early');
  });

  it('Exec should succeed when time elapse and streams hould have started', async () => {
    await hre.network.provider.send('evm_increaseTime', [FIVE_MINUTES]);
    await hre.network.provider.send('evm_mine', []);

    result = await flow.getFlow({
      superToken,
      sender: deployerAddress,
      receiver: userAddress,
      providerOrSigner: deployer,
    });
    expect(result.flowRate).to.be.equal('0');

    await ops
      .connect(executor)
      .exec(
        ethers.utils.parseEther('0.1'),
        ETH,
        gelatoSuperApp.address,
        true,
        true,
        resolverHash,
        execAddress,
        execData
      );

    result = await flow.getFlow({
      superToken,
      sender: deployerAddress,
      receiver: userAddress,
      providerOrSigner: deployer,
    });
    expect(result.flowRate).to.be.equal(flowRate);
  });

  it('Exec should fail when time not elapsed the stop stream', async () => {
    execData = await gelatoSuperApp.interface.encodeFunctionData(
      'stopPlannedStream',
      [deployerAddress, userAddress]
    );
    execAddress = gelatoSuperApp.address;
    execSelector = await ethers.utils.defaultAbiCoder.encode(
      ['string'],
      ['stopPlannedStream']
    );
    resolverAddress = gelatoSuperApp.address;
    resolverData = await gelatoSuperApp.interface.encodeFunctionData(
      'checkerStopPlanStream',
      [deployerAddress, userAddress]
    );

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ['address', 'bytes'],
        [resolverAddress, resolverData]
      )
    );

    await expect(
      ops
        .connect(executor)
        .exec(
          ethers.utils.parseEther('0.1'),
          ETH,
          gelatoSuperApp.address,
          true,
          true,
          resolverHash,
          execAddress,
          execData
        )
    ).to.be.revertedWith('Ops: exec: Too early');
  });

  it('Exec should Succeed when time has passed and a flow should be created', async () => {
    await hre.network.provider.send('evm_increaseTime', [FIVE_MINUTES]);
    await hre.network.provider.send('evm_mine', []);

    result = await flow.getFlow({
      superToken,
      sender: deployerAddress,
      receiver: userAddress,
      providerOrSigner: deployer,
    });

    expect(result.flowRate).to.be.equal(flowRate);

    await ops
      .connect(executor)
      .exec(
        ethers.utils.parseEther('0.1'),
        ETH,
        gelatoSuperApp.address,
        true,
        true,
        resolverHash,
        execAddress,
        execData
      );

    result = await flow.getFlow({
      superToken,
      sender: deployerAddress,
      receiver: userAddress,
      providerOrSigner: deployer,
    });
    expect(result.flowRate).to.be.equal('0');
  });

});
