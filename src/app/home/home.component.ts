import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { DappBaseComponent } from '../dapp-injector/classes';
import { DappInjector } from '../dapp-injector/dapp-injector.service';
import { ITaskTreasury } from '../../assets/contracts/interfaces/ITaskTreasury';
import { Contract, utils } from 'ethers';
import { ITaskTreasury__factory } from 'src/assets/contracts/interfaces/ITaskTreasury__factory';
import { doSignerTransaction } from '../dapp-injector/classes/transactor';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends DappBaseComponent implements OnInit {
  contractaddress!: string;

  taskTreasury = '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';
  taskTreasuryContract!: ITaskTreasury;
  treasurybalance: any;

  constructor(dapp: DappInjector, store: Store) {
    super(dapp, store);
  }

  displayAdress(address: string): string {
    return (
      address.slice(0, 5) +
      '...' +
      address.slice(address.length - 5, address.length)
    );
  }

  async getTreasuryBalance() {

    this.treasurybalance = await this.taskTreasuryContract.userTokenBalance(this.contractaddress,"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE");
    console.log(this.treasurybalance.toString())
  }
  async widthDrawTreasury(){
    await doSignerTransaction(
      this.dapp.gelatoAppContract?.instance.withdrawGelato()!
     );
  }

  async treasuryDeposit() {
    let value = utils.parseEther("0.1");
    let valueDouble = utils.parseEther("0.2");
    await doSignerTransaction(
     this.dapp.gelatoAppContract?.instance.fundGelato(value,{value:value})!
    );

  await this.getTreasuryBalance()
  }

  override async hookContractConnected(): Promise<void> {
    this.contractaddress = this.defaultContract.address;

    this.taskTreasuryContract = ITaskTreasury__factory.connect(
      this.taskTreasury,
      this.dapp.signer!
    );

      this.treasuryDeposit()

   // await this.getTreasuryBalance()

  }

  ngOnInit(): void {}
}
