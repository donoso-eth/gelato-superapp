import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { DappBaseComponent, DappInjector } from 'angular-web3';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DappBaseComponent implements OnInit {

  title = 'gelato';

  constructor( private primengConfig: PrimeNGConfig, dapp:DappInjector, store:Store ){
    super(dapp, store)

  }

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    document.documentElement.style.fontSize = '20px';
  }
}
