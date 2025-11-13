"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Eye, Download, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Backup {
  id: string;
  device: string;
  timestamp: string;
  size: string;
  hash: string;
  status: string;
  content?: string;
}

export function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([
    { id: '1', device: 'SW-01', timestamp: '2025-11-11 10:00', size: '14 KB', hash: 'a4c3...', status: 'success' },
    { id: '2', device: 'SW-01', timestamp: '2025-11-11 02:00', size: '14 KB', hash: 'b9e8...', status: 'success' },
    { id: '3', device: 'SW-02', timestamp: '2025-11-11 10:00', size: '8 KB', hash: 'c7f2...', status: 'success' },
    { id: '4', device: 'RT-01', timestamp: '2025-11-11 02:00', size: '22 KB', hash: 'd5a1...', status: 'success' },
    { id: '5', device: 'FW-01', timestamp: '2025-11-11 02:00', size: '156 KB', hash: 'e8b4...', status: 'success' },
    { id: '6', device: 'SW-01', timestamp: '2025-11-10 23:00', size: '14 KB', hash: 'f3c9...', status: 'success' },
    { id: '7', device: 'RT-01', timestamp: '2025-11-10 23:00', size: '22 KB', hash: 'g1d7...', status: 'success' },
  ]);
  const [deviceFilter, setDeviceFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const devices = ['All', ...Array.from(new Set(backups.map(b => b.device)))];
  
  const filteredBackups = backups.filter(backup => {
    const matchesDevice = deviceFilter === 'All' || backup.device === deviceFilter;
    const matchesSearch = searchQuery === '' || 
      backup.device.toLowerCase().includes(searchQuery.toLowerCase()) ||
      backup.timestamp.includes(searchQuery);
    return matchesDevice && matchesSearch;
  });

  const mockBackupContent = `!
! Last configuration change at 10:00:23 UTC Mon Nov 11 2025
!
version 15.2
service timestamps debug datetime msec
service timestamps log datetime msec
no service password-encryption
!
hostname SW-01
!
boot-start-marker
boot-end-marker
!
enable secret 5 $1$mERr$hx5rVt7rPNoS4wqbXKX7m0
!
no aaa new-model
!
ip cef
no ipv6 cef
!
interface GigabitEthernet0/0
 ip address 10.2.8.1 255.255.255.0
 duplex auto
 speed auto
!
interface GigabitEthernet0/1
 switchport mode access
 switchport access vlan 10
!
ip http server
ip http secure-server
!
line con 0
 logging synchronous
line vty 0 4
 login
 transport input ssh
!
end`;

  const handlePreview = (backup: Backup) => {
    setSelectedBackup({ ...backup, content: mockBackupContent });
    setIsPreviewOpen(true);
  };

  const handleDownload = (backup: Backup) => {
    const blob = new Blob([mockBackupContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.device}_${backup.timestamp.replace(/[: ]/g, '-')}.cfg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup file downloaded');
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
                <TableCell>{backup.device}</TableCell>
                <TableCell>{backup.timestamp}</TableCell>
                <TableCell>{backup.size}</TableCell>
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
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(backup)}
                      title="Download"
                      className="gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedBackup?.device} - {selectedBackup?.timestamp}
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
            >
              <Download className="w-4 h-4" />
              Download
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