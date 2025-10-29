import { useState } from 'react';
import { ArrowLeft, Camera, Upload, X, Check, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface UploadedFile {
  file: File;
  preview: string;
  uploaded: boolean;
  url?: string;
  isPDF?: boolean;
  pageCount?: number;
}

export function ScanPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setError(null);

    const newFiles: UploadedFile[] = [];

    for (const file of selectedFiles) {
      const isPDF = file.type === 'application/pdf';

      if (isPDF) {
        try {
          const { getPDFPageCount } = await import('../lib/pdfUtils');
          const pageCount = await getPDFPageCount(file);
          newFiles.push({
            file,
            preview: '',
            uploaded: false,
            isPDF: true,
            pageCount,
          });
        } catch (err) {
          console.error('Error reading PDF:', err);
          setError(`Failed to read PDF: ${file.name}`);
        }
      } else {
        newFiles.push({
          file,
          preview: URL.createObjectURL(file),
          uploaded: false,
          isPDF: false,
        });
      }
    }

    setFiles([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    URL.revokeObjectURL(newFiles[index].preview);
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleUploadAndProcess = async () => {
    if (!user) {
      setError('You must be logged in to upload files. Please sign in and try again.');
      return;
    }

    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress('Creating scan record...');

    try {
      const { data: scan, error: scanError } = await supabase
        .from('scans')
        .insert([
          {
            user_id: user.id,
            status: 'uploading',
            image_urls: [],
          },
        ])
        .select()
        .single();

      if (scanError) {
        throw new Error(`Failed to create scan: ${scanError.message}`);
      }

      if (!scan || !scan.id) {
        throw new Error('Failed to create scan: No scan ID returned');
      }

      console.log('Created scan with ID:', scan.id);

      const uploadedUrls: string[] = [];
      let imageCount = 0;

      for (let i = 0; i < files.length; i++) {
        const uploadFile = files[i];

        if (uploadFile.isPDF) {
          setProgress(`Converting PDF ${i + 1} (${uploadFile.pageCount} pages)...`);

          try {
            const { convertPDFToImages } = await import('../lib/pdfUtils');
            const pdfImages = await convertPDFToImages(uploadFile.file);

            for (let pageIdx = 0; pageIdx < pdfImages.length; pageIdx++) {
              imageCount++;
              setProgress(`Uploading PDF page ${pageIdx + 1} of ${pdfImages.length}...`);

              const pageImage = pdfImages[pageIdx];
              const fileName = `${user.id}/${scan.id}/${Date.now()}-pdf-${i}-page-${pageImage.pageNumber}.png`;

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('scan-images')
                .upload(fileName, pageImage.blob, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: 'image/png',
                });

              if (uploadError) {
                throw new Error(`Failed to upload PDF page ${pageImage.pageNumber}: ${uploadError.message}`);
              }

              const { data: urlData } = supabase.storage
                .from('scan-images')
                .getPublicUrl(uploadData.path);

              uploadedUrls.push(urlData.publicUrl);
            }
          } catch (err) {
            throw new Error(`Failed to process PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        } else {
          imageCount++;
          setProgress(`Uploading image ${imageCount}...`);

          const file = uploadFile.file;
          const fileExt = file.name.split('.').pop();
          const fileName = `${user.id}/${scan.id}/${Date.now()}-${i}.${fileExt}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('scan-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            throw new Error(`Failed to upload image ${i + 1}: ${uploadError.message}`);
          }

          const { data: urlData } = supabase.storage
            .from('scan-images')
            .getPublicUrl(uploadData.path);

          uploadedUrls.push(urlData.publicUrl);
        }

        const updatedFiles = [...files];
        updatedFiles[i].uploaded = true;
        setFiles(updatedFiles);
      }

      if (uploadedUrls.length === 0) {
        throw new Error('No images were uploaded successfully. Please try again.');
      }

      await supabase
        .from('scans')
        .update({
          image_urls: uploadedUrls,
          status: 'uploaded',
        })
        .eq('id', scan.id);

      console.log(`Updated scan ${scan.id} with ${uploadedUrls.length} images`);

      setUploading(false);
      setProcessing(true);
      setProgress('Processing images with AI...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('You must be logged in to process scans. Please refresh and try again.');
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-scan`;

      console.log('Calling Edge Function with:', {
        scanId: scan.id,
        imageUrlsCount: uploadedUrls.length,
        firstUrl: uploadedUrls[0],
      });

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanId: scan.id,
          imageUrls: uploadedUrls,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication expired. Please refresh the page and try again.');
        }

        let errorMessage = 'Failed to process scan';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      setProgress('Complete! Redirecting...');

      setTimeout(() => {
        window.location.hash = `#/scan-preview?scanId=${scan.id}`;
      }, 500);
    } catch (err) {
      console.error('Error in scan process:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setUploading(false);
      setProcessing(false);
      setProgress('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <a href="#/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-blue-100 p-6 rounded-2xl mb-6">
            <Camera className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI Grade Scanning</h1>
          <p className="text-lg text-gray-600 mb-8">
            Upload photos of your syllabus and gradebook to automatically create courses
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-900">{error}</p>
          </div>
        )}

        {progress && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-900">{progress}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {files.length === 0 ? (
            <>
              <div className="text-center mb-6">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Documents</h2>
                <p className="text-gray-600 mb-6">
                  Upload photos or PDFs of your syllabus and gradebook
                </p>

                <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer">
                  <Camera className="w-5 h-5 mr-2" />
                  Choose Files
                  <input
                    type="file"
                    accept="image/*,application/pdf,.pdf"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading || processing}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How it works:</h3>
                <ol className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="font-bold mr-2 text-blue-600">1.</span>
                    <span>Upload photos or PDFs of your syllabus showing grading categories and weights</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2 text-blue-600">2.</span>
                    <span>Upload photos or PDFs of your gradebook showing assignment scores</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2 text-blue-600">3.</span>
                    <span>AI extracts course info, categories, and assignments automatically</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2 text-blue-600">4.</span>
                    <span>Review extracted data and make any needed corrections</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2 text-blue-600">5.</span>
                    <span>Confirm to create your course with all grades pre-filled</span>
                  </li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Selected Files ({files.length})
                  </h2>
                  <label className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer text-sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Add More
                    <input
                      type="file"
                      accept="image/*,application/pdf,.pdf"
                      multiple
                      onChange={handleFileSelect}
                      disabled={uploading || processing}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="relative group border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {file.isPDF ? (
                        <div className="w-full h-40 bg-red-50 flex flex-col items-center justify-center">
                          <FileText className="w-16 h-16 text-red-600 mb-2" />
                          <p className="text-sm text-red-900 font-medium">{file.pageCount} pages</p>
                        </div>
                      ) : (
                        <img
                          src={file.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      {file.uploaded && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {!uploading && !processing && (
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs truncate">{file.file.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleUploadAndProcess}
                  disabled={uploading || processing}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {uploading || processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {uploading ? 'Uploading...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-2" />
                      Upload and Process
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm text-gray-600">
                  <strong>Tip:</strong> For best results, ensure images are clear and well-lit. Include
                  photos showing grading categories, weights, assignment names, and scores.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
