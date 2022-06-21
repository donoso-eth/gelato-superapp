import { task } from 'hardhat/config';

task('mumbai-verify', 'verify').setAction(async ({}, hre) => {
  // await hre.run("verify:verify", {
  //   address: "0xf164D1c6281970542c1262Cb2F6eB528da427f82",
  //   constructorArguments: [
  //     '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
  //     '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
  //   ],
  // });

  await hre.run("verify:verify", {
    address: "0x6a0C105A74Ed3359ADDd877049BC129e224b48c0",
    constructorArguments: [
      '0xEB796bdb90fFA0f28255275e16936D25d3418603',
      '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
      '0xB3f5503f93d5Ef84b06993a1975B9D21B962892F',
      '0x527a819db1eb0e34426297b03bae11F2f8B3A19E'
    ],
  });



  });


  