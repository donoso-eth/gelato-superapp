import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PartyRoutingModule } from './party-routing.module';
import { PartyComponent } from './party.component';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { InputNumberModule } from 'primeng/inputnumber';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@NgModule({
  declarations: [
    PartyComponent
  ],
  imports: [
    CommonModule,
    PartyRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DividerModule,
    InputNumberModule,
    ClipboardModule

  ]
})
export class PartyModule { }
