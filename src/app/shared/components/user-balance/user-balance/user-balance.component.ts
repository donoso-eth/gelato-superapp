import {
  Component,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { DappInjector, Web3Actions } from 'angular-web3';
import { Contract, Signer, utils } from 'ethers';
import { MessageService } from 'primeng/api';
import { interval, Subscription, takeUntil } from 'rxjs';
import { doSignerTransaction } from 'src/app/dapp-injector/classes/transactor';
import { ISUPER_TOKEN } from 'src/app/shared/models';

import { abi_ERC20 } from '../abis/erc20';
import { abi_SuperToken } from '../abis/superToken';

@Component({
  selector: 'user-balance',
  templateUrl: './user-balance.component.html',
  styleUrls: ['./user-balance.component.scss'],
})
export class UserBalanceComponent implements OnInit, OnDestroy {
  showTransferState = false;
  toUpgradeAmountCtrl = new FormControl(0, Validators.required);
  toDowngradeAmountCtrl = new FormControl(0, Validators.required);
  tokenObj!: ISUPER_TOKEN;
  balanceSubscription!: Subscription;

  constructor(
    private msg: MessageService,
    private store: Store,
    private dapp: DappInjector
  ) {
    this.tokenObj = {
      name: 'DAI',
      id: 0,
      image: 'dai',
      token: '0x15F0Ca26781C3852f8166eD2ebce5D18265cceb7',
      superToken: '0x5D8B4C2554aeB7e86F387B4d6c00Ac33499Ed01f',
    };
  }
  ngOnDestroy(): void {
    this.balanceSubscription.unsubscribe();
  }

  ngOnInit(): void {
    const source = interval(500);

    this.balanceSubscription = source.subscribe(async (val) => {
      const superToken = this.createSuperTokenInstance(
        this.tokenObj.superToken,
        this.dapp.signer!
      );

      const startMs = (new Date().getTime() / 1000).toFixed(0);
      const balanceSupertoken = await superToken.realtimeBalanceOf(
        this.dapp.signerAddress,
        startMs
      );

      this.tokenObj.superTokenBalance = (+utils.formatEther(
        balanceSupertoken[0]
      )).toFixed(6);
    });
    this.refreshBalance();
  }

  @Output() refreshEvent = new EventEmitter();

  showTransfer() {
    this.showTransferState = true;
  }

  //// UPGRADE TOKENS
  async doUpgrade() {
    if (this.toUpgradeAmountCtrl.value <= 0) {
      this.msg.add({
        key: 'tst',
        severity: 'warn',
        summary: 'Missing info',
        detail: `Please add amount to Upgrade`,
      });
      return;
    }
    this.showTransferState = false;
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    const value = utils.parseEther(this.toUpgradeAmountCtrl.value.toString());

    const resultApprove = await doSignerTransaction(
      this.createERC20Instance(this.tokenObj.token, this.dapp.signer!).approve(
        this.tokenObj.superToken,
        value
      )
    );
    if (resultApprove.success == true) {
    } else {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      this.msg.add({
        key: 'tst',
        severity: 'error',
        summary: 'OOPS',
        detail: `Error Approving Amount with txHash:${resultApprove.txHash}`,
      });
      return;
    }

    const superToken = this.createSuperTokenInstance(
      this.tokenObj.superToken,
      this.dapp.signer!
    );
    const result = await doSignerTransaction(superToken.upgrade(value));

    if (result.success == true) {
      await this.refreshEvent.emit();
      this.msg.add({
        key: 'tst',
        severity: 'success',
        summary: 'Great!',
        detail: `Upgrade Operation succesful with txHash:${result.txHash}`,
      });
    } else {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      this.msg.add({
        key: 'tst',
        severity: 'error',
        summary: 'OOPS',
        detail: `Error Upgrading with txHash:${result.txHash}`,
      });
    }
  }

  /// DOWNGRADE TOKENS
  async doDowngrade() {
    if (this.toDowngradeAmountCtrl.value <= 0) {
      this.msg.add({
        key: 'tst',
        severity: 'warn',
        summary: 'Missing info',
        detail: `Please add amount to Downgrade`,
      });

      return;
    }
    this.showTransferState = false;
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    const value = utils.parseEther(this.toDowngradeAmountCtrl.value.toString());

    const superToken = this.createSuperTokenInstance(
      this.tokenObj.superToken,
      this.dapp.signer!
    );

    const result = await doSignerTransaction(superToken.downgrade(value));
    if (result.success == true) {
      await this.refreshEvent.emit();
      this.msg.add({
        key: 'tst',
        severity: 'success',
        summary: 'Great!',
        detail: `Downgrade Operation succesful with txHash:${result.txHash}`,
      });
    } else {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      this.msg.add({
        key: 'tst',
        severity: 'error',
        summary: 'OOPS',
        detail: `Error Downgrading with txHash:${result.txHash}`,
      });
    }
  }

  async refreshBalance() {
    const token = this.createERC20Instance(
      this.tokenObj.token,
      this.dapp.signer!
    );

    const balanceToken = await token.balanceOf(this.dapp.signerAddress);

    this.tokenObj.tokenBalance = (+utils.formatEther(balanceToken)).toFixed(4);

    //this.getRewardDetails(this.id)
  }

  createERC20Instance = (ERC: string, signer: Signer): Contract => {
    return new Contract(ERC, abi_ERC20, signer);
  };

  createSuperTokenInstance = (SuperToken: string, signer: Signer): Contract => {
    return new Contract(SuperToken, abi_SuperToken, signer);
  };
}
