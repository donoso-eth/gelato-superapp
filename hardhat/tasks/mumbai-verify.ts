import { task } from 'hardhat/config';

task('mumbai-verify', 'verify').setAction(async ({}, hre) => {
  await hre.run("verify:verify", {
    address: "0x68c48A16758C85957eba2c37E6D23ca6D4348cc8",
    constructorArguments: [
      '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
      '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
    ],
  });

  await hre.run("verify:verify", {
    address: "0x2343587d6C3123091A10f5fC68cE9Ff34d9958de",
    constructorArguments: [
      '0xEB796bdb90fFA0f28255275e16936D25d3418603',
      '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
      '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
      '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
    ],
  });



  });


  