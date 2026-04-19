import React, { createContext, useContext, useState } from 'react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        message: '',
        onConfirm: null,
        onCancel: null
    });

    const confirm = (message) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                message,
                onConfirm: () => {
                    setConfirmState({ isOpen: false, message: '', onConfirm: null, onCancel: null });
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmState({ isOpen: false, message: '', onConfirm: null, onCancel: null });
                    resolve(false);
                }
            });
        });
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {confirmState.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Please Confirm</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed font-medium">{confirmState.message}</p>
                        <div className="flex gap-3 justify-end pt-2 border-t border-gray-50">
                            <button 
                                onClick={confirmState.onCancel}
                                className="px-5 py-2 font-bold text-gray-500 hover:bg-gray-100 rounded-lg text-xs tracking-wider uppercase transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmState.onConfirm}
                                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-md shadow-orange-100 active:scale-95"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
