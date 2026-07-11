'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { api, attachAuthInterceptor } from '@/lib/api';
import { toast } from 'sonner';

interface Student {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
  address?: string;
  emergencyContact?: string;
  status: string;
  sectionId: string;
  section?: { classId: string };
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  admissionNumber: string;
}
interface ClassOption { id: string; name: string; }
interface SectionOption { id: string; name: string; classId: string; }

export default function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: student, isLoading } = useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: Student }>(`/students/${id}`);
      return res.data.data;
    },
    enabled: !!isSignedIn && !!id,
    staleTime: 0,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: ClassOption[] }>('/classes');
      return res.data.data;
    },
    enabled: !!isSignedIn,
  });

  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [status, setStatus] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: sections } = useQuery({
    queryKey: ['sections', classId],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get<{ data: SectionOption[] }>(`/sections?classId=${classId}`);
      return res.data.data;
    },
    enabled: !!isSignedIn && !!classId,
  });

  useEffect(() => {
    if (student) {
      setFullName(student.fullName);
      setGender(student.gender);
      setDateOfBirth(student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '');
      setAddress(student.address ?? '');
      setEmergencyContact(student.emergencyContact ?? '');
      setStatus(student.status);
      setClassId(student.section?.classId ?? '');
      setSectionId(student.sectionId);
      setParentName(student.parentName);
      setParentPhone(student.parentPhone);
      setParentEmail(student.parentEmail ?? '');
    }
  }, [student]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.patch(`/students/${id}`, {
        fullName, gender,
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        sectionId, parentName, parentPhone,
        parentEmail: parentEmail || undefined,
        address: address || undefined,
        emergencyContact: emergencyContact || undefined,
        status,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(data.message ?? 'Student updated');
      router.push(`/students/${id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to update student';
      toast.error(msg);
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName || fullName.length < 2) newErrors.fullName = 'Full name must be at least 2 characters';
    if (!gender) newErrors.gender = 'Gender is required';
    if (!dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!sectionId) newErrors.sectionId = 'Section is required';
    if (!parentName || parentName.length < 2) newErrors.parentName = 'Parent name is required';
    if (!parentPhone || parentPhone.length < 7) newErrors.parentPhone = 'Valid phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Student not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit Student</h2>
          <p className="text-muted-foreground text-sm">
            {student.fullName} — {student.admissionNumber}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gender *</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-destructive text-sm">{errors.gender}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                {errors.dateOfBirth && <p className="text-destructive text-sm">{errors.dateOfBirth}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input id="emergencyContact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Class Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section *</Label>
              <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                <SelectTrigger><SelectValue placeholder={classId ? 'Select section' : 'Select a class first'} /></SelectTrigger>
                <SelectContent>
                  {sections?.map((s) => <SelectItem key={s.id} value={s.id}>Section {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.sectionId && <p className="text-destructive text-sm">{errors.sectionId}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Parent / Guardian</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="parentName">Parent Name *</Label>
              <Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} />
              {errors.parentName && <p className="text-destructive text-sm">{errors.parentName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">Phone (WhatsApp) *</Label>
              <Input id="parentPhone" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
              {errors.parentPhone && <p className="text-destructive text-sm">{errors.parentPhone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Email</Label>
              <Input id="parentEmail" type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            <Save className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
