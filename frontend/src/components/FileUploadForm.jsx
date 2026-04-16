import React, { useState } from 'react';
import { Link, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const FileUploadForm = ({ taskId, assignmentId, proofType, onSubmitSuccess, disabled = false }) => {
    const [submissionText, setSubmissionText] = useState('');
    const [driveLink, setDriveLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const validateLink = (link) => {
        if (!link) return true;
        try {
            new URL(link);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validate based on proof type
        if (proofType === 'File_Upload' && !driveLink.trim()) {
            setError('This task requires a Google Drive link');
            return;
        }

        if (proofType === 'Description_Only' && !submissionText.trim()) {
            setError('This task requires a text description');
            return;
        }

        if ((proofType === 'File_Upload' || proofType === 'None') && !submissionText.trim() && !driveLink.trim()) {
            setError('Please provide either a text description or a Google Drive link');
            return;
        }

        if (!validateLink(driveLink)) {
            setError('Please provide a valid URL (e.g., https://example.com)');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(
                `http://localhost:5000/api/events/tasks/${taskId}/assignments/${assignmentId}/submit-with-link`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        submission_text: submissionText.trim() || null,
                        drive_link: driveLink.trim() || null
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Submission failed');
                return;
            }

            setSuccess('Task submitted successfully! Waiting for approval.');
            setSubmissionText('');
            setDriveLink('');

            // Emit event to refresh EventDetails page
            window.dispatchEvent(new CustomEvent('taskSubmitted', { 
                detail: { taskId, assignmentId } 
            }));

            // Call parent callback
            if (onSubmitSuccess) {
                onSubmitSuccess(data);
            }

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(''), 5000);
        } catch (err) {
            console.error('Submission error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Work</h3>

                {/* Text Description Section */}
                {proofType !== 'File_Upload' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description / Notes
                            {proofType === 'Description_Only' && <span className="text-red-500"> *Required</span>}
                        </label>
                        <textarea
                            value={submissionText}
                            onChange={(e) => {
                                setSubmissionText(e.target.value);
                                setError('');
                            }}
                            placeholder="Describe what you've completed, include any notes or links..."
                            rows={4}
                            disabled={isSubmitting || disabled}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>
                )}

                {/* Submission Link Section */}
                {proofType !== 'Description_Only' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Submission Link
                            {proofType === 'File_Upload' && <span className="text-red-500"> *Required</span>}
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Provide a link to your completed work (Drive, GitHub, Dropbox, etc). Ensure the link is accessible to the committee.
                        </p>
                        
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Link size={20} className="text-gray-400" />
                            </div>
                            <input
                                type="url"
                                value={driveLink}
                                onChange={(e) => {
                                    setDriveLink(e.target.value);
                                    setError('');
                                }}
                                placeholder="https://..."
                                disabled={isSubmitting || disabled}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                            {driveLink && (
                                <button
                                    type="button"
                                    onClick={() => setDriveLink('')}
                                    disabled={isSubmitting}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                        
                        {driveLink && validateLink(driveLink) && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                                <FileText size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm text-blue-700">
                                        <strong>Valid link detected</strong> - Ensure the destination is accessible to reviewers.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700">{success}</p>
                </div>
            )}

            
            {/* Submit Button */}
            <div className="flex gap-3">
                <button
                    type="submit"
                    disabled={isSubmitting || disabled}
                    className="flex-1 px-6 py-3 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Submitting...' : '✓ Submit Task'}
                </button>
            </div>
        </form>
    );
};

export default FileUploadForm;
