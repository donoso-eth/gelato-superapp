import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './home.component';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { InputNumberModule } from 'primeng/inputnumber';
import { ClipboardModule } from '@angular/cdk/clipboard';
@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    ButtonModule,
    DividerModule,
    InputNumberModule,
    ClipboardModule

  ]
})
export class HomeModule { }
