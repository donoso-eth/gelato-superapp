import { readFileSync } from 'fs-extra';
import { task } from 'hardhat/config';
import { PartyApp, PartyApp__factory, IOps, IOps__factory, ITaskTreasury, GelatoSuperApp__factory } from "../typechain-types";

import { join } from 'path';
import { getTimestamp, mineBlocks, setNextBlockTimestamp, waitForTx } from '../helpers/utils';
import { Framework } from '@superfluid-finance/sdk-core';

const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: any}

let superToken="0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f"

let execAddress: string;
let execSelector: string;
let execData: string;
let resolverAddress: string;
let resolverData: string;
let taskId: string;
let resolverHash: string;

task('task-stream', 'Exucute Stream Task').setAction(async ({}, hre) => {
    
    const  ethers = hre.ethers;
    let GELATO_OPS = '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F';

    const accounts = await hre.ethers.getSigners();
  
    const deployer = accounts[0];
    console.log(deployer.address)

    const deployerAddress = deployer.address;
    
  const deployContract="gelatoSuperApp"
  const toDeployContract = contract_config[deployContract];
  const metadata = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))
  
  console.log(metadata.address)
  const gelatoSuperApp = GelatoSuperApp__factory.connect(metadata.address, deployer)
  let t0 = parseInt(await getTimestamp(hre));
   
  console.log('t0: ',new Date(t0*1000).toLocaleTimeString());


  ////// recreate period 1 + 10 sec user2 deposit 20 ////
  await setNextBlockTimestamp(hre, t0 + 3000);

await mineBlocks(hre,1)

  let t1 = parseInt(await getTimestamp(hre));
   
  console.log('t1: ',new Date(t1*1000).toLocaleTimeString());
  let provider = hre.ethers.provider;

  let sf = await Framework.create({
    networkName: 'mumbai',
    provider: provider,
    customSubgraphQueriesEndpoint:
      'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai',
    resolverAddress: '0x8C54C83FbDe3C59e59dd6E324531FB93d4F504d3',
  });

const flow = sf.cfaV1;
  let result = await flow.getFlow({
    superToken,
    sender: deployer.address,
    receiver:gelatoSuperApp.address,
    providerOrSigner: deployer
  });
 console.log(result);

 result = await flow.getFlow({
    superToken,
    sender: gelatoSuperApp.address,
    receiver:"0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    providerOrSigner: deployer
  });
 console.log(result);


  const gelatoAddress = "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823";
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  let executorAddress = gelatoAddress;

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [executorAddress],
  });

  let executor = await hre.ethers.provider.getSigner(executorAddress);
console.log(gelatoSuperApp.address)

////// EXECUTE CREATe TASK
execData = await gelatoSuperApp.interface.encodeFunctionData("stopstream",[deployer.address,"0x70997970C51812dc3A010C7d01b50e0d17dc79C8"]);
execAddress = gelatoSuperApp.address;
execSelector = await  ethers.utils.defaultAbiCoder.encode(['string'],["stopstream"]);
resolverAddress = gelatoSuperApp.address;
resolverData = await gelatoSuperApp.interface.encodeFunctionData("checker",[deployer.address,"0x70997970C51812dc3A010C7d01b50e0d17dc79C8"]);

resolverHash = ethers.utils.keccak256(
  new ethers.utils.AbiCoder().encode(
    ["address", "bytes"],
    [resolverAddress, resolverData]
  )
);

let [canExec, payload] = await gelatoSuperApp.checker(deployerAddress,"0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

  console.log(107,canExec);

  const ops = IOps__factory.connect(GELATO_OPS,executor)

await waitForTx (ops
      .exec(
        ethers.utils.parseEther("0.05"),
        ETH,
        gelatoSuperApp.address,
        true, ///// We are  using the treasury
        true,
        resolverHash,
        execAddress,
        execData
      ));



  });
  