import { ensureDir, readFileSync, readdirSync, writeFileSync } from 'fs-extra';
import { join } from 'path';


interface ICONTRACT_DEPLOY {
  artifactsPath: string;
  name: string;
  ctor?: any;
  jsonName: string;
}


const processDir = process.cwd();

const contract_config = JSON.parse(
  readFileSync(join(processDir, 'contract.config.json'), 'utf-8')
) as { [key: string]: ICONTRACT_DEPLOY };
const configArray = Object.keys(contract_config).map(
  (key) => contract_config[key]
);

function toUnder(camel: string) {
  let dash = camel.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());

  if (dash.substring(0, 1) == '_') {
    dash = dash.substring(1, dash.length);
  }
  return dash;
}


const artifactsPath = '../src/assets/artifacts/contracts/';

 async function wire() {




  const contracts = readdirSync('./contracts/');



  const contractArtifacts: Array<ICONTRACT_DEPLOY> = [];
  for (const contractFolder of contracts) {
    const jsonDir = readdirSync(join(artifactsPath, contractFolder)).filter(
      (fil) => fil.substring(fil.length - 9, fil.length) !== '.dbg.json'
    );
    for (const jsonFile of jsonDir) {
      const contractArtifact = `${contractFolder}/${jsonFile}`;

      const myConfigObjArray = configArray.filter(
        (fil) => fil.artifactsPath == contractArtifact
      );
      if (myConfigObjArray.length == 0) {
        const name = jsonFile.substring(0, jsonFile.length - 5);

        const jsonName = toUnder(name) ;
        contractArtifacts.push({
          name: name,
          artifactsPath: contractArtifact,
          jsonName,
          ctor:[]
        });
      }
    }
  }
  console.log('');

  /// checking constructor parameters
  for (const contract of contractArtifacts) {
    const contract_abi = JSON.parse(
      readFileSync(join(artifactsPath, contract.artifactsPath), 'utf-8')
    ).abi;

    const constructorFilter = contract_abi.filter(
      (fil: any) => fil.type == 'constructor'
    );

    if (constructorFilter.length == 1) {
      const inputs = constructorFilter[0].inputs;
      if (inputs.length > 0) {
    
        for (let i = 0; i < inputs.length ; i++) {
      
          contract.ctor.push(`${inputs[i].name}:${inputs[i].type}`)
    
        }
       
      }
    }

    console.log(
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    );
    console.log(`------  Wiring contract  ${contract.name}`);
    if (contract.ctor !== undefined) {
      console.warn(
        '------  Please add the constructor parameters for automatic deploying'
      );
      console.warn('        /hardhat/contract.config.json');
    }
    console.log(
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    );
    console.log('');
    const key =
      contract.name.substring(0, 1).toLowerCase() +
      contract.name.substring(1, contract.name.length);
    contract_config[key] = contract;
  }
  if (contractArtifacts.length > 0) {
  writeFileSync(
    join(processDir, 'contract.config.json'),
    JSON.stringify(contract_config)
  );
  console.log(`------  Config File Updated`);
  } else {
    console.log(`------  No new Contracts found`);
  }
  console.log('');
}

wire().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
