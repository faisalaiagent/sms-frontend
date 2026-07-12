'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { Plus, Trash2, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api, attachAuthInterceptor } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type { ApiSuccess, Class } from '@/types';
import { toast } from 'sonner';

interface ClassWithSections extends Omit<Class, 'sections'> {
  sections: Array<{
    id: string;
    name: string;
    capacity: number;
    _count?: { students: number };
  }>;
}

export default function ClassesPage() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showCreateSection, setShowCreateSection] = useState<string | null>(null);
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionCapacity, setNewSectionCapacity] = useState('40');

  // Fetch academic years to get current year id
  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<Array<{ id: string; name: string; isCurrent: boolean }>>>(
        API_ENDPOINTS.ACADEMIC_YEARS
      );
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const currentYear = academicYears?.find((y) => y.isCurrent);

  // Fetch classes
  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes-full'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<ApiSuccess<ClassWithSections[]>>(
        API_ENDPOINTS.CLASSES
      );
      return res.data.data;
    },
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  // Create class mutation
  const createClass = useMutation({
    mutationFn: async (name: string) => {
      attachAuthInterceptor(() => getToken());
      if (!currentYear) throw new Error('No current academic year found');
      const res = await api.post(API_ENDPOINTS.CLASSES, {
        name,
        academicYearId: currentYear.id,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes-full'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully');
      setShowCreateClass(false);
      setNewClassName('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create class';
      toast.error(msg);
    },
  });

  // Create section mutation
  const createSection = useMutation({
    mutationFn: async ({ classId, name, capacity }: { classId: string; name: string; capacity: number }) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post(API_ENDPOINTS.SECTIONS, { name, classId, capacity });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes-full'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      toast.success('Section created successfully');
      setShowCreateSection(null);
      setNewSectionName('');
      setNewSectionCapacity('40');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create section';
      toast.error(msg);
    },
  });

  // Delete class mutation
  const deleteClass = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.delete(`${API_ENDPOINTS.CLASSES}/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes-full'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted');
      setDeleteClassId(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to delete class';
      toast.error(msg);
    },
  });

  const totalStudents = classes?.reduce(
    (sum, cls) =>
      sum + (cls.sections?.reduce((s, sec) => s + (sec._count?.students ?? 0), 0) ?? 0),
    0
  ) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Classes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {classes?.length ?? 0} classes · {totalStudents} total students
            {currentYear && ` · ${currentYear.name}`}
          </p>
        </div>
        <Button onClick={() => setShowCreateClass(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Classes list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="space-y-3">
          {classes.map((cls) => {
            const isExpanded = expandedClass === cls.id;
            const studentCount = cls.sections?.reduce(
              (s, sec) => s + (sec._count?.students ?? 0), 0
            ) ?? 0;

            return (
              <Card key={cls.id} className="overflow-hidden">
                {/* Class row */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedClass(isExpanded ? null : cls.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm">
                      {cls.name.replace('Grade ', '')}
                    </div>
                    <div>
                      <p className="font-medium">{cls.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {cls.sections?.length ?? 0} sections · {studentCount} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {cls.sections?.length ?? 0} sections
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteClassId(cls.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded sections */}
                {isExpanded && (
                  <div className="border-t bg-muted/20">
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide text-xs">
                          Sections
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCreateSection(cls.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Section
                        </Button>
                      </div>
                      {cls.sections && cls.sections.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {cls.sections.map((sec) => (
                            <div
                              key={sec.id}
                              className="flex items-center justify-between rounded-md border bg-background p-3"
                            >
                              <div>
                                <p className="font-medium text-sm">Section {sec.name}</p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">
                                    {sec._count?.students ?? 0} / {sec.capacity}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No sections yet. Add one to get started.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-muted-foreground text-sm">No classes found.</p>
            <Button onClick={() => setShowCreateClass(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Class
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Class Dialog */}
      <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="className">Class Name *</Label>
              <Input
                id="className"
                placeholder='e.g. "Grade 11" or "Class A"'
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newClassName.trim()) {
                    createClass.mutate(newClassName.trim());
                  }
                }}
              />
            </div>
            {currentYear && (
              <p className="text-xs text-muted-foreground">
                Will be created under academic year: <strong>{currentYear.name}</strong>
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateClass(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => newClassName.trim() && createClass.mutate(newClassName.trim())}
                disabled={createClass.isPending || !newClassName.trim()}
              >
                {createClass.isPending ? 'Creating...' : 'Create Class'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Section Dialog */}
      <Dialog
        open={!!showCreateSection}
        onOpenChange={(open) => !open && setShowCreateSection(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Section to{' '}
              {classes?.find((c) => c.id === showCreateSection)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="sectionName">Section Name *</Label>
              <Input
                id="sectionName"
                placeholder='e.g. "C" or "Blue"'
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="100"
                value={newSectionCapacity}
                onChange={(e) => setNewSectionCapacity(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateSection(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (showCreateSection && newSectionName.trim()) {
                    createSection.mutate({
                      classId: showCreateSection,
                      name: newSectionName.trim(),
                      capacity: parseInt(newSectionCapacity) || 40,
                    });
                  }
                }}
                disabled={createSection.isPending || !newSectionName.trim()}
              >
                {createSection.isPending ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteClassId}
        onOpenChange={(open) => !open && setDeleteClassId(null)}
        title="Delete Class"
        description="This will permanently delete the class and all its sections. Students must be transferred first. This cannot be undone."
        confirmLabel="Delete Class"
        loading={deleteClass.isPending}
        onConfirm={() => {
          if (deleteClassId) deleteClass.mutate(deleteClassId);
        }}
      />
    </div>
  );
}
