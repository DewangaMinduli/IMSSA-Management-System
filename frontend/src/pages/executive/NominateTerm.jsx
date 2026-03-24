import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NominateTerm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State for key positions
    const [board, setBoard] = useState({
        president: { name: '', id: '' },
        vp: { name: '', id: '' },
        secretary: { name: '', id: '' },
        juniorTreasurer: { name: '', id: '' },
        mediaDirector: { name: '', id: '' }
    });

    const handleChange = (position, field, value) => {
        setBoard(prev => ({
            ...prev,
            [position]: { ...prev[position], [field]: value }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        console.log("Assigning:", board);

        setTimeout(() => {
            setLoading(false);
            alert("Assignments Submitted Successfully!");
            navigate('/exec/dashboard');
        }, 1500);
    };

    const handleEndTerm = () => {
        if (window.confirm("Are you sure you want to END the current term? This action cannot be undone.")) {
            alert("Term Ended. Logging out.");
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* STANDARD HEADER */}
            <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/exec/dashboard')} className="mr-2 text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs">IM</div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-[10px] text-gray-500">University of Kelaniya</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">Executive Board</div>
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-xs font-bold">U</span>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 mt-10">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 min-h-[600px] flex flex-col justify-between">

                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-10">Assign Next Term (2025/26)</h2>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">

                            {/* President */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">President - Name</label>
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.president.name}
                                    onChange={e => handleChange('president', 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">President - Student ID</label>
                                <input
                                    type="text"
                                    placeholder="E.g., IM/2021/045"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.president.id}
                                    onChange={e => handleChange('president', 'id', e.target.value)}
                                />
                            </div>

                            {/* Vice President */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Vice President - Name</label>
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.vp.name}
                                    onChange={e => handleChange('vp', 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Vice President - Student ID</label>
                                <input
                                    type="text"
                                    placeholder="E.g., IM/2021/045"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.vp.id}
                                    onChange={e => handleChange('vp', 'id', e.target.value)}
                                />
                            </div>

                            {/* Secretary */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Secretary - Name</label>
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.secretary.name}
                                    onChange={e => handleChange('secretary', 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Secretary - Student ID</label>
                                <input
                                    type="text"
                                    placeholder="E.g., IM/2021/045"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.secretary.id}
                                    onChange={e => handleChange('secretary', 'id', e.target.value)}
                                />
                            </div>

                            {/* Junior Treasurer */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Junior Treasurer - Name</label>
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.juniorTreasurer.name}
                                    onChange={e => handleChange('juniorTreasurer', 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Junior Treasurer - Student ID</label>
                                <input
                                    type="text"
                                    placeholder="E.g., IM/2021/045"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.juniorTreasurer.id}
                                    onChange={e => handleChange('juniorTreasurer', 'id', e.target.value)}
                                />
                            </div>

                            {/* Media Director */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Media Director - Name</label>
                                <input
                                    type="text"
                                    placeholder="Full name"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.mediaDirector.name}
                                    onChange={e => handleChange('mediaDirector', 'name', e.target.value)}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-600 uppercase">Media Director - Student ID</label>
                                <input
                                    type="text"
                                    placeholder="E.g., IM/2021/045"
                                    className="w-full border-b border-gray-200 py-2 text-sm outline-none focus:border-teal-500 placeholder-gray-300"
                                    value={board.mediaDirector.id}
                                    onChange={e => handleChange('mediaDirector', 'id', e.target.value)}
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="md:col-span-2 flex justify-end gap-3 mt-8">
                                <button type="button" className="bg-gray-400 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-500">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-blue-200 text-blue-800 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-300">
                                    Add Assignments
                                </button>
                                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-md">
                                    Submit Assignments
                                </button>
                            </div>

                        </form>
                    </div>

                    <div className="flex justify-center mt-12 pb-6">
                        <button
                            onClick={handleEndTerm}
                            className="bg-emerald-400 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg text-sm font-bold shadow-lg transition-colors tracking-wide"
                        >
                            END TERM
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NominateTerm;
