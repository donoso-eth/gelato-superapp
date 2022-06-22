import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { utils } from 'ethers';
import { ITaskTreasury } from 'src/assets/contracts/interfaces/ITaskTreasury';
import { ITaskTreasury__factory } from 'src/assets/contracts/interfaces/ITaskTreasury__factory';
import { DappBaseComponent } from '../dapp-injector/classes';
import { doSignerTransaction } from '../dapp-injector/classes/transactor';
import { DappInjector } from '../dapp-injector/dapp-injector.service';
import { Web3Actions } from '../dapp-injector/store';
import { displayAdress, isAddress } from '../shared/helpers/helpers';
import { SuperFluidService } from './super-fluid-service.service';

@Component({
  selector: 'app-super-app',
  templateUrl: './super-app.component.html',
  styleUrls: ['./super-app.component.scss'],
})
export class SuperAppComponent extends DappBaseComponent implements OnInit {
  contractaddress!: string;

  taskTreasury = '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';
  superToken = '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f';

  taskTreasuryContract!: ITaskTreasury;
  treasurybalance: any;
  treasuryCtrl = new FormControl();
  durationCtrl: FormControl = new FormControl();
  receiveCtrl: FormControl = new FormControl();
  startCtrl: FormControl = new FormControl();
  streamDuration = [

    { name: '15 min', id: 1, factor: 900 },
    { name: '30 min', id: 2, factor: 1800 },
    { name: '45 min', id: 3, factor: 2700 },
  ];
  superAppBalance: any;
  bonusGranted = false;
  taskId: string | undefined;

  constructor(
    dapp: DappInjector,
    store: Store,
    public superfluidService: SuperFluidService
  ) {
    super(dapp, store);
    this.durationCtrl = new FormControl([
      { name: '5 min', id: 1, factor: 300 },
      [Validators.required],
    ]);
  }

  displayAdress = displayAdress;
  utils = utils;

  ngOnInit(): void {}

  async startStream() {
    let receiver: string = this.receiveCtrl.value;
    if (isAddress(receiver) == false) {
      alert('addresse is not valid');
      return;
    }
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    let flowRate = ((10 * 10 ** 18) / (24 * 3600)).toFixed(0); // 10 tokens per day
    let duration = 3000;
    console.log(receiver);
    let data = utils.defaultAbiCoder.encode(
      ['address', 'uint256'],
      [receiver, duration]
    );
    let deco = utils.defaultAbiCoder.decode(['address', 'uint256'], data);
    console.log(deco);

    const config: {
      flowRate: string;
      receiver: string;
      superToken: string;
      data: string;
    } = {
      flowRate,
      receiver: this.dapp.DAPP_STATE.gelatoSuperAppContract?.address!,
      superToken: this.superToken,
      data,
    };

    await this.superfluidService.startStream(config);
    this.refresh()
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
 
  }

  async planStartAndStopStream() {}

  override async hookContractConnected(): Promise<void> {
    this.contractaddress = this.dapp.DAPP_STATE.gelatoSuperAppContract?.address!;

    this.taskTreasuryContract = ITaskTreasury__factory.connect(
      this.taskTreasury,
      this.dapp.signer!
    );
    this.store.dispatch(Web3Actions.refreshBalances({ refreshBalance: true }));
    this.refresh();
    this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:false}));
  
    // this.treasuryDeposit()

    // await this.getTreasuryBalance()
  }

  // ============= =============  TREASURY USER Interaction ============= ============= //
  // #region TREASURY Interaction

  async widthDrawTreasury() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.withdrawGelato()!
    );
    this.store.dispatch(Web3Actions.refreshBalances({ refreshBalance: true }));
    await this.refresh();
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  async treasuryDeposit() {
    if (this.treasuryCtrl.value <= 0) {
      alert('please Input Value');
      return;
    }

    let value = utils.parseEther(this.treasuryCtrl.value.toString());
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.gelatoSuperAppContract?.instance.fundGelato(value, { value: value })!
    );
    await this.refresh();
    this.store.dispatch(Web3Actions.refreshBalances({ refreshBalance: true }));
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  //  #endregion TREASURY Interaction

  async getSuperAppBalance() {
    this.superAppBalance =
      await this.dapp.DAPP_STATE.defaultProvider!.getBalance(
        this.contractaddress
      );
  }

  async getTreasuryBalance() {
    this.treasurybalance = await this.taskTreasuryContract.userTokenBalance(
      this.contractaddress,
      '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
    );
  }

  async getTaskId(){
    let id = await this.dapp.DAPP_STATE.gelatoSuperAppContract?.instance.taskIdByUser(this.signerAdress)
    console.log(id)
    this.taskId = id;
  }


async cancelTask(){
  await doSignerTransaction(this.dapp.DAPP_STATE.gelatoSuperAppContract?.instance.cancelTask()!)
  this.refresh
}

  async refresh() {
    this.store.dispatch(Web3Actions.refreshBalances({ refreshBalance: true }));
    await this.getTreasuryBalance();
    await this.getSuperAppBalance();
    await this.getTaskId()
    if (this.bonusGranted !== false){
    this.bonusGranted = await this.dapp.DAPP_STATE.gelatoSuperAppContract?.instance.isBonusReady()!
    }
    this.store.dispatch(Web3Actions.refreshBalances({ refreshBalance: false}));
   
  }
}
