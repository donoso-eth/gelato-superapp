import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperAppRoutingModule } from './super-app-routing.module';
import { SuperAppComponent } from './super-app.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';


@NgModule({
  declarations: [
    SuperAppComponent
  ],
  imports: [
    CommonModule,
    SuperAppRoutingModule,
    ButtonModule,
    DividerModule,
    InputNumberModule,
    ClipboardModule
  ]
})
export class SuperAppModule { }
