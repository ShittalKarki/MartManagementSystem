import { Pencil, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUsers, updateUserRoles } from '../services/api';
import { SectionPage } from '../components/SectionPage';

const availableRoles = ['Admin', 'Staff', 'Customer'];

export function UsersPage() {
  const [users, setUsers] = useState<Array<{ id: string; userName?: string; email?: string; fullName?: string; roles: string[]; isLocked?: boolean }>>([]);
  const [draftRoles, setDraftRoles] = useState<Record<string, string[]>>({});

  const load = async () => {
    const items = await getUsers();
    setUsers(items);
    setDraftRoles(Object.fromEntries(items.map((user) => [user.id, user.roles])));
  };

  useEffect(() => {
    load();
  }, []);

  const toggleRole = (userId: string, role: string) => {
    setDraftRoles((current) => {
      const currentRoles = current[userId] ?? [];
      return {
        ...current,
        [userId]: currentRoles.includes(role) ? currentRoles.filter((value) => value !== role) : [...currentRoles, role]
      };
    });
  };

  const saveRoles = async (userId: string) => {
    await updateUserRoles(userId, draftRoles[userId] ?? []);
    await load();
  };

  return (
    <SectionPage kicker="Administration" title="Users" description="Manage staff, admin, and customer roles from one place.">
      <div className="panel table-panel">
        <table className="erp-table">
          <thead><tr><th>User</th><th>Email</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName ?? user.userName ?? user.email ?? '-'}</td>
                <td>{user.email ?? '-'}</td>
                <td>
                  <div className="row-actions">
                    {availableRoles.map((role) => (
                      <label key={role} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <input type="checkbox" checked={(draftRoles[user.id] ?? []).includes(role)} onChange={() => toggleRole(user.id, role)} />
                        {role}
                      </label>
                    ))}
                  </div>
                </td>
                <td>{user.isLocked ? 'Locked' : 'Active'}</td>
                <td>
                  <button className="ghost-btn" type="button" onClick={() => saveRoles(user.id)}><Save size={14} /> Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPage>
  );
}
