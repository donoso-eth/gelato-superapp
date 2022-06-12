import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SuperAppRoutingModule } from './super-app-routing.module';
import { SuperAppComponent } from './super-app.component';


@NgModule({
  declarations: [
    SuperAppComponent
  ],
  imports: [
    CommonModule,
    SuperAppRoutingModule
  ]
})
export class SuperAppModule { }
