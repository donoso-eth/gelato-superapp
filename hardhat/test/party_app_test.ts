/* eslint-disable @typescript-eslint/no-explicit-any */
import { Signer } from '@ethersproject/abstract-signer';
import { expect } from 'chai';

import {
  PartyApp,
  PartyApp__factory,
  IOps,
  IOps__factory,
  ITaskTreasury,
  ITaskTreasury__factory,
} from '../typechain-types';

import * as hre from 'hardhat';

import { ethers } from 'hardhat';
import { JsonRpcProvider } from '@ethersproject/providers';
import { parseEther } from 'ethers/lib/utils';


const gelatoAddress = '0x25aD59adbe00C2d80c86d01e2E05e1294DA84823';
const ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const FIVE_MINUTES = 5 * 60;
const FEETOKEN = hre.ethers.constants.AddressZero;

let GELATO_OPS = '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F';
let GELATO_TREASURY = '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';

let ops: IOps;
let taskTreasury: ITaskTreasury;
let partyApp: PartyApp;
let deployer: Signer;
let deployerAddress: string;

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

let provider: JsonRpcProvider;

describe('Party app Tests', function () {
  before(async function () {
    provider = ethers.provider;

    [deployer] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();

    partyApp = await new PartyApp__factory(deployer).deploy(
      GELATO_OPS,
      GELATO_TREASURY
    );

    ops = IOps__factory.connect(GELATO_OPS, deployer);

    taskTreasury = ITaskTreasury__factory.connect(GELATO_TREASURY, deployer);
    await partyApp.withdrawGelato();

    executorAddress = gelatoAddress;

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [executorAddress],
    });

    executor = await ethers.provider.getSigner(executorAddress);
  });

  it('it should fund Treasury', async () => {
    const depositAmount = ethers.utils.parseEther('10');

    await partyApp.fundGelato(depositAmount, { value: depositAmount });

    let treasuryBalance = +(
      await taskTreasury
        .connect(deployer)
        .userTokenBalance(partyApp.address, ETH)
    ).toString();

    expect(treasuryBalance).to.equal(+depositAmount);
  });

  it('it should withdraw Treasury', async () => {
    await partyApp.withdrawGelato();

    let treasuryBalance = +(
      await taskTreasury
        .connect(deployer)
        .userTokenBalance(partyApp.address, ETH)
    ).toString();

    expect(treasuryBalance).to.equal(0);

    const depositAmount = ethers.utils.parseEther('10');
    await partyApp.fundGelato(depositAmount, { value: depositAmount });
  });

  it('it should finish the Headache ', async () => {
    let headeacheBefore = await partyApp.headachePresent();

    await partyApp.headacheFinish();

    let headeacheAfter = await partyApp.headachePresent();

    expect(headeacheBefore).true;
    expect(headeacheAfter).false;

    await partyApp.headacheStart();
  });

  it('it should create a task ans stored cirrectly the taskid', async () => {
    await partyApp.createTask();

    execData = await partyApp.interface.encodeFunctionData('startParty');
    execAddress = partyApp.address;
    execSelector = await ops.getSelector('startParty()');
    resolverAddress = partyApp.address;
    resolverData = await partyApp.interface.encodeFunctionData(
      'checkerStartParty'
    );

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ['address', 'bytes'],
        [resolverAddress, resolverData]
      )
    );

    taskId = await ops.getTaskId(
      partyApp.address,
      execAddress,
      execSelector,
      true,
      ethers.constants.AddressZero,
      resolverHash
    );

     let storedTaskId = await partyApp.taskIdByUser(deployerAddress);

      expect(taskId).to.be.equal(storedTaskId);

  });

  it('Exec should fail when headache is present', async () => {
    const [canExec, payload] = await partyApp.checkerStartParty();

    let headeacheAfter = await partyApp.headachePresent();
 

    execData = await partyApp.interface.encodeFunctionData('startParty');
    execAddress = partyApp.address;
    execSelector = await ethers.utils.defaultAbiCoder.encode(
      ['string'],
      ['startParty']
    );
    resolverAddress = partyApp.address;
    resolverData = await partyApp.interface.encodeFunctionData(
      'checkerStartParty'
    );

     await expect(
     ops
      .connect(executor)
      .exec(
        ethers.utils.parseEther('0.1'),
        ETH,
        partyApp.address,
        true,
        true,
        resolverHash,
        execAddress,
        execData
      )
     ).to.be.revertedWith('Ops.exec:NOT_READY');
  });

  it('Exec should Success when headache is not present', async () => {
    const [canExec, payload] = await partyApp.checkerStartParty();

    await partyApp.headacheFinish();

    

    execData = await partyApp.interface.encodeFunctionData('startParty');
    execAddress = partyApp.address;
    resolverAddress = partyApp.address;
    resolverData = await partyApp.interface.encodeFunctionData(
      'checkerStartParty'
    );

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ['address', 'bytes'],
        [resolverAddress, resolverData]
      )
    );

     await  ops
      .connect(executor)
      .exec(
        ethers.utils.parseEther('0.1'),
        ETH,
        partyApp.address,
        true,
        true,
        resolverHash,
        execAddress,
        execData
      )
    
     let headeacheAfter = await partyApp.headachePresent();
     expect(headeacheAfter).true;   

  });

  it('Checker funciton should return correct values', async () => {
  
    await partyApp.headacheStart();
    execData = await partyApp.interface.encodeFunctionData('startParty');
 
    const [canExec, payload] = await partyApp.checkerStartParty();

    expect(canExec).false;
    expect(payload).to.be.equal(execData)

  });


  it('it should cancel the Task ', async () => {
    let taskIdBefore = await partyApp.taskIdByUser(deployerAddress);
    await partyApp.cancelTask();

    let taskIdAfter= await partyApp.taskIdByUser(deployerAddress);

    expect(taskIdBefore).to.not.equal(ethers.constants.AddressZero);
  
    let taskByUser = await ops.getTaskIdsByUser(partyApp.address)
    expect(taskByUser.length).to.equal(0);

  });
  it('it should cancel the Task knowing the taskID ', async () => {
  await partyApp.createTask();

  let taskByUser = await ops.getTaskIdsByUser(partyApp.address)
  expect(taskByUser.length).to.equal(1);

  execData = await partyApp.interface.encodeFunctionData('startParty');
  execAddress = partyApp.address;
  execSelector = await ops.getSelector('startParty()');
  resolverAddress = partyApp.address;
  resolverData = await partyApp.interface.encodeFunctionData(
    'checkerStartParty'
  );

  resolverHash = ethers.utils.keccak256(
    new ethers.utils.AbiCoder().encode(
      ['address', 'bytes'],
      [resolverAddress, resolverData]
    )
  );

  taskId = await ops.getTaskId(
    partyApp.address,
    execAddress,
    execSelector,
    true,
    ethers.constants.AddressZero,
    resolverHash
  );

  await partyApp.cancelTaskById(taskId);
 
   taskByUser = await ops.getTaskIdsByUser(partyApp.address)
   expect(taskByUser.length).to.equal(0);

  });

  it('it should revert when calling directly the exec function ', async () => {
     
    await expect(partyApp.startParty()).to.be.revertedWith('OpsReady: onlyOps');

  });

  
});
