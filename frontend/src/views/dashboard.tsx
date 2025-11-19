"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { HardDrive, CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";

interface Job {
  id: number;
  triggered_by: string;
  devices: number;
  status: string;
  started_at: string;
  finished_at: string;
}

interface Device {
  id: number;
  hostname: string;
  enabled: boolean;
}

interface Schedule {
  id: number;
  enabled: boolean;
}

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

  const [stats, setStats] = useState({
    totalDevices: 0,
    successfulBackups: 0,
    failedBackups: 0,
    activeSchedules: 0,
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  const [recentJobs, setRecentJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch devices
        const devices = await apiGet<Device[]>('/devices');
        const totalDevices = devices.length;

        // Fetch schedules
        const schedules = await apiGet<Schedule[]>('/schedules');
        const activeSchedules = schedules.filter(s => s.enabled).length;

        // Fetch recent jobs
        const jobs = await apiGet<Job[]>('/jobs');
        setRecentJobs(jobs.slice(0, 5)); // Top 5 recent jobs

        // Calculate backup stats from recent jobs (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentJobsLast7Days = jobs.filter(job => {
          const jobDate = new Date(job.started_at);
          return jobDate >= sevenDaysAgo;
        });

        const successfulBackups = recentJobsLast7Days.filter(j => j.status === 'success').length;
        const failedBackups = recentJobsLast7Days.filter(j => j.status === 'failed').length;

        setStats({
          totalDevices,
          successfulBackups,
          failedBackups,
          activeSchedules,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const statsDisplay = [
    { label: 'Total Devices', value: stats.totalDevices.toString(), icon: HardDrive, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: 'Successful Backups (7 days)', value: stats.successfulBackups.toString(), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: 'Failed Backups (7 days)', value: stats.failedBackups.toString(), icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    { label: 'Active Schedules', value: stats.activeSchedules.toString(), icon: Calendar, color: 'text-purple-600', bgColor: 'bg-purple-100' },
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
        {statsDisplay.map((stat) => {
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
                {recentJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No jobs yet. Run your first backup from the Jobs page.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentJobs.map((job) => {
                    const startedDate = new Date(job.started_at);
                    const finishedDate = job.finished_at ? new Date(job.finished_at) : null;
                    const duration = finishedDate 
                      ? Math.floor((finishedDate.getTime() - startedDate.getTime()) / 1000 / 60) + 'm'
                      : '-';
                    const startedAt = startedDate.toLocaleString('en-US', { 
                      month: '2-digit', 
                      day: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    });

                    return (
                      <TableRow key={job.id}>
                        <TableCell>#{job.id}</TableCell>
                        <TableCell>{job.devices || 0}</TableCell>
                        <TableCell>{job.triggered_by}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>{duration}</TableCell>
                        <TableCell>{startedAt}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}