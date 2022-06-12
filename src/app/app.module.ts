import { InjectionToken, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DappInjectorModule } from './dapp-injector/dapp-injector.module';
import { StoreModule } from '@ngrx/store';
import { ICONTRACT_METADATA, we3ReducerFunction } from 'angular-web3';

import { DropdownModule } from 'primeng/dropdown';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

import { DragDropModule } from '@angular/cdk/drag-drop';

import { LoadingComponent } from './shared/components/loading/loading.component';
import { AppTopBarComponent } from './shared/components/toolbar/app.topbar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import GelatpAppMetadata from '../assets/contracts/gelato_super_app_metadata.json';

export const contractMetadata = new InjectionToken<ICONTRACT_METADATA>('contractMetadata')

export const contractProvider= {provide: 'contractMetadata', useValue:GelatpAppMetadata};


@NgModule({
  declarations: [
    AppComponent,
    LoadingComponent,
    AppTopBarComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    DappInjectorModule.forRoot({wallet:'local', defaultNetwork:'localhost'}),
    StoreModule.forRoot({web3: we3ReducerFunction}),
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    ProgressSpinnerModule,
    ToastModule,
    ButtonModule,
    DragDropModule
  ],
  providers: [contractProvider, MessageService],
  bootstrap: [AppComponent]
})
export class AppModule { }
