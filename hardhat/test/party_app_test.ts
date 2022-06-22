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
import { formatEther, parseEther } from 'ethers/lib/utils';


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

  it('it should create a task ans stored correctly the taskid', async () => {
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

  await partyApp.cancelTaskById(taskId,deployerAddress);
 
   taskByUser = await ops.getTaskIdsByUser(partyApp.address)
   expect(taskByUser.length).to.equal(0);

  });

  it('it should revert when calling directly the exec function ', async () => {
     
    await expect(partyApp.startParty()).to.be.revertedWith('OpsReady: onlyOps');

  });

 // ============= ============= Create Simple Task and cancel adter first execution Use Case Business Logic  ============= ============= //

 it('it should create a task and cancel after first exec', async () => { 
 
  const depositAmount = ethers.utils.parseEther('10');
  await partyApp.fundGelato(depositAmount, { value: depositAmount });
 
  await partyApp.headacheFinish();

  await partyApp.createTaskAndCancel()


  execData = await partyApp.interface.encodeFunctionData('startPartyandCancel',[deployerAddress]);
  execAddress = partyApp.address;
  execSelector = await ops.getSelector('startPartyandCancel(address)');
  resolverAddress = partyApp.address;
  resolverData = await partyApp.interface.encodeFunctionData(
    'checkerCancel',[deployerAddress]
  )

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


    let storeId = await partyApp.taskIdByUser(deployerAddress)
    expect(taskId).equal(storeId)


  
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


      storeId = await partyApp.taskIdByUser(deployerAddress)
    
      expect(storeId).to.equal(ethers.utils.hexZeroPad(ethers.utils.hexlify(0), 32))

      let taskByUser = await ops.getTaskIdsByUser(partyApp.address)

      expect(taskByUser.length).to.equal(0);

});

 // ============= ============= Create Simple Task WITHOUT Prepayment Use Case Business Logic  ============= ============= //
 it('it should revert when Contract has no funds ', async () => { 
  await expect(partyApp.createTaskNoPrepayment()).to.be.revertedWith('NO_FUNDING');
});



it('it should accept funds', async () => { 
 
  let balanceBefore = await provider.getBalance(partyApp.address)
 
  let  tx = {
    to: partyApp.address,
    value: parseEther("10")
};

await deployer.sendTransaction(tx);

let balanceAfter = await provider.getBalance(partyApp.address)

expect(+balanceAfter-+balanceBefore).to.equal(10*10**18)

});


 it('it should create no-prepayment task with the correct Task ID', async () => { 
 
  let  tx = {
    to: partyApp.address,
    value: parseEther("10")
};

await deployer.sendTransaction(tx);
 
  await partyApp.createTaskNoPrepayment();


  execData = await partyApp.interface.encodeFunctionData('startPartyNoPrepayment');
  execAddress = partyApp.address;
  execSelector = await ops.getSelector('startPartyNoPrepayment()');
  resolverAddress = partyApp.address;
  resolverData = await partyApp.interface.encodeFunctionData(
    'checkerNoPrepayment'
  )

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
    false,
    ETH,
    resolverHash
  );

  
  let storeId = await partyApp.taskIdByUser(deployerAddress)
    expect(taskId).to.equal(storeId)
  
});

it('it should Execshould Success no-prepayment task and decrease contract funds', async () => {
  const [canExec, payload] = await partyApp.checkerStartParty();

  let balanceBefore = (await provider.getBalance(partyApp.address)).toString()
 

  await partyApp.headacheFinish();

  

  execData = await partyApp.interface.encodeFunctionData('startPartyNoPrepayment');
  execAddress = partyApp.address;
  execSelector = await ops.getSelector('startPartyNoPrepayment()');
  resolverAddress = partyApp.address;
  resolverData = await partyApp.interface.encodeFunctionData(
    'checkerNoPrepayment'
  )

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
      false,
      true,
      resolverHash,
      execAddress,
      execData
    )
  
    let balanceAfter = (await provider.getBalance(partyApp.address)).toString()

   let headeacheAfter = await partyApp.headachePresent();
   expect(headeacheAfter).true;   

   expect(+balanceBefore-(+balanceAfter)).to.equal(0.1 * 10**18)

});


});