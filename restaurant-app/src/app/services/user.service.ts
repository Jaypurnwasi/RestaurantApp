import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  users$ = this.usersSubject.asObservable();

  constructor(private apollo: Apollo) {
    // this.fetchUsers(); // Initial fetch on service instantiation
    // this.fetchStaffMembers(); // Default to Staff Members
  }

  
  fetchStaffMembers(fetchPolicy: 'cache-first' | 'network-only' = 'cache-first'): void {
    this.apollo
      .watchQuery<{ getAllStaffMembers: User[] }>({
        query: gql`
          query GetAllStaffMembers {
            getAllStaffMembers {
              email
              id
              name
              profileImg
              role
            }
          }
        `,
        fetchPolicy,
      })
      .valueChanges.pipe(
        map((result) => result.data?.getAllStaffMembers ?? []),
      )
      .subscribe({
        next: (users) => this.usersSubject.next(users),
        error: (error) => {
          console.error('Error fetching staff members:', error);
          this.usersSubject.next([]);
        },
      });
  }
  fetchCustomers(fetchPolicy: 'cache-first' | 'network-only' = 'cache-first'): void {
    this.apollo
      .watchQuery<{ getAllCustomers: User[] }>({
        query: gql`
          query GetAllCustomers {
            getAllCustomers {
              email
              id
              name
              profileImg
              role
            }
          }
        `,
        fetchPolicy,
      })
      .valueChanges.pipe(
        map((result) => result.data?.getAllCustomers ?? []),
      )
      .subscribe({
        next: (users) => this.usersSubject.next(users),
        error: (error) => {
          console.error('Error fetching customers:', error);
          this.usersSubject.next([]);
        },
      });
  }

  async createUser(user: Omit<User, 'id'>): Promise<void> {
    const mutation = gql`
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          email
          id
          name
          profileImg
          role
          
        }
      }
    `;

    const result = await firstValueFrom(
      this.apollo.mutate<{ createUser: User }>({
        mutation,
        variables: { input: user },
      })
    );

    if (!result.data) {
      throw new Error('Failed to add user: No data returned');
    }

    const newUser = result.data.createUser;
    this.usersSubject.next([...this.usersSubject.value, newUser]);
    console.log('user added succesfully',newUser)
  }

  async removeUser(userId: string): Promise<void> {
    const mutation = gql`
      mutation RemoveUser($input: RemoveUserInput!) {
        removeUser(input: $input) {
          email
          id
          name
          profileImg
          role
        }
      }
    `;

    const result = await firstValueFrom(
      this.apollo.mutate<{ removeUser: User }>({
        mutation,
        variables: { input: { userId } }, // Matches backend expectation
      })
    );

    if (!result.data || !result.data.removeUser) {
      throw new Error('Failed to delete user: No user returned');
    }

    const deletedUser = result.data.removeUser;
    const updatedUsers = this.usersSubject.value.filter(
      (user) => user.id !== deletedUser.id
    );
    this.usersSubject.next(updatedUsers);
  }
  
  getUsers(): Observable<User[]> {
    return this.users$; // Return typed observable
  }

  refreshUsers(): void {
    this.fetchStaffMembers('network-only'); // Default to staff for refresh
  }

  // refreshUsers(): void {
  //   this.fetchUsers('network-only'); // Force network fetch
  // }
}