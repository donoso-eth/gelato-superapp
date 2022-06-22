import { readFileSync } from 'fs-extra';
import { task } from 'hardhat/config';
import { PartyApp, PartyApp__factory, IOps, IOps__factory, ITaskTreasury } from "../typechain-types";

import { join } from 'path';
import { waitForTx } from '../helpers/utils';

const contract_path_relative = '../src/assets/contracts/';
const processDir = process.cwd()
const contract_path = join(processDir,contract_path_relative)
const contract_config = JSON.parse(readFileSync( join(processDir,'contract.config.json'),'utf-8')) as {[key:string]: any}



let execAddress: string;
let execSelector: string;
let execData: string;
let resolverAddress: string;
let resolverData: string;
let taskId: string;
let resolverHash: string;

task('task-no-prepayment', 'Exucute No Prepayment Task').setAction(async ({}, hre) => {
    
    const  ethers = hre.ethers;
    let GELATO_OPS =     '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F';

    const accounts = await hre.ethers.getSigners();
  
    const deployer = accounts[0];
    console.log(deployer.address)

    const deployerAddress = deployer.address;
    
  const deployContract="partyApp"
  const toDeployContract = contract_config[deployContract];
  const metadata = JSON.parse(readFileSync(`${contract_path}/${toDeployContract.jsonName}_metadata.json`,'utf-8'))
  
  console.log(metadata.address)
  const partyApp = PartyApp__factory.connect(metadata.address, deployer)



  console.log(await partyApp.headachePresent())

  const gelatoAddress = "0x25aD59adbe00C2d80c86d01e2E05e1294DA84823";
  const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  let executorAddress = gelatoAddress;

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [executorAddress],
  });

  let executor = await hre.ethers.provider.getSigner(executorAddress);


////// EXECUTE CREATe TASK
execData = await partyApp.interface.encodeFunctionData("startPartyNoPrepayment");
execAddress = partyApp.address;
//execSelector = await  ethers.utils.defaultAbiCoder.encode(['string'],["startPartyNoPrepayment"]);
resolverAddress = partyApp.address;
resolverData = await partyApp.interface.encodeFunctionData("checkerNoPrepayment");

resolverHash = ethers.utils.keccak256(
  new ethers.utils.AbiCoder().encode(
    ["address", "bytes"],
    [resolverAddress, resolverData]
  )
);

let [canExec, payload] = await partyApp.checkerCancel(deployerAddress);

  console.log(107,canExec);

  const ops = IOps__factory.connect(GELATO_OPS,executor)

await waitForTx (ops
      .exec(
        ethers.utils.parseEther("0.05"),
        ETH,
        partyApp.address,
        false, ///// We are not using the treasury
        true,
        resolverHash,
        execAddress,
        execData
      ));



  });
  