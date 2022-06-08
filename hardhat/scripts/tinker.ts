import { Contract, providers, Signer, utils } from "ethers";
import { readFileSync } from "fs-extra";
import { initEnv, waitForTx } from "../helpers/utils";
import { join } from "path";
import * as hre from "hardhat"
import { GelatoSuperApp__factory } from "../typechain-types";
import { Framework } from '@superfluid-finance/sdk-core';

const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: any}
let TOKEN1 = '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f';

const tinker = async () => {

  const [deployer] = await initEnv(hre)

  console.log(deployer.address)

  const deployContract="gelatoSuperApp"
  const toDeployContract = contract_config[deployContract];
  const metadata = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))
  
  console.log(metadata.address)
  const gelatoSuperApp = GelatoSuperApp__factory.connect(metadata.address, deployer)

  // let provider = hre.ethers.provider;

  // let sf = await Framework.create({
  //   networkName: 'mumbai',
  //   provider: provider,
  //   customSubgraphQueriesEndpoint:
  //     'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-mumbai',
  //   resolverAddress: '0x8C54C83FbDe3C59e59dd6E324531FB93d4F504d3',
  // });

  // let createFlowOperation = sf.cfaV1.createFlow({
  //   flowRate: '4000',
  //   receiver: metadata.address,
  //   superToken: TOKEN1,
  // });

  // let receipt = await waitForTx(createFlowOperation.exec(deployer));


  //let  receipt = await waitForTx( gelatoSuperApp.startTask(77,{value:utils.parseEther("0.1")}));


  //console.log(await (await gelatoSuperApp.count()).toString())

  

    let  receipt = await waitForTx( gelatoSuperApp.cancelTask("0x70c8024e17b374a2bb2b9cfe9ff81426ea3ab691e5312c5312d97858dffd662c"));


  // // 

 receipt = await waitForTx( gelatoSuperApp.withdraw());

  //console.log(receipt.transactionHash)
  
  };
  
  const sleep = (ms:number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  tinker()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });