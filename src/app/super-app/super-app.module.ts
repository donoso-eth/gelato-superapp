import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SuperAppRoutingModule } from './super-app-routing.module';
import { SuperAppComponent } from './super-app.component';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { SuperFluidService } from './super-fluid-service.service';
import { InputTextModule } from 'primeng/inputtext';



@NgModule({
  declarations: [
    SuperAppComponent
  ],
  imports: [
    CommonModule,
    SuperAppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DividerModule,
    InputNumberModule,
    ClipboardModule,
    DropdownModule,
    InputTextModule,
  ],
  providers:[SuperFluidService]
})
export class SuperAppModule { }
