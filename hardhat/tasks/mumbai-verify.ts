import { readFileSync } from 'fs-extra';
import { task } from 'hardhat/config';
import { join } from 'path';

const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: any}



task('mumbai-verify', 'verify').setAction(async ({}, hre) => {

  let deployContract="partyApp"
  let toDeployContract = contract_config[deployContract];
  const partyApp = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))


  await hre.run("verify:verify", {
    address: partyApp.address,
    constructorArguments: [
      '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
      '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
    ],
  });


  deployContract="gelatoSuperApp"
  toDeployContract = contract_config[deployContract];
  const gelatoSuperApp = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))

  await hre.run("verify:verify", {
    address: gelatoSuperApp.addresse,
    constructorArguments: [
      '0xEB796bdb90fFA0f28255275e16936D25d3418603',
      '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
      '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
      '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
    ],
  });



  });


  