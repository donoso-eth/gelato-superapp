import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AngularContract,
  DappInjector,
  no_network,
  angular_web3,
  DappBaseComponent,
  netWorkById,
} from 'angular-web3';
import { providers } from 'ethers';
import { MinimalContract} from 'src/assets/contracts/interfaces/MinimalContract';

@Component({
  selector: 'minimal-contract',
  templateUrl: './minimal-contract.component.html',
  styles: [
    `
      .blockchain_is_busy {
        animation: spinHorizontal 2s infinite linear;
        filter: hue-rotate(220deg);
      }
      @keyframes spinHorizontal {
        0% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(360deg);
        }
        100% {
          transform: rotate(0deg);
        }
      }
    `,
  ],
})
export class MinimalContractComponent extends DappBaseComponent implements AfterViewInit {
  deployer_address!: string;
  myWallet_address!: string;
  contractHeader!: { name: string; address: string };

  minimalContract!: AngularContract<MinimalContract>;
  netWork!: string;
  no_network = no_network;
  angular_web3 = angular_web3;
  connected_netWork!: string;
  contract_network!: string;
  provider_network!: string;

  constructor(
    store: Store,
    dapp: DappInjector
  ) { super(dapp,store)}

  async asyncStuff() {
    this.myWallet_address = this.dapp.signerAddress!;
    this.contractHeader = {
      name: this.minimalContract.name,
      address: this.minimalContract.address,
    };
    this.deployer_address = this.dapp.signerAddress!;
    this.connected_netWork! = this.dapp.DAPP_STATE.connectedNetwork as string
    this.contract_network = this.minimalContract.network_deployed;
    const net_id = (await this.dapp.provider?.getNetwork())?.chainId
    this.provider_network = netWorkById(+net_id!).name
    }

  override async hookContractConnected(): Promise<void> {
    this.minimalContract = this.dapp.defaultContract! ;
   

    this.asyncStuff()
  }

  connect() {
    this.dapp.launchWebModal();
  }

}
