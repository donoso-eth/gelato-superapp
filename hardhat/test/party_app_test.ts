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

describe.only('Party app Tests', function () {
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
 
    await partyApp.fundGelato(depositAmount,{value:depositAmount});

    let treasuryBalance = +((await taskTreasury
      .connect(deployer)
      .userTokenBalance(partyApp.address, ETH)).toString());
    
      console.group(treasuryBalance)
     // expect(treasuryBalance).to.equal(depositAmount);


  });

  it('it should withdraw Treasury', async () => {
 
    await partyApp.withdrawGelato();


    let treasuryBalance = +((await taskTreasury
      .connect(deployer)
      .userTokenBalance(partyApp.address, ETH)).toString());
    
 
      expect(treasuryBalance).to.equal(0);


    
    const depositAmount = ethers.utils.parseEther('10');
    await partyApp.fundGelato(depositAmount,{value:depositAmount});




  });

  it('it should finish the Headache ', async () => {
   
    let headeacheBefore = await  partyApp.headachePresent();

    await partyApp.headacheFinish()

    let headeacheAfter = await  partyApp.headachePresent();



   expect(headeacheBefore).true
   expect(headeacheAfter).false

   await partyApp.headacheStart()


  });

  it('it should create a task', async () => {
   
    await  partyApp.createTask();


     execData = await partyApp.interface.encodeFunctionData('startParty');
     execAddress = partyApp.address;
     execSelector = await ops.getSelector("startParty()");
    resolverAddress = partyApp.address;
    resolverData = await partyApp.interface.encodeFunctionData('checkerStartParty');

    resolverHash = ethers.utils.keccak256(
      new ethers.utils.AbiCoder().encode(
        ['address', 'bytes'],
        [resolverAddress, resolverData]
      )
    );

    console.log(execSelector)

      taskId = await ops.getTaskId(
      partyApp.address,
      execAddress,
      execSelector,
      true,
      ETH,
      resolverHash
    );

    //   console.log(taskId)



  });


  it('Exec should fail when headache is present', async () => {
    const [canExec, payload] = await partyApp.checkerStartParty();

    console.log(canExec)
    console.log(payload)

    execData = await partyApp.interface.encodeFunctionData('startParty');
    execAddress = partyApp.address;
    execSelector = await ethers.utils.defaultAbiCoder.encode(['string'],['startParty']);
    resolverAddress = partyApp.address;
    resolverData = await partyApp.interface.encodeFunctionData('checkerStartParty');


    // expect(payload).to.be.eql(execData);
    // expect(canExec).to.be.eql(true);



   // await expect(
    await  ops
        .connect(executor)
        .exec(
          ethers.utils.parseEther('0.1'),
          ETH,
          partyApp.address,
          true,
          false,
          resolverHash,
          execAddress,
          execData
        )
  //  ).to.be.revertedWith('Ops: exec: Too early');
  });

  // it('Exec should succeed when time elapse', async () => {
  //   await hre.network.provider.send('evm_increaseTime', [FIVE_MINUTES]);
  //   await hre.network.provider.send('evm_mine', []);

  //   const nextExecBefore = (await ops.timedTask(taskId)).nextExec;

  //   // await counter.setExecutable(true);

  //   await expect(
  //     ops
  //       .connect(executor)
  //       .exec(
  //         ethers.utils.parseEther('0.1'),
  //         ETH,
  //         deployerAddress,
  //         true,
  //         true,
  //         resolverHash,
  //         execAddress,
  //         execData
  //       )
  //   )
  //     .to.emit(ops, 'ExecSuccess')
  //     .withArgs(
  //       ethers.utils.parseEther('0.1'),
  //       ETH,
  //       execAddress,
  //       execData,
  //       taskId,
  //       true
  //     );

  //   const nextExecAfter = (await ops.timedTask(taskId)).nextExec;

  //   expect(await taskTreasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(
  //     ethers.utils.parseEther('0.9')
  //   );

  //   // expect(Number(await counter.count())).to.be.eql(100);
  //   expect(nextExecAfter).to.be.gt(nextExecBefore);
  // });

  // it('Exec should succeed even if txn fails', async () => {
  //   await hre.network.provider.send('evm_increaseTime', [FIVE_MINUTES]);
  //   await hre.network.provider.send('evm_mine', []);

  //   const nextExecBefore = (await ops.timedTask(taskId)).nextExec;

  //   // await counter.setExecutable(false);

  //   await expect(
  //     ops
  //       .connect(executor)
  //       .exec(
  //         ethers.utils.parseEther('0.1'),
  //         ETH,
  //         deployerAddress,
  //         true,
  //         false,
  //         resolverHash,
  //         execAddress,
  //         execData
  //       )
  //   )
  //     .to.emit(ops, 'ExecSuccess')
  //     .withArgs(
  //       ethers.utils.parseEther('0.1'),
  //       ETH,
  //       execAddress,
  //       execData,
  //       taskId,
  //       false
  //     );

  //   const nextExecAfter = (await ops.timedTask(taskId)).nextExec;

  //   // expect(Number(await counter.count())).to.be.eql(100);
  //   expect(await taskTreasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(
  //     ethers.utils.parseEther('0.8')
  //   );
  //   expect(nextExecAfter).to.be.gt(nextExecBefore);
  // });

  // it('should skip one interval', async () => {
  //   await hre.network.provider.send('evm_increaseTime', [2 * FIVE_MINUTES]);
  //   await hre.network.provider.send('evm_mine', []);

  //   const nextExecBefore = (await ops.timedTask(taskId)).nextExec;

  //   //  await counter.setExecutable(true);

  //   await expect(
  //     ops
  //       .connect(executor)
  //       .exec(
  //         ethers.utils.parseEther('0.1'),
  //         ETH,
  //         deployerAddress,
  //         true,
  //         false,
  //         resolverHash,
  //         execAddress,
  //         execData
  //       )
  //   )
  //     .to.emit(ops, 'ExecSuccess')
  //     .withArgs(
  //       ethers.utils.parseEther('0.1'),
  //       ETH,
  //       execAddress,
  //       execData,
  //       taskId,
  //       true
  //     );

  //   const nextExecAfter = (await ops.timedTask(taskId)).nextExec;

  //   // expect(Number(await counter.count())).to.be.eql(200);
  //   expect(await taskTreasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(
  //     ethers.utils.parseEther('0.7')
  //   );
  //   expect(Number(nextExecAfter.sub(nextExecBefore))).to.be.eql(
  //     2 * FIVE_MINUTES
  //   );
  // });

  // it('Should account for drift', async () => {
  //   await hre.network.provider.send('evm_increaseTime', [50 * FIVE_MINUTES]);
  //   await hre.network.provider.send('evm_mine', []);

  //   await ops
  //     .connect(executor)
  //     .exec(
  //       ethers.utils.parseEther('0.1'),
  //       ETH,
  //       deployerAddress,
  //       true,
  //       false,
  //       resolverHash,
  //       execAddress,
  //       execData
  //     );

  //   await expect(
  //     ops
  //       .connect(executor)
  //       .exec(
  //         ethers.utils.parseEther('0.1'),
  //         ETH,
  //         deployerAddress,
  //         true,
  //         false,
  //         resolverHash,
  //         execAddress,
  //         execData
  //       )
  //   ).to.be.revertedWith('Ops: exec: Too early');

  //   //expect(Number(await counter.count())).to.be.eql(300);
  //   expect(await taskTreasury.userTokenBalance(deployerAddress, ETH)).to.be.eql(
  //     ethers.utils.parseEther('0.6')
  //   );
  // });
});
