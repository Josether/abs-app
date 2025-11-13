"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, X } from 'lucide-react';
import { toast } from 'sonner';

interface Job {
  id: string;
  triggeredBy: string;
  devices: number;
  status: 'running' | 'success' | 'failed' | 'queued';
  startedAt: string;
  finishedAt: string;
  progress?: { current: number; total: number };
  logs?: string[];
}

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: '#32', triggeredBy: 'manual', devices: 3, status: 'running', startedAt: '11/11 10:00', finishedAt: '-', progress: { current: 3, total: 10 } },
    { id: '#31', triggeredBy: 'schedule:Weekly', devices: 15, status: 'success', startedAt: '11/08 02:00', finishedAt: '11/08 02:15' },
    { id: '#30', triggeredBy: 'manual', devices: 5, status: 'failed', startedAt: '11/07 15:30', finishedAt: '11/07 15:45' },
    { id: '#29', triggeredBy: 'schedule:Daily-Core', devices: 8, status: 'success', startedAt: '11/07 03:00', finishedAt: '11/07 03:12' },
    { id: '#28', triggeredBy: 'manual', devices: 2, status: 'success', startedAt: '11/06 18:45', finishedAt: '11/06 19:05' },
  ]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Simulate job progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.status === 'running' && job.progress) {
          const newCurrent = Math.min(job.progress.current + 1, job.progress.total);
          if (newCurrent === job.progress.total) {
            return {
              ...job,
              status: 'success' as const,
              finishedAt: new Date().toLocaleString('en-US', { 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              }).replace(',', ''),
            };
          }
          return {
            ...job,
            progress: { ...job.progress, current: newCurrent }
          };
        }
        return job;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredJobs = statusFilter === 'All' 
    ? jobs 
    : jobs.filter(job => job.status === statusFilter.toLowerCase());

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      running: 'bg-yellow-100 text-yellow-700',
      queued: 'bg-blue-100 text-blue-700',
    };
    const icons = {
      success: '✅',
      failed: '❌',
      running: '🟡',
      queued: '⏳',
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || ''}>
        {icons[status as keyof typeof icons]} {status}
      </Badge>
    );
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setIsDetailOpen(true);
  };

  const handleCancelJob = (jobId: string) => {
    setJobs(jobs.map(job => 
      job.id === jobId && job.status === 'running'
        ? { ...job, status: 'failed' as const, finishedAt: 'Cancelled' }
        : job
    ));
    setIsDetailOpen(false);
    toast.success('Job cancelled successfully');
  };

  const handleRunManual = () => {
    const hasRunning = jobs.some(job => job.status === 'running');
    const newJob: Job = {
      id: `#${parseInt(jobs[0].id.substring(1)) + 1}`,
      triggeredBy: 'manual',
      devices: 10,
      status: hasRunning ? 'queued' : 'running',
      startedAt: new Date().toLocaleString('en-US', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }).replace(',', ''),
      finishedAt: '-',
      progress: { current: 0, total: 10 },
    };
    setJobs([newJob, ...jobs]);
    
    if (hasRunning) {
      toast.info('Job queued. Will start after current job completes.');
    } else {
      toast.success('Manual backup job started');
    }
  };

  const mockLogs = [
    '[SW-01] Connecting... done.',
    '[SW-01] Backup success (12.3 KB, 45s)',
    '[SW-02] Connecting... done.',
    '[SW-02] Backup success (8.7 KB, 32s)',
    '[SW-03] Connecting... timeout.',
    '[SW-03] Retry attempt 1/3...',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Jobs</h2>
          <p className="text-gray-500">Backup job history and status</p>
        </div>
        <Button onClick={handleRunManual} className="gap-2">
          <Play className="w-4 h-4" />
          Run Manual Backup
        </Button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Filter by status:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Running">Running</SelectItem>
            <SelectItem value="Success">Success</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Queued">Queued</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Queue Banner */}
      {jobs.some(job => job.status === 'queued') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            ⏳ 1 job is currently running. Your job is queued and will start automatically.
          </p>
        </div>
      )}

      {/* Jobs Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Triggered By</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.id}</TableCell>
                <TableCell>{job.triggeredBy}</TableCell>
                <TableCell>{job.devices}</TableCell>
                <TableCell>{getStatusBadge(job.status)}</TableCell>
                <TableCell>{job.startedAt}</TableCell>
                <TableCell>{job.finishedAt}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewJob(job)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {job.status === 'running' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                        title="Cancel Job"
                      >
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Job Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Job {selectedJob?.id} - {selectedJob?.status}</DialogTitle>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-4 py-4">
              {selectedJob.status === 'running' && selectedJob.progress && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Progress</span>
                    <span className="text-sm">{selectedJob.progress.current}/{selectedJob.progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${(selectedJob.progress.current / selectedJob.progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Queue State: 0 waiting
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-gray-900 mb-2">Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Triggered by:</span> {selectedJob.triggeredBy}</p>
                  <p><span className="text-gray-600">Devices:</span> {selectedJob.devices}</p>
                  <p><span className="text-gray-600">Started:</span> {selectedJob.startedAt}</p>
                  <p><span className="text-gray-600">Finished:</span> {selectedJob.finishedAt}</p>
                </div>
              </div>

              <div>
                <h4 className="text-gray-900 mb-2">Logs</h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-auto font-mono text-sm">
                  {mockLogs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                  {selectedJob.status === 'running' && (
                    <div className="animate-pulse">Processing...</div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedJob?.status === 'running' && (
              <Button 
                variant="destructive" 
                onClick={() => selectedJob && handleCancelJob(selectedJob.id)}
              >
                Cancel Job
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}