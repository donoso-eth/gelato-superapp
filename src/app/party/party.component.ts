import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { DappBaseComponent } from '../dapp-injector/classes';
import { DappInjector } from '../dapp-injector/dapp-injector.service';
import { ITaskTreasury } from '../../assets/contracts/interfaces/ITaskTreasury';
import { Contract, utils } from 'ethers';
import { ITaskTreasury__factory } from 'src/assets/contracts/interfaces/ITaskTreasury__factory';
import { doSignerTransaction } from '../dapp-injector/classes/transactor';
import { displayAdress } from '../shared/helpers/helpers';
import { Web3Actions } from 'angular-web3';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-party',
  templateUrl: './party.component.html',
  styleUrls: ['./party.component.scss'],
})
export class PartyComponent extends DappBaseComponent implements OnInit {
  contractaddress!: string;

  taskTreasury = '0x527a819db1eb0e34426297b03bae11F2f8B3A19E';
  taskTreasuryContract!: ITaskTreasury;
  treasurybalance: any;
  partyAppBalance: any;
  headache!: boolean;

  treasuryCtrl = new FormControl();
  contractCtrl  = new FormControl(); 
  msgValueCtrl  = new FormControl(); 
  lastPartyStart!: string;

  constructor(dapp: DappInjector, store: Store) {
    super(dapp, store);
  }

  displayAdress = displayAdress;
  utils = utils;

  async createTask() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.createTask()!
    );
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  async cancelTask() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.cancelTask()!
    );
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  async createTaskAndCancel() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.createTaskAndCancel()!
    );
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }


  async createTaskNoPrepayment(){
    console.log( this.msgValueCtrl.value)
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    if (this.msgValueCtrl.value == 0 || this.msgValueCtrl.value == undefined){
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.createTaskNoPrepayment()!
    );
    } else if (this.msgValueCtrl.value > 0){
      let value = utils.parseEther(this.msgValueCtrl.value.toString())
      await doSignerTransaction(
        this.dapp.partyAppContract?.instance.createTaskNoPrepayment({value})!
      );
    }
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }


  // ============= =============  CONTRACT FUND Interaction ============= ============= //
  // #region CONTRACT FUND Interaction

  async fundContract() {
    if (this.contractCtrl.value <= 0) {
      alert('please Input Value');
      return;
    }
   let  tx = {
      to: this.contractaddress,
      value: utils.parseEther(this.contractCtrl.value.toString())
  };
  this.store.dispatch(Web3Actions.chainBusy({ status: true }));
   const transaction = await this.dapp.signer!.sendTransaction(tx);
   this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:true}));
   await this.refresh()
   this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:false}));
   this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  async withdrawContract() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.withdrawContract()!
    );
    this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:true}));
    await this.refresh();
    this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:false}));
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));

  }

  // #endregion CONTRACT FUND Interaction


  // ============= =============  TREASURY USER Interaction ============= ============= //
  // #region TREASURY Interaction

  async widthDrawTreasury() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.withdrawGelato()!
    );
     this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:true}));
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
      this.dapp.partyAppContract?.instance.fundGelato(value, { value: value })!
    );
    await this.refresh();
    this.store.dispatch(Web3Actions.refreshBalances({ refreshBalance: true }));
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  //  #endregion TREASURY Interaction

  override async hookContractConnected(): Promise<void> {
    this.contractaddress = this.defaultContract.address;

    this.taskTreasuryContract = ITaskTreasury__factory.connect(
      this.taskTreasury,
      this.dapp.signer!
    );

  
    this.store.dispatch(Web3Actions.refreshBalances({ refreshBalance: true }));
    this.refresh();
    this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:false}));
    // this.store.dispatch(Web3Actions.refreshBalances({refreshBalance:false}));
  }

  // override async hookRefreshBalances(): Promise<void> {

  //    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
  //    await this.getTreasuryBalance()
  //    await this.getPartyAppBalance();
  //    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  // }

  async getPartyAppBalance() {
    this.partyAppBalance =
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

  async headacheFinish() {
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    await doSignerTransaction(
      this.dapp.partyAppContract?.instance.headacheFinish()!
    );
    await this.getHeadache();
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  async getHeadache() {
    this.headache =
      await this.dapp.partyAppContract?.instance.headachePresent()!;
  }

  async getLastPartyStart() {
    let partyTimestamp =
      await this.dapp.partyAppContract?.instance.lastPartyStart();
    console.log(+partyTimestamp!.toString());
    this.lastPartyStart = new Date(
      1000 *
        +(await this.dapp.partyAppContract?.instance.lastPartyStart())!.toString()
    ).toLocaleString();
  }

  async refresh() {
    await this.getTreasuryBalance();
    await this.getPartyAppBalance();
    await this.getHeadache();
    await this.getLastPartyStart();
  }

  ngOnInit(): void {}
}
