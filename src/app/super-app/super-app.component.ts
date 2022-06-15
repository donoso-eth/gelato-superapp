import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ITaskTreasury } from 'src/assets/contracts/interfaces/ITaskTreasury';
import { ITaskTreasury__factory } from 'src/assets/contracts/interfaces/ITaskTreasury__factory';
import { DappBaseComponent } from '../dapp-injector/classes';
import { DappInjector } from '../dapp-injector/dapp-injector.service';
import { displayAdress } from '../shared/helpers/helpers';

@Component({
  selector: 'app-super-app',
  templateUrl: './super-app.component.html',
  styleUrls: ['./super-app.component.scss']
})
export class SuperAppComponent extends DappBaseComponent implements OnInit {
  contractaddress!: string;

  taskTreasury = '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';
  taskTreasuryContract!: ITaskTreasury;
  treasurybalance: any;

  constructor(dapp: DappInjector, store: Store) {
    super(dapp, store);
  }

  displayAdress =  displayAdress;
  
  ngOnInit(): void {
  }


  override async hookContractConnected(): Promise<void> {
    this.contractaddress = this.defaultContract.address;

    this.taskTreasuryContract = ITaskTreasury__factory.connect(
      this.taskTreasury,
      this.dapp.signer!
    );

     // this.treasuryDeposit()

   // await this.getTreasuryBalance()

  }

  

}
