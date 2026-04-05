import React from 'react';
import { X, Clock, Calendar } from 'lucide-react';

const VolunteerTaskModal = ({ task, isOpen, onClose, onApply }) => {
    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden animate-fade-in-up">

                {/* Header (Optional, minimalist as per screenshot) */}
                <div className="p-6 pb-2">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{task.title}</h3>
                </div>

                {/* Body */}
                <div className="p-6 pt-2">
                    <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                        {task.desc}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Clock size={16} />
                        <span className="font-medium">Due: {task.due}</span>
                    </div>

                    <div className="mb-8">
                        <span className={`px-3 py-1 rounded text-xs font-bold ${task.color || 'bg-teal-100 text-teal-800'}`}>
                            Event: {task.event}
                        </span>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 font-bold text-sm px-4 py-2"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm(`Are you sure you want to volunteer for "${task.title}"?`)) {
                                    onApply(task);
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2 rounded-lg transition-colors shadow-sm"
                        >
                            Volunteer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VolunteerTaskModal;
