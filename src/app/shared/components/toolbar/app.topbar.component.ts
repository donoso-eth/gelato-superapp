import { Component, OnDestroy } from '@angular/core';

import { Subscription, takeUntil } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { FormControl } from '@angular/forms';
import { DappBaseComponent, DappInjector, Web3Actions, Web3State } from 'angular-web3';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { displayAdress } from '../../helpers/helpers';
import { ethers, utils } from 'ethers';

@Component({
  selector: 'app-topbar',
  templateUrl: './app.topbar.component.html',
})
export class AppTopBarComponent extends DappBaseComponent {
  items!: MenuItem[];
  users = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  localUserCtrl = new FormControl(1);
  ///// ---------  importing local priv_keys
  harhdat_local_privKeys: Array<{ key: string; address: string }> = [];
  network!: string;
  address_to_show!: string;
  userbalance: ethers.BigNumber | undefined;
  constructor(private router: Router, dapp: DappInjector, store: Store<Web3State>) {
    super(dapp, store);
    this.localUserCtrl.valueChanges.pipe(takeUntil(this.destroyHooks)).subscribe((val) => {
      this.dapp.localWallet(val);
     // this.router.navigateByUrl('landing');
    });
  }

  utils = utils;

  displayAdress =  displayAdress;

  toggleMenu(val: any) {}

  toggleTopMenu(val: any) {}

  doDisconnect() {
  
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
   this.store.dispatch(Web3Actions.disconnectChain({ status: 'force-disconnect' }));
      this.router.navigate(['landing'])
  }


  async  connect() {

    this.dapp.localWallet(1)
  
   // this.dapp.launchWebModal()
   
    // this.router.navigate(['party'])
      
    }

  override async hookContractConnected(): Promise<void> {
    
    this.address_to_show = await this.dapp.signerAddress!;

    this.network = this.dapp.dappConfig.defaultNetwork!;
    console.log(this.network)
     if (this.network == 'localhost') {
      this.harhdat_local_privKeys = (await import('../../../../assets/contracts/local_accouts.json')).default;
      const index = this.harhdat_local_privKeys.map((map) => map.address.toLowerCase()).indexOf(this.dapp.signerAddress!.toLowerCase());

      this.localUserCtrl.setValue(index + 1, { emitEvent: false });

    }

    
  }


  override async hookRefreshBalances(): Promise<void> {

       this.userbalance = await this.dapp.provider?.getBalance(this.dapp.signerAddress!);
        console.log(this.userbalance)
      //  this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:false}));
  }
  
}
