import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { ApiService } from '../../services/api.service';
import { LangService } from '../../services/lang.service';
import { UserDTO } from '../../models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  users: UserDTO[] = [];
  loading = true;
  showForm = false;
  editingUser: UserDTO | null = null;
  newUser: UserDTO = { name: '', email: '', password: '' };
  error = ''; success = '';

  constructor(private api: ApiService, public lang: LangService) {}

  ngOnInit() { this.loadUsers(); }

  loadUsers() {
    this.loading = true;
    this.api.getUsers().subscribe({
      next: users => { this.users = users; this.loading = false; },
      error: () => this.loading = false
    });
  }

  saveUser() {
    if (this.editingUser) {
      const userId = this.editingUser.id!;
      this.api.updateUser(userId, this.editingUser).subscribe({
        next: () => { this.success = '✓'; this.editingUser = null; this.loadUsers(); },
        error: () => this.error = '✗'
      });
    } else {
      this.api.saveUser(this.newUser).subscribe({
        next: () => { this.success = '✓'; this.showForm = false; this.newUser = { name: '', email: '', password: '' }; this.loadUsers(); },
        error: () => this.error = '✗'
      });
    }
  }

  deleteUser(id: number) {
    if (confirm(this.lang.t('users.delete_confirm'))) {
      this.api.deleteUser(id).subscribe({ next: () => this.loadUsers() });
    }
  }

  startEdit(user: UserDTO) { this.editingUser = { ...user }; }
  cancelEdit() { this.editingUser = null; }
  getUserId(user: UserDTO): number { return user.id ?? 0; }
}
