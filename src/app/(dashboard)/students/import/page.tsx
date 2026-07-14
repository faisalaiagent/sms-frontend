'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import {
  ArrowLeft, Upload, Download, FileSpreadsheet,
  CheckCircle, XCircle, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api, attachAuthInterceptor } from '@/lib/api';
import { toast } from 'sonner';

interface ImportRowResult {
  row: number;
  status: 'success' | 'error';
  studentName?: string;
  admissionNumber?: string;
  errors?: string[];
}

interface ImportSummary {
  totalRows: number;
  successCount: number;
  errorCount: number;
  results: ImportRowResult[];
}

const CSV_TEMPLATE = `full_name,gender,date_of_birth,class_name,section_name,parent_name,parent_phone,parent_email,address,emergency_contact
Ahmed Khan,MALE,2015-05-14,Grade 6,A,Asif Khan,+923001234567,asif@example.com,House 12 Block B,+923001234568
Sara Ali,FEMALE,2014-08-22,Grade 6,A,Ali Ahmed,+923001234569,,Flat 3 Tower C,`;

export default function ImportStudentsPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      attachAuthInterceptor(() => getToken());
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/students/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setSummary(data.data as ImportSummary);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if ((data.data as ImportSummary).errorCount === 0) {
        toast.success(data.message);
      } else {
        toast.warning(data.message);
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Import failed. Please check your file and try again.';
      toast.error(msg);
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    setSelectedFile(file);
    setSummary(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/students"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Import Students</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Bulk-add students from a CSV file
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 1 — Prepare your CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Your file needs these columns exactly: <code className="text-xs bg-muted px-1 py-0.5 rounded">full_name, gender, date_of_birth, class_name, section_name, parent_name, parent_phone, parent_email, address, emergency_contact</code>
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>gender</strong> must be MALE, FEMALE, or OTHER</li>
            <li><strong>date_of_birth</strong> must be YYYY-MM-DD (e.g. 2015-05-14)</li>
            <li><strong>class_name</strong> and <strong>section_name</strong> must already exist under Classes</li>
            <li><strong>parent_phone</strong> should include country code (e.g. +923001234567) for WhatsApp to work</li>
            <li><strong>parent_email, address, emergency_contact</strong> are optional — leave blank if unknown</li>
          </ul>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template CSV
          </Button>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Step 2 — Upload your file</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-10 w-10 text-green-600" />
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Drag & drop your CSV here, or click to browse</p>
                <p className="text-xs text-muted-foreground">Max 1000 rows, 5MB file size</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <Button
              className="w-full mt-4"
              onClick={() => importMutation.mutate(selectedFile)}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? 'Importing...' : 'Import Students'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {summary && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Import Results</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700">
                  {summary.successCount} succeeded
                </Badge>
                {summary.errorCount > 0 && (
                  <Badge className="bg-red-100 text-red-700">
                    {summary.errorCount} failed
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {summary.results.map((r) => (
                <div
                  key={r.row}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                    r.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  {r.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      Row {r.row}{r.studentName ? ` — ${r.studentName}` : ''}
                    </p>
                    {r.status === 'success' ? (
                      <p className="text-xs text-muted-foreground">
                        Admission #{r.admissionNumber}
                      </p>
                    ) : (
                      <ul className="text-xs text-red-700 mt-1 space-y-0.5">
                        {r.errors?.map((e, i) => <li key={i}>• {e}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {summary.successCount > 0 && (
              <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                <p className="text-sm text-blue-800">
                  {summary.successCount} student(s) were added successfully.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setSelectedFile(null); setSummary(null); }}>
                Import Another File
              </Button>
              <Button onClick={() => router.push('/students')}>
                View Students
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
