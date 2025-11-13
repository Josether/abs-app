"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  result: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([
    { id: '1', timestamp: '11/11 10:01', user: 'admin', action: 'job_run_manual', target: 'SW-01, SW-02, SW-03', result: 'success' },
    { id: '2', timestamp: '11/11 09:58', user: 'admin', action: 'device_create', target: 'SW-01', result: 'success' },
    { id: '3', timestamp: '11/11 09:57', user: 'admin', action: 'auth_login', target: '-', result: 'success' },
    { id: '4', timestamp: '11/11 09:45', user: 'viewer1', action: 'backup_download', target: 'SW-01 (11/10 23:00)', result: 'success' },
    { id: '5', timestamp: '11/11 09:30', user: 'admin', action: 'schedule_toggle', target: 'Weekly-Backup (enabled)', result: 'success' },
    { id: '6', timestamp: '11/11 09:15', user: 'admin', action: 'device_test_connection', target: 'SW-02', result: 'failed' },
    { id: '7', timestamp: '11/11 09:10', user: 'admin', action: 'device_edit', target: 'SW-02', result: 'success' },
    { id: '8', timestamp: '11/11 09:05', user: 'viewer1', action: 'auth_login', target: '-', result: 'success' },
    { id: '9', timestamp: '11/11 08:50', user: 'admin', action: 'user_create', target: 'viewer1', result: 'success' },
    { id: '10', timestamp: '11/11 08:45', user: 'admin', action: 'schedule_create', target: 'Daily-Core', result: 'success' },
    { id: '11', timestamp: '11/11 08:30', user: 'admin', action: 'retention_prune', target: 'SW-01 (removed 5 old backups)', result: 'success' },
    { id: '12', timestamp: '11/11 08:00', user: 'admin', action: 'job_cancel', target: '#29', result: 'success' },
    { id: '13', timestamp: '11/10 23:45', user: 'viewer1', action: 'auth_login', target: '-', result: 'failed' },
    { id: '14', timestamp: '11/10 23:30', user: 'admin', action: 'device_delete', target: 'OLD-SW-99', result: 'success' },
    { id: '15', timestamp: '11/10 23:00', user: 'system', action: 'job_run_scheduled', target: 'schedule:Weekly-Backup', result: 'success' },
  ]);
  const [userFilter, setUserFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  const users = ['All', ...Array.from(new Set(logs.map(l => l.user)))];
  const dates = ['All', 'Last 24 hours', 'Last 7 days', 'Last 30 days'];

  const filteredLogs = logs.filter(log => {
    const matchesUser = userFilter === 'All' || log.user === userFilter;
    // For demo, we're not implementing actual date filtering
    return matchesUser;
  });

  const getResultBadge = (result: string) => {
    const variants = {
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
    };
    return (
      <Badge className={variants[result as keyof typeof variants] || ''}>
        {result}
      </Badge>
    );
  };

  const getActionColor = (action: string) => {
    if (action.startsWith('auth_')) return 'text-blue-600';
    if (action.startsWith('job_')) return 'text-purple-600';
    if (action.startsWith('device_')) return 'text-green-600';
    if (action.startsWith('user_')) return 'text-orange-600';
    if (action.startsWith('schedule_')) return 'text-indigo-600';
    if (action.startsWith('backup_')) return 'text-teal-600';
    if (action.startsWith('retention_')) return 'text-gray-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Audit Logs</h2>
        <p className="text-gray-500">Track all important system actions and events</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">User:</span>
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user} value={user}>{user}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Date Range:</span>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dates.map(date => (
                <SelectItem key={date} value={date}>{date}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700 mb-2">📝 Audit logs track the following events:</p>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span className="text-blue-600">• auth_*</span> - Login attempts
          </div>
          <div>
            <span className="text-purple-600">• job_*</span> - Job operations
          </div>
          <div>
            <span className="text-green-600">• device_*</span> - Device CRUD & tests
          </div>
          <div>
            <span className="text-orange-600">• user_*</span> - User management
          </div>
          <div>
            <span className="text-indigo-600">• schedule_*</span> - Schedule operations
          </div>
          <div>
            <span className="text-teal-600">• backup_*</span> - Backup downloads
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-gray-600">{log.timestamp}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded text-sm ${
                    log.user === 'admin' 
                      ? 'bg-blue-100 text-blue-700' 
                      : log.user === 'system'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {log.user}
                  </span>
                </TableCell>
                <TableCell>
                  <code className={`text-sm ${getActionColor(log.action)}`}>
                    {log.action}
                  </code>
                </TableCell>
                <TableCell className="text-gray-600">{log.target}</TableCell>
                <TableCell>{getResultBadge(log.result)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination would go here in a real app */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">Showing {filteredLogs.length} entries</p>
      </div>
    </div>
  );
}