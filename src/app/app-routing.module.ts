import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'super', pathMatch: 'full' },
  { path: 'party', loadChildren: () => import('./party/party.module').then(m => m.PartyModule) },
  { path: 'super', loadChildren: () => import('./super-app/super-app.module').then(m => m.SuperAppModule) }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
