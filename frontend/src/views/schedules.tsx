"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Schedule {
  id: string;
  name: string;
  intervalDays: number;
  runAt: string;
  targetType: string;
  retention: number;
  notifyOnFail: boolean;
  enabled: boolean;
}

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([
    { 
      id: '1', 
      name: 'Weekly-Backup', 
      intervalDays: 7, 
      runAt: '02:00', 
      targetType: 'All', 
      retention: 10,
      notifyOnFail: true,
      enabled: true 
    },
    { 
      id: '2', 
      name: 'Daily-Core', 
      intervalDays: 1, 
      runAt: '03:00', 
      targetType: 'Tag: core', 
      retention: 30,
      notifyOnFail: true,
      enabled: true 
    },
    { 
      id: '3', 
      name: 'Monthly-Full', 
      intervalDays: 30, 
      runAt: '01:00', 
      targetType: 'All', 
      retention: 12,
      notifyOnFail: false,
      enabled: false 
    },
  ]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    intervalDays: 7,
    runAt: '02:00',
    targetType: 'All',
    retention: 10,
    notifyOnFail: true,
    enabled: true,
  });

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      name: '',
      intervalDays: 7,
      runAt: '02:00',
      targetType: 'All',
      retention: 10,
      notifyOnFail: true,
      enabled: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData(schedule);
    setIsDialogOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!formData.name) {
      toast.error('Please enter a schedule name');
      return;
    }

    if (editingSchedule) {
      setSchedules(schedules.map(s => 
        s.id === editingSchedule.id 
          ? { ...s, ...formData }
          : s
      ));
      toast.success('Schedule updated successfully');
    } else {
      const newSchedule: Schedule = {
        id: Date.now().toString(),
        ...formData,
      };
      setSchedules([...schedules, newSchedule]);
      toast.success('Schedule created successfully');
    }
    setIsDialogOpen(false);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
    toast.success('Schedule deleted successfully');
  };

  const handleToggleEnabled = (id: string) => {
    setSchedules(schedules.map(s => 
      s.id === id 
        ? { ...s, enabled: !s.enabled }
        : s
    ));
    const schedule = schedules.find(s => s.id === id);
    toast.success(`Schedule ${schedule?.enabled ? 'disabled' : 'enabled'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Schedules</h2>
          <p className="text-gray-500">Automated backup schedules (Asia/Jakarta timezone)</p>
        </div>
        <Button onClick={handleAddSchedule} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Schedule
        </Button>
      </div>

      {/* Schedules Table */}
      <div className="border rounded-lg bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Interval (days)</TableHead>
              <TableHead>Run At</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Retention</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell>{schedule.name}</TableCell>
                <TableCell>{schedule.intervalDays}</TableCell>
                <TableCell>{schedule.runAt}</TableCell>
                <TableCell>{schedule.targetType}</TableCell>
                <TableCell>Keep {schedule.retention}</TableCell>
                <TableCell>
                  {schedule.enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-gray-400" />
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditSchedule(schedule)}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleToggleEnabled(schedule.id)}
                      title="Toggle Enable/Disable"
                    >
                      {schedule.enabled ? 'Disable' : 'Enable'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
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

      {/* Add/Edit Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSchedule ? 'Edit Schedule' : 'Add Schedule'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Weekly-Backup"
              />
            </div>

            <div>
              <Label htmlFor="intervalDays">Interval (Days)</Label>
              <Select 
                value={formData.intervalDays.toString()} 
                onValueChange={(value) => setFormData({ ...formData, intervalDays: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Daily)</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="7">7 (Weekly)</SelectItem>
                  <SelectItem value="14">14</SelectItem>
                  <SelectItem value="30">30 (Monthly)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="runAt">Run At (Time)</Label>
              <Input
                id="runAt"
                type="time"
                value={formData.runAt}
                onChange={(e) => setFormData({ ...formData, runAt: e.target.value })}
              />
              <p className="text-sm text-gray-500 mt-1">Asia/Jakarta timezone</p>
            </div>

            <div>
              <Label htmlFor="targetType">Target Type</Label>
              <Select 
                value={formData.targetType} 
                onValueChange={(value) => setFormData({ ...formData, targetType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Devices</SelectItem>
                  <SelectItem value="Tag: core">Tag: core</SelectItem>
                  <SelectItem value="Tag: edge">Tag: edge</SelectItem>
                  <SelectItem value="Tag: production">Tag: production</SelectItem>
                  <SelectItem value="Devices">Specific Devices</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="retention">Retention (keep last N backups)</Label>
              <Input
                id="retention"
                type="number"
                value={formData.retention}
                onChange={(e) => setFormData({ ...formData, retention: parseInt(e.target.value) || 10 })}
                min="1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyOnFail"
                checked={formData.notifyOnFail}
                onCheckedChange={(checked) => setFormData({ ...formData, notifyOnFail: checked as boolean })}
              />
              <Label htmlFor="notifyOnFail" className="cursor-pointer">
                Notify on failure
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
              <Label htmlFor="enabled" className="cursor-pointer">
                Enabled
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSchedule}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}