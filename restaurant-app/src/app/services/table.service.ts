import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  private tableIdSubject = new BehaviorSubject<string | null>(null);
  tableId$ = this.tableIdSubject.asObservable();

  setTableId(id: string) {
    this.tableIdSubject.next(id);
  }

  getTableId(): string | null {
    return this.tableIdSubject.value || '';
  }
}
