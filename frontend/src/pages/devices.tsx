"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Trash2, Edit, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Device {
  id: string;
  hostname: string;
  ip: string;
  vendor: string;
  protocol: string;
  port: string;
  lastBackup: string;
}

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', hostname: 'SW-01', ip: '10.2.8.1', vendor: 'Cisco', protocol: 'SSH', port: '22', lastBackup: '11/10 23:00' },
    { id: '2', hostname: 'SW-02', ip: '10.2.8.2', vendor: 'Mikrotik', protocol: 'Telnet', port: '23', lastBackup: 'Never' },
    { id: '3', hostname: 'RT-01', ip: '10.2.8.10', vendor: 'Juniper', protocol: 'SSH', port: '22', lastBackup: '11/11 02:00' },
    { id: '4', hostname: 'FW-01', ip: '10.2.8.254', vendor: 'Fortinet', protocol: 'SSH', port: '22', lastBackup: '11/11 02:00' },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    hostname: '',
    ip: '',
    vendor: 'Cisco',
    protocol: 'SSH',
    port: '22',
    username: '',
    password: '',
    secret: '',
    tags: '',
  });

  const vendors = [
    'Cisco', 'Mikrotik', 'Juniper', 'Fortinet', 'HP/Aruba', 
    'Huawei', 'Dell', 'Arista', 'Extreme', 'Ubiquiti'
  ];

  const filteredDevices = devices.filter(device => 
    device.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.ip.includes(searchQuery)
  );

  const handleAddDevice = () => {
    setEditingDevice(null);
    setFormData({
      hostname: '',
      ip: '',
      vendor: 'Cisco',
      protocol: 'SSH',
      port: '22',
      username: '',
      password: '',
      secret: '',
      tags: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      hostname: device.hostname,
      ip: device.ip,
      vendor: device.vendor,
      protocol: device.protocol,
      port: device.port,
      username: '',
      password: '',
      secret: '',
      tags: '',
    });
    setIsDialogOpen(true);
  };

  const handleSaveDevice = () => {
    if (editingDevice) {
      setDevices(devices.map(d => 
        d.id === editingDevice.id 
          ? { ...d, ...formData }
          : d
      ));
      toast.success('Device updated successfully');
    } else {
      const newDevice: Device = {
        id: Date.now().toString(),
        hostname: formData.hostname,
        ip: formData.ip,
        vendor: formData.vendor,
        protocol: formData.protocol,
        port: formData.port,
        lastBackup: 'Never',
      };
      setDevices([...devices, newDevice]);
      toast.success('Device added successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDeleteDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
    toast.success('Device deleted successfully');
  };

  const handleTestConnection = () => {
    setIsTestDialogOpen(true);
    setTestResult(null);
    
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3;
      setTestResult({
        success,
        message: success 
          ? 'Connection successful! Device is reachable.' 
          : 'Connection failed: Timeout - device is not reachable or credentials are incorrect.'
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Devices</h2>
          <p className="text-gray-500">Manage network devices for backup</p>
        </div>
        <Button onClick={handleAddDevice} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Device
        </Button>
      </div>

      {/* Search Box */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search devices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Devices Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hostname</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Protocol</TableHead>
              <TableHead>Port</TableHead>
              <TableHead>Last Backup</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.map((device) => (
              <TableRow key={device.id}>
                <TableCell>{device.hostname}</TableCell>
                <TableCell>{device.ip}</TableCell>
                <TableCell>{device.vendor}</TableCell>
                <TableCell>{device.protocol}</TableCell>
                <TableCell>{device.port}</TableCell>
                <TableCell>{device.lastBackup}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        handleEditDevice(device);
                        setTimeout(handleTestConnection, 100);
                      }}
                      title="Test Connection"
                    >
                      <TestTube className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditDevice(device)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteDevice(device.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Device Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Edit Device' : 'Add Device'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="vendor">Vendor</Label>
              <Select 
                value={formData.vendor} 
                onValueChange={(value) => setFormData({ ...formData, vendor: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                placeholder="SW-01"
              />
            </div>

            <div>
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                placeholder="10.2.8.1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="protocol">Protocol</Label>
                <Select 
                  value={formData.protocol} 
                  onValueChange={(value) => {
                    setFormData({ 
                      ...formData, 
                      protocol: value,
                      port: value === 'SSH' ? '22' : '23'
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSH">SSH</SelectItem>
                    <SelectItem value="Telnet">Telnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="admin"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingDevice ? 'Leave empty to keep current' : ''}
              />
            </div>

            <div>
              <Label htmlFor="secret">Secret (enable) - Optional</Label>
              <Input
                id="secret"
                type="password"
                value={formData.secret}
                onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                placeholder="Optional enable secret"
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags - Optional</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="production, core, edge"
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              💡 Device credentials are stored encrypted and never shown again.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTestConnection}>
              Test Connection
            </Button>
            <Button onClick={handleSaveDevice}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Connection Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Testing Connection</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {testResult === null ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-gray-600">Connecting to device...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {testResult.success ? (
                  <CheckCircle className="w-16 h-16 text-green-600" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-600" />
                )}
                <p className={testResult.success ? 'text-green-600' : 'text-red-600'}>
                  {testResult.message}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}