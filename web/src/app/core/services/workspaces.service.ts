import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface Workspace {
  id: string;
  name: string;
}

export interface UserWorkspace {
  userId: string;
  workspaceId: string;
  role: string;
  isAccepted: boolean;
  workspace: Workspace;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class WorkspacesService {
  private api = environment.apiUrl + '/workspaces';

  workspaces = signal<UserWorkspace[]>([]);
  activeWorkspace = signal<Workspace | null>(null);

  constructor(private http: HttpClient) {}

  loadWorkspaces() {
    return this.http.get<UserWorkspace[]>(this.api).pipe(
      tap((userWorkspaces) => {
        this.workspaces.set(userWorkspaces);
        if (userWorkspaces.length > 0 && !this.activeWorkspace()) {
          this.activeWorkspace.set(userWorkspaces[0].workspace);
        }
      })
    );
  }

  createWorkspace(name: string) {
    return this.http.post<Workspace>(this.api, { name }).pipe(
      tap(() => this.loadWorkspaces().subscribe())
    );
  }

  setActiveWorkspace(workspace: Workspace) {
    this.activeWorkspace.set(workspace);
  }

  generateInvite(workspaceId: string) {
    return this.http.post<{ token: string; workspaceId: string }>(
      `${this.api}/${workspaceId}/invite/generate`, {}
    );
  }

  revokeInvite(workspaceId: string) {
    return this.http.delete<{ message: string }>(
      `${this.api}/${workspaceId}/invite`
    );
  }

  joinByToken(token: string) {
    return this.http.post<{ message: string; workspace: Workspace }>(
      `${this.api}/join`, { token }
    );
  }

  getWorkspaceInfoByToken(token: string) {
    return this.http.get<{ id: string; name: string }>(
      `${this.api}/invite-info?token=${token}`
    );
  }

  getMembers(workspaceId: string) {
    return this.http.get<WorkspaceMember[]>(`${this.api}/${workspaceId}/members`);
  }
}
