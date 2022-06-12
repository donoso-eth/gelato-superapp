import { JsonRpcProvider } from '@ethersproject/providers';
import { Action, createAction, props } from '@ngrx/store';
import { NETWORK_STATUS } from './models';

export enum Web3ActionTypes {
  ChainStatus = '[Chain] Status',
  ChainBusy = '[Chain] Busy',
  DisconnectChain = '[Disconnect] Chain',
  setSignerNetwork = '[Set] SignerNetwork',

  ReadContractIsReady = '[Read] Contract',

  SetDollarExhange = '[Set] Dollar',
  UpdateWalletBalance = '[Update] WalletBalance'

}
// const chainMount = createAction('[Chain] Mount')();
// const chainReady = createAction('[Chain] Ready')();

const chainStatus = createAction('[Chain] Status', props<{ status: NETWORK_STATUS }>());
const chainBusy = createAction('[Chain] Busy', props<{ status: boolean }>());

const disconnectChain = createAction('[Disconnect] Chain',props<{status:'force-disconnect'}>());



const setSignerNetwork = createAction('[Set] SignerNetwork', props<{ network: string }>());

const setDollarExhange = createAction('[Set] Dollar', props<{ exchange: number }>());

const updateWalletBalance = createAction('[Update] WalletBalance', props<{ walletBalance: number }>());




export const Web3Actions = {

  chainStatus,
  chainBusy,
  disconnectChain,


  setSignerNetwork,

  setDollarExhange,
  updateWalletBalance

};

