// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

import { writeFileSync, readFileSync } from 'fs';
import { copySync, ensureDir, existsSync } from 'fs-extra';
import { ethers, hardhatArguments } from 'hardhat';
import config from '../hardhat.config';
import { join } from 'path';
import { createHardhatAndFundPrivKeysFiles } from '../helpers/localAccounts';
import * as hre from 'hardhat';
import { PartyApp__factory, GelatoSuperApp__factory } from '../typechain-types';
import { initEnv } from '../helpers/utils';

let HOST = '0xEB796bdb90fFA0f28255275e16936D25d3418603';
let CFA = '0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873';
let TOKEN1 = '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f';
let GELATO_OPS =     '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F';
let GELATO_TREASURY = '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';

interface ICONTRACT_DEPLOY {
  artifactsPath: string;
  name: string;
  ctor?: any;
  jsonName: string;
}

const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd();
const contract_path = join(processDir, contract_path_relative);
ensureDir(contract_path);

async function main() {
  const [deployer] = await initEnv(hre);
  let network = hardhatArguments.network;
  if (network == undefined) {
    network = config.defaultNetwork;
  }

  const contract_config = JSON.parse(
    readFileSync(join(processDir, 'contract.config.json'), 'utf-8')
  ) as { [key: string]: ICONTRACT_DEPLOY };

  let toDeployName = 'partyApp';
  let toDeployContract = contract_config[toDeployName];

  let artifactsPath = join(
    processDir,
    `./artifacts/contracts/${toDeployContract.artifactsPath}`
  );
  let Metadata = JSON.parse(readFileSync(artifactsPath, 'utf-8'));
  const partyApp = await new PartyApp__factory(deployer).deploy(

    '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
    '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
  );

  

  writeFileSync(
    `${contract_path}/${toDeployContract.jsonName}_metadata.json`,
    JSON.stringify({
      abi: Metadata.abi,
      name: toDeployContract.name,
      address: partyApp.address,
      network: network,
    })
  );

  console.log(
    toDeployContract.name + ' Contract Deployed to:',
    partyApp.address
  );

  ///// copy Interfaces and create Metadata address/abi to assets folder
  copySync(
    `./typechain-types/${toDeployContract.name}.ts`,
    join(contract_path, 'interfaces', `${toDeployContract.name}.ts`)
  );
 
 
 
   toDeployName = 'gelatoSuperApp';

   toDeployContract = contract_config[toDeployName];

  artifactsPath = join(
    processDir,
    `./artifacts/contracts/${toDeployContract.artifactsPath}`
  );
 Metadata = JSON.parse(readFileSync(artifactsPath, 'utf-8'));
  const gelatoSuperApp = await new GelatoSuperApp__factory(deployer).deploy(
    '0xEB796bdb90fFA0f28255275e16936D25d3418603',
    '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
    '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
    '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
  );

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

  ///// create the local accounts file

  if (
    !existsSync(join(contract_path,'local_accouts.json')) &&
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
