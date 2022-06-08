import { Contract, providers, Signer, utils } from "ethers";
import { readFileSync } from "fs-extra";
import { initEnv, waitForTx } from "../helpers/utils";
import { join } from "path";
import * as hre from "hardhat"
import { GelatoSuperApp__factory } from "../typechain-types";


const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: any}


const tinker = async () => {

  const [deployer] = await initEnv(hre)

  console.log(deployer.address)

  const deployContract="gelatoSuperApp"
  const toDeployContract = contract_config[deployContract];
  const metadata = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))
  
  console.log(metadata.address)
  const gelatoSuperApp = GelatoSuperApp__factory.connect(metadata.address, deployer)


  //let  receipt = await waitForTx( gelatoSuperApp.startTask({value:utils.parseEther("0.1")}));


  // 

     let  receipt = await waitForTx( gelatoSuperApp.cancelTask());


  // 

   receipt = await waitForTx( gelatoSuperApp.withdraw());

  console.log(receipt.transactionHash)
  
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