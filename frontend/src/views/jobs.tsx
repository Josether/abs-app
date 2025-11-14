"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';

interface Job {
  id: number;
  triggeredBy: string;
  devices: number;
  status: 'running' | 'success' | 'failed' | 'queued';
  startedAt: string | null;
  finishedAt: string | null;
  log?: string | null;
}

  type ApiJob = {
    id: number;
    triggered_by?: string;
    triggeredBy?: string;
    devices?: number;
    status: string;
    started_at?: string;
    startedAt?: string;
    finished_at?: string;
    finishedAt?: string;
    log?: string;
  };

export function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await apiGet<ApiJob[]>('/jobs');
      const mapped = data.map((j) => ({
        id: j.id,
        triggeredBy: j.triggered_by ?? j.triggeredBy ?? '',
        devices: j.devices ?? 0,
        status: j.status as Job['status'],
        startedAt: j.started_at ?? j.startedAt ?? null,
        finishedAt: j.finished_at ?? j.finishedAt ?? null,
        log: j.log ?? null,
      }));
      setJobs(mapped);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await fetchJobs();
    })();
    const interval = setInterval(() => {
      if (mounted) fetchJobs();
    }, 5000);
    return () => { mounted = false; clearInterval(interval); };
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

  const handleCancelJob = (jobId: number) => {
    setLoading(true);
    apiPost(`/jobs/${jobId}/cancel`, {})
      .then(() => {
        toast.success('Job cancelled successfully');
        fetchJobs();
        setIsDetailOpen(false);
      })
      .catch((err) => toast.error(String(err.message || err)))
      .finally(() => setLoading(false));
  };

  const handleRunManual = () => {
    setLoading(true);
    apiPost('/jobs/run/manual', {})
      .then(() => {
        toast.success('Manual backup job queued');
        fetchJobs();
      })
      .catch((err) => toast.error(String(err.message || err)))
      .finally(() => setLoading(false));
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
        <Button onClick={handleRunManual} className="gap-2" disabled={loading}>
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
                <TableCell>{`#${job.id}`}</TableCell>
                <TableCell>{job.triggeredBy}</TableCell>
                <TableCell>{job.devices}</TableCell>
                <TableCell>{getStatusBadge(job.status)}</TableCell>
                <TableCell>{job.startedAt ? new Date(job.startedAt).toLocaleString() : '-'}</TableCell>
                <TableCell>{job.finishedAt ? new Date(job.finishedAt).toLocaleString() : '-'}</TableCell>
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
              <div>
                <h4 className="text-gray-900 mb-2">Details</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Triggered by:</span> {selectedJob.triggeredBy}</p>
                  <p><span className="text-gray-600">Devices:</span> {selectedJob.devices}</p>
                  <p><span className="text-gray-600">Started:</span> {selectedJob.startedAt ? new Date(selectedJob.startedAt).toLocaleString() : '-'}</p>
                  <p><span className="text-gray-600">Finished:</span> {selectedJob.finishedAt ? new Date(selectedJob.finishedAt).toLocaleString() : '-'}</p>
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