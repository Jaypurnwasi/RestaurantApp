import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private usersSubject = new BehaviorSubject<any[]>([]);
  users$ = this.usersSubject.asObservable();

  private HOST = "http://localhost:4000/";
  private fullUrl = this.HOST;

  constructor(private apollo: Apollo) { 
    this.fetchUsers()
  }

  fetchUsers(fetchPolicy: 'cache-first' | 'network-only' = 'cache-first'): void {
     this.apollo
      .watchQuery({
        query: gql`
          query  {
  getAllCustomers {
    email
    id
    name
    profileImage
    role
  }
}
        `,
        context: {
          uri: this.fullUrl,
        },
      })
      .valueChanges.pipe(map((result: any) => result.data.getAllCustomers),
      tap(users => this.usersSubject.next(users))).subscribe();
  }

  getUsers(): Observable<any[]> {
    return this.users$; // Return the observable users list
  }
  refreshUsers(): void {
    this.fetchUsers('network-only');
  }

}