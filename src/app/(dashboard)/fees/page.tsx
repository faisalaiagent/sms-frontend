'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import {
  Plus, Trash2, Users, Search,
  Banknote, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { api, attachAuthInterceptor } from '@/lib/api';
import { getInitials, formatDate, formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  lateFeeAmount: number;
  lateFeeGraceDays: number;
  class?: { name: string };
  academicYear: { name: string };
  _count: { studentFees: number };
}

interface OutstandingFee {
  id: string;
  status: string;
  finalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  dueDate: string;
  feeName: string;
  student: {
    id: string;
    fullName: string;
    admissionNumber: string;
    parentPhone: string;
    section: { name: string; class: { name: string } };
  };
}

interface StudentFee {
  id: string;
  status: string;
  finalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  feeStructure: { name: string; dueDate: string };
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    method: string;
    invoiceNumber: string;
  }>;
}

interface AcademicYear { id: string; name: string; isCurrent: boolean; }
interface Class { id: string; name: string; }
interface Student { id: string; fullName: string; admissionNumber: string; }

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
  PARTIAL: { label: 'Partial', color: 'bg-blue-100 text-blue-700' },
  PAID:    { label: 'Paid',    color: 'bg-green-100 text-green-700' },
  WAIVED:  { label: 'Waived', color: 'bg-gray-100 text-gray-700' },
};

