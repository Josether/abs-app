"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiGet, apiGetBlob, apiGetText } from '@/lib/api';

interface Backup {
  id: number;
  device_id: number;
  timestamp: string;
  size_bytes: number;
  hash: string;
  status: string;
  device_name?: string;
  content?: string;
}

export function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewingId, setPreviewingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await apiGet<unknown[]>('/backups');
      const mapped = data.map((b: unknown) => {
        const backup = b as { id: number; device_id: number; timestamp: string; size: number; hash: string; status: string; device_name?: string };
        return {
          id: backup.id,
          device_id: backup.device_id,
          timestamp: backup.timestamp,
          size_bytes: backup.size,
          hash: backup.hash,
          status: backup.status,
          device_name: backup.device_name ?? String(backup.device_id),
        };
      }) as Backup[];
      setBackups(mapped);
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : String(err);
      toast.error('Failed to load backups: ' + (msg || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBackups(); }, []);

  const devices = ['All', ...Array.from(new Set(backups.map(b => b.device_name ?? String(b.device_id))))];
  
  const filteredBackups = backups.filter(backup => {
    const name = backup.device_name ?? String(backup.device_id);
    const matchesDevice = deviceFilter === 'All' || name === deviceFilter;
    const matchesSearch = searchQuery === '' || 
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      backup.timestamp.includes(searchQuery);
    return matchesDevice && matchesSearch;
  });

  const formatSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024*1024) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/(1024*1024)).toFixed(1)} MB`;
  };

  const handlePreview = async (backup: Backup) => {
    setPreviewingId(backup.id);
    try {
      const txt = await apiGetText(`/backups/${backup.id}/download`);
      setSelectedBackup({ ...backup, content: txt });
      setIsPreviewOpen(true);
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : String(err);
      toast.error('Failed to load backup preview: ' + (msg || 'Unknown error'));
    } finally {
      setPreviewingId(null);
    }
  };

  const handleDownload = async (backup: Backup) => {
    setDownloadingId(backup.id);
    try {
      const blob = await apiGetBlob(`/backups/${backup.id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${backup.device_name ?? backup.device_id}_${backup.timestamp.replace(/[: ]/g, '-')}.cfg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup file downloaded successfully');
    } catch (err: unknown) {
      const msg = (err && typeof err === 'object' && 'message' in err) ? (err as { message?: string }).message : String(err);
      toast.error('Failed to download backup: ' + (msg || 'Unknown error'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900">Backups</h2>
        <p className="text-gray-500">Browse and download backup configurations</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Device:</span>
          <Select value={deviceFilter} onValueChange={setDeviceFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {devices.map(device => (
                <SelectItem key={device} value={device}>{device}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Date Range:</span>
          <Input type="date" className="w-48" />
          <span className="text-sm text-gray-600">to</span>
          <Input type="date" className="w-48" />
        </div>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search backups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Retention Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Retention policy automatically keeps the last N backups per device based on schedule settings. Old backups are pruned after successful new backups.
        </p>
      </div>

      {/* Backups Table */}
      <div className="border rounded-lg bg-white">
        {loading && backups.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-500">Loading backups...</p>
            </div>
          </div>
        ) : filteredBackups.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">No backups found</p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Hash</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBackups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell>{backup.device_name ?? String(backup.device_id)}</TableCell>
                <TableCell>{backup.timestamp}</TableCell>
                <TableCell>{formatSize(backup.size_bytes)}</TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{backup.hash}</code>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-700">✅</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreview(backup)}
                      title="Preview"
                      className="gap-1"
                      disabled={previewingId === backup.id || downloadingId === backup.id}
                    >
                      {previewingId === backup.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                      {previewingId === backup.id ? 'Loading...' : 'Preview'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(backup)}
                      title="Download"
                      className="gap-1"
                      disabled={previewingId === backup.id || downloadingId === backup.id}
                    >
                      {downloadingId === backup.id ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadingId === backup.id ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedBackup?.device_name ?? selectedBackup?.device_id} - {selectedBackup?.timestamp}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-96 overflow-auto font-mono text-sm">
              <pre>{selectedBackup?.content}</pre>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => selectedBackup && handleDownload(selectedBackup)}
              className="gap-2"
              disabled={downloadingId === selectedBackup?.id}
            >
              {downloadingId === selectedBackup?.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download
                </>
              )}
            </Button>
            <Button onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}