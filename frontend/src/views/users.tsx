"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Key } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'viewer';
  created_at: string; // from backend
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [addFormData, setAddFormData] = useState({
    username: '',
    password: '',
    role: 'viewer' as 'admin' | 'viewer',
  });
  const [resetFormData, setResetFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleAddUser = () => {
    if (!addFormData.username || !addFormData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    apiPost('/users', {
      username: addFormData.username,
      password: addFormData.password,
      role: addFormData.role,
    })
      .then(() => {
        setIsAddDialogOpen(false);
        setAddFormData({ username: '', password: '', role: 'viewer' });
        toast.success('User added successfully');
        fetchUsers();
      })
      .catch((err) => {
        toast.error(String(err.message || err));
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteUser = (user: User) => {
    const adminCount = users.filter(u => u.role === 'admin').length;

    if (user.role === 'admin' && adminCount <= 1) {
      toast.error('Cannot delete the last admin user');
      return;
    }

    setLoading(true);
    apiDelete(`/users/${user.id}`)
      .then(() => {
        toast.success('User deleted successfully');
        fetchUsers();
      })
      .catch((err) => toast.error(String(err.message || err)))
      .finally(() => setLoading(false));
  };

  const handleResetPassword = () => {
    if (!resetFormData.newPassword || !resetFormData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (resetFormData.newPassword !== resetFormData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    setLoading(true);
    apiPut(`/users/${selectedUser.id}`, { password: resetFormData.newPassword })
      .then(() => {
        setIsResetDialogOpen(false);
        setResetFormData({ newPassword: '', confirmPassword: '' });
        toast.success('Password reset successfully');
      })
      .catch((err) => toast.error(String(err.message || err)))
      .finally(() => setLoading(false));
  };

  const fetchUsers = () => {
    setLoading(true);
    apiGet<User[]>('/users')
      .then((data) => setUsers(data))
      .catch((err) => toast.error(String(err.message || err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getCurrentUserRole = () => {
    try {
      if (typeof window === 'undefined') return 'viewer';
      const u = localStorage.getItem('abs_user');
      if (!u) return 'viewer';
      return JSON.parse(u).role as 'admin' | 'viewer';
    } catch (e) {
      return 'viewer';
    }
  };

  const isAdmin = getCurrentUserRole() === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Users</h2>
          <p className="text-gray-500">Manage web application accounts</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.role === 'admin' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {isAdmin ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsResetDialogOpen(true);
                          }}
                          title="Reset Password"
                          className="gap-2"
                        >
                          <Key className="w-4 h-4" />
                          Reset PW
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          title="Delete"
                          className="gap-2"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                          Delete
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-gray-500">Read only</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={addFormData.username}
                onChange={(e) => setAddFormData({ ...addFormData, username: e.target.value })}
                placeholder="Enter username"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={addFormData.password}
                onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select 
                value={addFormData.role} 
                onValueChange={(value) => setAddFormData({ ...addFormData, role: value as 'admin' | 'viewer' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="viewer">viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password - {selectedUser?.username}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={resetFormData.newPassword}
                onChange={(e) => setResetFormData({ ...resetFormData, newPassword: e.target.value })}
                placeholder="Enter new password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={resetFormData.confirmPassword}
                onChange={(e) => setResetFormData({ ...resetFormData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}