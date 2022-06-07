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
  const gelatoSuperApp = GelatoSuperApp__factory.connect("0x4F687da9F2E54F657684cb362931499159D59545", deployer)

  let  receipt = await waitForTx( gelatoSuperApp.startTask());

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