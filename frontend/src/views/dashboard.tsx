"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HardDrive, CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";

export function DashboardPage() {
  const [userRole] = useState<'admin' | 'viewer'>(() => {
    try {
      if (typeof window === 'undefined') return 'viewer';
      const u = localStorage.getItem('abs_user');
      if (!u) return 'viewer';
      return JSON.parse(u).role as 'admin' | 'viewer';
    } catch {
      return 'viewer';
    }
  });

  const stats = [
    { label: 'Total Devices', value: '15', icon: HardDrive, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Successful Backups (7 days)', value: '98', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Failed Backups (7 days)', value: '2', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    { label: 'Active Schedules', value: '3', icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  ];

  const recentJobs = [
    { id: '#25', devices: 3, trigger: 'manual', status: 'success', duration: '01:32', startedAt: '11/11 10:00' },
    { id: '#24', devices: 15, trigger: 'schedule:Weekly', status: 'success', duration: '04:23', startedAt: '11/08 02:00' },
    { id: '#23', devices: 5, trigger: 'manual', status: 'failed', duration: '00:45', startedAt: '11/07 15:30' },
    { id: '#22', devices: 3, trigger: 'schedule:Daily', status: 'success', duration: '01:15', startedAt: '11/07 02:00' },
    { id: '#21', devices: 1, trigger: 'manual', status: 'success', duration: '00:28', startedAt: '11/06 18:45' },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      running: 'bg-yellow-100 text-yellow-700',
    };
    return <Badge className={variants[status as keyof typeof variants] || ''}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Dashboard</h2>
        <p className="text-gray-500">Overview of your backup system</p>
      </div>

      {/* Viewer Info Banner */}
      {userRole === 'viewer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-800 font-medium">Viewing in read-only mode</p>
            <p className="text-blue-700 text-sm mt-1">
              You are logged in as a viewer. Some features like adding/editing devices, users, and schedules are restricted to admin users.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Jobs Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-gray-900 mb-4">Recent Jobs</h3>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>{job.devices}</TableCell>
                    <TableCell>{job.trigger}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell>{job.duration}</TableCell>
                    <TableCell>{job.startedAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}