import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ExamsComponent } from './components/exams/exams.component';
import { ExamFormComponent } from './components/exam-form/exam-form.component';
import { ExamDetailComponent } from './components/exam-detail/exam-detail.component';
import { TestComponent } from './components/test/test.component';
import { TestResultComponent } from './components/test-result/test-result.component';
import { UsersComponent } from './components/users/users.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'exams', component: ExamsComponent, canActivate: [authGuard] },
  { path: 'exams/new', component: ExamFormComponent, canActivate: [authGuard] },
  { path: 'exams/:codeExam', component: ExamDetailComponent, canActivate: [authGuard] },
  { path: 'exams/:codeExam/edit', component: ExamFormComponent, canActivate: [authGuard] },
  { path: 'test', component: TestComponent, canActivate: [authGuard] },
  { path: 'test-result', component: TestResultComponent, canActivate: [authGuard] },
  { path: 'users', component: UsersComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