export default function FeesPage() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();

  const [showCreateFee, setShowCreateFee] = useState(false);
  const [deleteFeeId, setDeleteFeeId] = useState<string | null>(null);
  const [assignFeeId, setAssignFeeId] = useState<string | null>(null);

  // Payment recording state
  const [showPayment, setShowPayment] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentFeeId, setSelectedStudentFeeId] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');

  // Create fee form state
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeDueDate, setFeeDueDate] = useState('');
  const [feeClassId, setFeeClassId] = useState('');
  const [feeLateFee, setFeeLateFee] = useState('0');
  const [feeGraceDays, setFeeGraceDays] = useState('0');

  const fetchWithAuth = async (url: string) => {
    attachAuthInterceptor(() => getToken());
    const res = await api.get(url);
    return res.data.data;
  };

  const { data: feeStructures, isLoading: structuresLoading } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: () => fetchWithAuth('/fees/structures'),
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  const { data: outstanding, isLoading: outstandingLoading } = useQuery({
    queryKey: ['fees-outstanding'],
    queryFn: () => fetchWithAuth('/fees/outstanding'),
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  const { data: collectionSummary } = useQuery({
    queryKey: ['fees-summary'],
    queryFn: () => fetchWithAuth('/fees/collection-summary'),
    enabled: !!isSignedIn,
    staleTime: 0,
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: () => fetchWithAuth('/academic-years'),
    enabled: !!isSignedIn,
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: () => fetchWithAuth('/classes'),
    enabled: !!isSignedIn,
  });

  const { data: studentSearchResults } = useQuery({
    queryKey: ['students-search', searchStudent],
    queryFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.get(`/students?search=${searchStudent}&status=ACTIVE&limit=10`);
      return res.data.data;
    },
    enabled: !!isSignedIn && searchStudent.length >= 2,
    staleTime: 0,
  });

  const { data: studentFees } = useQuery({
    queryKey: ['student-fees', selectedStudent?.id],
    queryFn: () => fetchWithAuth(`/fees/student/${selectedStudent!.id}`),
    enabled: !!isSignedIn && !!selectedStudent,
    staleTime: 0,
  });

  const currentYear = (academicYears as AcademicYear[] | undefined)?.find((y) => y.isCurrent);

  // Mutations
  const createFee = useMutation({
    mutationFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post('/fees/structures', {
        name: feeName,
        amount: parseFloat(feeAmount),
        dueDate: feeDueDate,
        academicYearId: currentYear?.id,
        classId: feeClassId || undefined,
        lateFeeAmount: parseFloat(feeLateFee) || 0,
        lateFeeGraceDays: parseInt(feeGraceDays) || 0,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      queryClient.invalidateQueries({ queryKey: ['fees-summary'] });
      toast.success('Fee structure created');
      setShowCreateFee(false);
      setFeeName(''); setFeeAmount(''); setFeeDueDate('');
      setFeeClassId(''); setFeeLateFee('0'); setFeeGraceDays('0');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to create fee';
      toast.error(msg);
    },
  });

  const deleteFee = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      await api.delete(`/fees/structures/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      toast.success('Fee structure deleted');
      setDeleteFeeId(null);
    },
    onError: () => toast.error('Failed to delete fee structure'),
  });

  const assignFee = useMutation({
    mutationFn: async (id: string) => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post(`/fees/structures/${id}/assign`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fees-outstanding'] });
      toast.success(data.message);
      setAssignFeeId(null);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to assign fee';
      toast.error(msg);
    },
  });

  const recordPayment = useMutation({
    mutationFn: async () => {
      attachAuthInterceptor(() => getToken());
      const res = await api.post('/fees/payments', {
        studentFeeId: selectedStudentFeeId,
        studentId: selectedStudent!.id,
        amount: parseFloat(payAmount),
        paymentDate: payDate,
        method: payMethod,
        referenceNumber: payRef || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fees-outstanding'] });
      queryClient.invalidateQueries({ queryKey: ['fees-summary'] });
      queryClient.invalidateQueries({ queryKey: ['student-fees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(data.message);
      setShowPayment(false);
      setSelectedStudent(null);
      setSelectedStudentFeeId('');
      setPayAmount('');
      setPayRef('');
      setSearchStudent('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to record payment';
      toast.error(msg);
    },
  });

  const outstandingFees = (outstanding as OutstandingFee[] | undefined) ?? [];
  const totalOutstanding = outstandingFees.reduce((sum, f) => sum + f.outstandingAmount, 0);
  const thisMonth = Number((collectionSummary as { thisMonth?: number } | undefined)?.thisMonth ?? 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fees</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage fee structures, record payments, and track outstanding balances.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPayment(true)}>
            <Banknote className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
          <Button onClick={() => setShowCreateFee(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Fee Structure
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Collected This Month</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(thisMonth)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Outstanding</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Students with Pending Fees</p>
            <p className="text-3xl font-bold mt-1">
              {new Set(outstandingFees.map((f) => f.student.id)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="structures">
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Fees</TabsTrigger>
          <TabsTrigger value="history">Payment History</TabsTrigger>
        </TabsList>

        {/* Fee Structures Tab */}
        <TabsContent value="structures" className="mt-4">
          {structuresLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : (feeStructures as FeeStructure[] | undefined)?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                <Banknote className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No fee structures yet.</p>
                <Button onClick={() => setShowCreateFee(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Fee Structure
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(feeStructures as FeeStructure[])?.map((fee) => (
                <Card key={fee.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Banknote className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{fee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(fee.amount)} · Due {formatDate(fee.dueDate)}
                            {fee.class ? ` · ${fee.class.name}` : ' · All Classes'}
                            {fee.lateFeeAmount > 0 && ` · Late fee: ${formatCurrency(fee.lateFeeAmount)}/day after ${fee.lateFeeGraceDays} days`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {fee._count.studentFees} assigned
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssignFeeId(fee.id)}
                        >
                          <Users className="mr-1 h-3 w-3" />
                          Assign to Class
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteFeeId(fee.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Outstanding Fees Tab */}
        <TabsContent value="outstanding" className="mt-4">
          {outstandingLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : outstandingFees.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm text-muted-foreground">No outstanding fees. All paid up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {outstandingFees.map((fee) => {
                const isOverdue = new Date(fee.dueDate) < new Date();
                return (
                  <Card key={fee.id} className={cn(isOverdue && 'border-red-200')}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {getInitials(fee.student.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{fee.student.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {fee.student.admissionNumber} · {fee.student.section?.class?.name} — {fee.student.section?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {fee.feeName} · Due {formatDate(fee.dueDate)}
                              {isOverdue && <span className="text-red-500 ml-1">(Overdue)</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold text-sm">{formatCurrency(fee.outstandingAmount)}</p>
                            <p className="text-xs text-muted-foreground">outstanding</p>
                          </div>
                          <Badge className={STATUS_CONFIG[fee.status]?.color}>
                            {STATUS_CONFIG[fee.status]?.label}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(fee.student as Student);
                              setSelectedStudentFeeId(fee.id);
                              setPayAmount(String(fee.outstandingAmount));
                              setShowPayment(true);
                            }}
                          >
                            Collect
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-48 gap-3">
              <Clock className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Search for a student to view their payment history.
              </p>
              <Button variant="outline" onClick={() => setShowPayment(true)}>
                <Search className="mr-2 h-4 w-4" />
                Search Student
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Fee Structure Dialog */}
      <Dialog open={showCreateFee} onOpenChange={setShowCreateFee}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Fee Name *</Label>
              <Input placeholder='e.g. "Monthly Tuition — January"' value={feeName} onChange={(e) => setFeeName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (PKR) *</Label>
                <Input type="number" placeholder="5000" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" value={feeDueDate} onChange={(e) => setFeeDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Class (leave empty for all classes)</Label>
              <Select value={feeClassId} onValueChange={setFeeClassId}>
                <SelectTrigger><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Classes</SelectItem>
                  {(classes as Class[] | undefined)?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Late Fee (PKR/day)</Label>
                <Input type="number" placeholder="0" value={feeLateFee} onChange={(e) => setFeeLateFee(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Grace Days</Label>
                <Input type="number" placeholder="0" value={feeGraceDays} onChange={(e) => setFeeGraceDays(e.target.value)} />
              </div>
            </div>
            {currentYear && (
              <p className="text-xs text-muted-foreground">Academic Year: <strong>{currentYear.name}</strong></p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateFee(false)}>Cancel</Button>
              <Button
                onClick={() => createFee.mutate()}
                disabled={createFee.isPending || !feeName || !feeAmount || !feeDueDate || !currentYear}
              >
                {createFee.isPending ? 'Creating...' : 'Create Fee'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={(open) => {
        if (!open) {
          setShowPayment(false);
          setSelectedStudent(null);
          setSelectedStudentFeeId('');
          setPayAmount('');
          setSearchStudent('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Step 1 — Search student */}
            {!selectedStudent ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Search Student</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search by name or admission number..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                  </div>
                </div>
                {(studentSearchResults as Student[] | undefined)?.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedStudent(s)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{getInitials(s.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.admissionNumber}</p>
                    </div>
                  </div>
                ))}
                {searchStudent.length >= 2 && !(studentSearchResults as Student[] | undefined)?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">No students found.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Student info */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{getInitials(selectedStudent.fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{selectedStudent.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selectedStudent.admissionNumber}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setSelectedStudent(null);
                    setSelectedStudentFeeId('');
                    setPayAmount('');
                  }}>Change</Button>
                </div>

                {/* Select fee */}
                {!selectedStudentFeeId && (
                  <div className="space-y-2">
                    <Label>Select Fee to Pay</Label>
                    {(studentFees as StudentFee[] | undefined)?.filter((f) => f.status !== 'PAID' && f.status !== 'WAIVED').length === 0 ? (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        All fees are paid for this student.
                      </div>
                    ) : (
                      (studentFees as StudentFee[] | undefined)?.filter((f) => f.status !== 'PAID' && f.status !== 'WAIVED').map((fee) => (
                        <div
                          key={fee.id}
                          className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            setSelectedStudentFeeId(fee.id);
                            setPayAmount(String(fee.outstandingAmount));
                          }}
                        >
                          <div>
                            <p className="font-medium text-sm">{fee.feeStructure.name}</p>
                            <p className="text-xs text-muted-foreground">Due {formatDate(fee.feeStructure.dueDate)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{formatCurrency(fee.outstandingAmount)}</p>
                            <Badge className={STATUS_CONFIG[fee.status]?.color + ' text-xs'}>
                              {STATUS_CONFIG[fee.status]?.label}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Payment details */}
                {selectedStudentFeeId && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Amount (PKR) *</Label>
                        <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Date *</Label>
                        <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select value={payMethod} onValueChange={setPayMethod}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                          <SelectItem value="CHEQUE">Cheque</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Reference Number</Label>
                      <Input placeholder="Cheque no. / transaction ID (optional)" value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setSelectedStudentFeeId('')}>Back</Button>
                      <Button
                        onClick={() => recordPayment.mutate()}
                        disabled={recordPayment.isPending || !payAmount || !payDate}
                      >
                        {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign fee confirm */}
      <ConfirmDialog
        open={!!assignFeeId}
        onOpenChange={(open) => !open && setAssignFeeId(null)}
        title="Assign Fee to Students"
        description="This will assign this fee to all active students in the selected class (or all students if school-wide). Students who already have this fee assigned will be skipped."
        confirmLabel="Assign Fee"
        variant="default"
        loading={assignFee.isPending}
        onConfirm={() => { if (assignFeeId) assignFee.mutate(assignFeeId); }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteFeeId}
        onOpenChange={(open) => !open && setDeleteFeeId(null)}
        title="Delete Fee Structure"
        description="This will delete the fee structure. Students who have already been assigned this fee will keep their records."
        confirmLabel="Delete"
        loading={deleteFee.isPending}
        onConfirm={() => { if (deleteFeeId) deleteFee.mutate(deleteFeeId); }}
      />
    </div>
  );
}
