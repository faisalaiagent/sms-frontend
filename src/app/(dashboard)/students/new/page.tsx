'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateStudent } from '@/hooks/useStudents';
import { useClasses, useSections } from '@/hooks/useClasses';
import { ROUTES } from '@/constants';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const studentSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  parentName: z.string().min(2, 'Parent name is required'),
  parentPhone: z.string().min(7, 'Valid phone number is required'),
  parentEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

const STEPS = ['Personal Info', 'Class Assignment', 'Parent Info'];

export default function NewStudentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState('');
  const createStudent = useCreateStudent();
  const { data: classes } = useClasses();
  const { data: sections } = useSections(selectedClassId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const watchGender = watch('gender');
  const watchClassId = watch('classId');
  const watchSectionId = watch('sectionId');

  const STEP_FIELDS: (keyof StudentFormData)[][] = [
    ['fullName', 'gender', 'dateOfBirth'],
    ['classId', 'sectionId'],
    ['parentName', 'parentPhone'],
  ];

  const handleNext = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = async (data: StudentFormData) => {
    const { classId, ...rest } = data;
    void classId; // classId used for section lookup only
    await createStudent.mutateAsync({
      ...rest,
      dateOfBirth: new Date(data.dateOfBirth).toISOString(),
    });
    router.push(ROUTES.STUDENTS);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Add New Student</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the student details below. An admission number will be generated automatically.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                i < step
                  ? 'bg-primary text-primary-foreground'
                  : i === step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-sm',
                i === step ? 'font-medium' : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="h-px w-8 bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Personal Info */}
            {step === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    placeholder="e.g. Ahmed Ali Khan"
                    {...register('fullName')}
                  />
                  {errors.fullName && (
                    <p className="text-destructive text-sm">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Gender *</Label>
                  <Select
                    value={watchGender}
                    onValueChange={(v) => setValue('gender', v as 'MALE' | 'FEMALE' | 'OTHER')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-destructive text-sm">{errors.gender.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth')}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-destructive text-sm">{errors.dateOfBirth.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Home address (optional)"
                    {...register('address')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="+92300000000 (optional)"
                    {...register('emergencyContact')}
                  />
                </div>
              </>
            )}

            {/* Step 2: Class Assignment */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select
                    value={watchClassId}
                    onValueChange={(v) => {
                      setValue('classId', v);
                      setValue('sectionId', '');
                      setSelectedClassId(v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classId && (
                    <p className="text-destructive text-sm">{errors.classId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Section *</Label>
                  <Select
                    value={watchSectionId}
                    onValueChange={(v) => setValue('sectionId', v)}
                    disabled={!watchClassId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          watchClassId ? 'Select section' : 'Select a class first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sections?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          Section {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.sectionId && (
                    <p className="text-destructive text-sm">{errors.sectionId.message}</p>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Parent Info */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent / Guardian Name *</Label>
                  <Input
                    id="parentName"
                    placeholder="e.g. Mr. Ali Khan"
                    {...register('parentName')}
                  />
                  {errors.parentName && (
                    <p className="text-destructive text-sm">{errors.parentName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentPhone">
                    Parent Phone (WhatsApp) *
                  </Label>
                  <Input
                    id="parentPhone"
                    placeholder="+923001234567"
                    {...register('parentPhone')}
                  />
                  {errors.parentPhone && (
                    <p className="text-destructive text-sm">{errors.parentPhone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Parent Email</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="parent@email.com (optional)"
                    {...register('parentEmail')}
                  />
                </div>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3">
                  WhatsApp notifications for attendance and fees will be sent to the phone number above.
                  Make sure it is a valid WhatsApp number.
                </p>
              </>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => (step === 0 ? router.push(ROUTES.STUDENTS) : setStep((s) => s - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {step === 0 ? 'Cancel' : 'Back'}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={createStudent.isPending}>
                  {createStudent.isPending ? 'Adding Student...' : 'Add Student'}
                  <Check className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
