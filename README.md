# Gelato & Supefluid

This project showcases general-purpose examples of automating smart contracts with gelato as well as the application for superfluid streams presenting a very simple 3-step guide to creating programmable cash flows

## Showcase Dapp
The showcase dapp can be found in [dapp](https://gelato-superapp.web.app/party)
The two contracts are deployed anda verified on Mumbai [PartyApp](https://mumbai.polygonscan.com/address/0x91946A25711aD12636C08953fF40f01d9303318f) and [GelatoSuperApp](https://mumbai.polygonscan.com/address/0x5e12E82e1abD457F81F90109dB743d71799C4aA0)



## Anguala app & local development
This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.3.
therefore for local development Angular CLI has to be installed
```
/// launch devserver at`http://localhost:4200/`.
ng serve
````

## Local blockchain (Mumbai fork) commands
```
/// spin forked blockchain
npm run fork
````
```
/// compile solidity contracts
npm run compile
````

```
/// compile solidity contracts
npm run compile
````

## Local Testing
```
/// Once the local fork is running
npm run contracts:test
````
