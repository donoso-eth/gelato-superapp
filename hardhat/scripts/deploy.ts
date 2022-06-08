// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import { writeFileSync,readFileSync } from "fs";
import {copySync, ensureDir,existsSync } from 'fs-extra'
import { ethers,hardhatArguments } from "hardhat";
import config from "../hardhat.config";
import { join } from "path";
import { createHardhatAndFundPrivKeysFiles } from "../helpers/localAccounts";
import * as hre from 'hardhat';
import { GelatoSuperApp__factory } from "../typechain-types";
import { initEnv } from "../helpers/utils";

let HOST = '0xEB796bdb90fFA0f28255275e16936D25d3418603';
let CFA = '0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873';
let TOKEN1 = '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f';


interface ICONTRACT_DEPLOY {
  artifactsPath:string,
  name:string,
  ctor?:any,
  jsonName:string
}

const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
ensureDir(contract_path)



async function main() {
  const [deployer] = await initEnv(hre)
let network = hardhatArguments.network;
if (network == undefined) {
  network = config.defaultNetwork;
}

  const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: ICONTRACT_DEPLOY}
  
  const deployContracts=["gelatoSuperApp"]
 
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  
  for (const toDeployName of deployContracts) {
    const toDeployContract = contract_config[toDeployName];
    if (toDeployContract == undefined) {
      console.error('Your contract is not yet configured');
      console.error(
        'Please add the configuration to /hardhat/contract.config.json'
      );
      return;
    }
    const artifactsPath = join(
      processDir,
      `./artifacts/contracts/${toDeployContract.artifactsPath}`
    );
    const Metadata = JSON.parse(readFileSync(artifactsPath, 'utf-8'));
    // const Contract = await ethers.getContractFactory(toDeployContract.name);
    // const contract = await Contract.deploy.apply(
    //   Contract,
    //   toDeployContract.ctor
    // );


    const gelatoSuperApp = await new GelatoSuperApp__factory(deployer).deploy("0xEB796bdb90fFA0f28255275e16936D25d3418603","0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f","0xB3f5503f93d5Ef84b06993a1975B9D21B962892F")

   
    //const signer:Signer = await hre.ethers.getSigners()

    writeFileSync(
      `${contract_path}/${toDeployContract.jsonName}_metadata.json`,
      JSON.stringify({
        abi: Metadata.abi,
        name: toDeployContract.name,
        address: gelatoSuperApp.address,
        network: network,
      })
    );

    console.log(
      toDeployContract.name + ' Contract Deployed to:',
      gelatoSuperApp.address
    );

    ///// copy Interfaces and create Metadata address/abi to assets folder
    copySync(
      `./typechain-types/${toDeployContract.name}.ts`,
      join(contract_path, 'interfaces', `${toDeployContract.name}.ts`)
    );
  }

  ///// create the local accounts file
  if (
    !existsSync(`${contract_path}/local_accouts.json`) &&
    (network == 'localhost' || network == 'hardhat')
  ) {
    const accounts_keys = await createHardhatAndFundPrivKeysFiles(
      hre,
      contract_path
    );
    writeFileSync(
      `${contract_path}/local_accouts.json`,
      JSON.stringify(accounts_keys)
    );
  }

 
  ///// copy addressess files
  if (!existsSync(`${contract_path}/interfaces/common.ts`)) {
    copySync(
      './typechain-types/common.ts',
      join(contract_path, 'interfaces', 'common.ts')
    );
  }


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
