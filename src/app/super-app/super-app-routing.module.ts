import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SuperAppComponent } from './super-app.component';

const routes: Routes = [{ path: '', component: SuperAppComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SuperAppRoutingModule { }
