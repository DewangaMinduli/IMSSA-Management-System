import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Save, FileText, User, Award, CheckCircle, Edit3 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RecommendationLetterDraft = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [draftText, setDraftText] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchDraft = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/users/requests/${requestId}/draft`);
                if (res.ok) {
                    const result = await res.json();
                    console.log('Draft data received:', result);
                    if (!result.student || !result.request) {
                        console.error('Missing student or request data in result');
                        return;
                    }
                    setData(result);
                    generateInitialDraft(result);
                } else {
                    console.error('Fetch draft failed with status:', res.status);
                }
            } catch (err) {
                console.error('Error fetching draft data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDraft();
    }, [requestId]);

    const generateInitialDraft = (d) => {
        if (!d || !d.student || !d.request) {
            console.error('Invalid data structure for draft generation', d);
            return;
        }
        const student = d.student;
        const req = d.request;
        const roles = d.roles || [];
        const skills = d.skills || [];
        const tasks = d.tasks || [];
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

        // Logic to build a professional letter
        let roleSummary = roles.length > 0 
            ? roles.slice(0, 3).map(r => r.role_name || r.role || 'Member').join(', ') 
            : 'an active member';
        
        let skillsSummary = skills.length > 0 
            ? skills.slice(0, 4).map(s => s.skill_name || s.name).join(', ') 
            : 'various administrative and technical areas';

        const text = `INDUSTRIAL MANAGEMENT SCIENCE STUDENTS' ASSOCIATION (IMSSA)
University of Kelaniya, Sri Lanka

Date: ${date}

${req.recipient_name ? `${req.recipient_name}` : 'TO WHOM IT MAY CONCERN'},
${req.company_name ? `${req.company_name}` : ''}

RE: RECOMMENDATION FOR ${student.full_name?.toUpperCase() || 'STUDENT'} (${student.student_number || student.student_no || 'N/A'})

I am writing this letter to formally recommend ${student.full_name || 'the student'}, who has been a highly dedicated and active member of the Industrial Management Science Students' Association (IMSSA) at the University of Kelaniya.

During their tenure, ${student.full_name || 'they'} held significant positions, most notably as ${roleSummary}. In these capacities, they demonstrated exceptional commitment, leadership, and organizational skills. Our system records show that they successfully participated in and contributed to several major projects${tasks.length > 0 ? `, including ${tasks.slice(0, 3).map(t => t.event_name || 'various roles').join(', ')}` : ''}.

Based on our verified skills inventory, ${student.full_name || 'they'} acquired and demonstrated proficiency in ${skillsSummary}. Their involvement in the organization has been marked by a high level of professionalism, teamwork, and the ability to handle complex tasks within tight deadlines.

Specifically regarding their request for ${req.purpose || 'professional development'}, I believe their background in IMSSA has prepared them well for the challenges of this opportunity. 

I highly recommend ${student.full_name || 'the student'} for any position or academic pursuit they choose to undertake. Their contribution to IMSSA has been invaluable, and I am confident that they will bring the same level of excellence to your organization.

Yours sincerely,

_________________________
${req.lecturer_name || 'Academic Staff Member'}
Senior Lecturer,
Department of Industrial Management,
University of Kelaniya
Industrial Management Science Students' Association (IMSSA)`;

        setDraftText(text);
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([draftText], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `Recommendation_${data.student.full_name.replace(' ', '_')}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    if (loading) return <div className="p-20 text-center text-gray-400">Loading recommendation draft...</div>;
    if (!data) return <div className="p-20 text-center text-red-500">Error loading data.</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-8 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Recommendation Letter Draft</h1>
                        <p className="text-xs text-gray-500">For {data.student.full_name}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isEditing ? 'bg-green-600 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        {isEditing ? <CheckCircle size={16} /> : <Edit3 size={16} />}
                        {isEditing ? 'Finish Editing' : 'Edit Draft'}
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md"
                    >
                        <Download size={16} /> Download .txt
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Panel: Student Profile Summary */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-2xl">
                                {data.student.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{data.student.full_name}</h2>
                                <p className="text-sm text-gray-500">{data.student.student_number}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Purpose of Request</label>
                                <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg mt-1 border border-gray-100">
                                    {data.request.purpose}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Academic Year</label>
                                    <p className="text-sm font-bold text-gray-700">{data.student.academic_year || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Level</label>
                                    <p className="text-sm font-bold text-gray-700">{data.student.academic_level || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="text-orange-500" size={16} /> Key Involvement
                        </h3>
                        <div className="space-y-3">
                            {data.roles.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No formal roles recorded.</p>
                            ) : (
                                data.roles.map((r, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div className="w-1 h-auto bg-orange-200 rounded-full" />
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">{r.role_name || r.role}</p>
                                            <p className="text-[10px] text-gray-500">{r.event_name || r.term_name || 'General'}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="text-teal-500" size={16} /> Verified Skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {data.skills.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No skills verified.</p>
                            ) : (
                                data.skills.map((s, i) => (
                                    <div key={i} className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-1 rounded-md border border-teal-100">
                                        {s.skill_name} ({s.points} pts)
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel: Letter Editor */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden flex flex-col min-h-[800px]">
                        <div className="bg-slate-800 px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="text-slate-400" size={16} />
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Document Editor</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                                <div className="w-2 h-2 rounded-full bg-green-400" />
                            </div>
                        </div>

                        {isEditing ? (
                            <textarea 
                                className="flex-1 p-12 text-gray-700 font-serif text-base leading-relaxed outline-none resize-none bg-slate-50 border-0"
                                value={draftText}
                                onChange={(e) => setDraftText(e.target.value)}
                            />
                        ) : (
                            <div className="flex-1 p-12 font-serif text-base text-gray-800 leading-relaxed whitespace-pre-wrap select-text selection:bg-teal-100">
                                {draftText}
                            </div>
                        )}
                        
                        <div className="bg-gray-50 p-6 border-t border-gray-100 text-center">
                            <p className="text-[10px] text-gray-400 font-medium">Auto-generated by IMSSA Management System • Based on verified organizational metrics</p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button 
                            onClick={() => window.print()}
                            className="text-sm font-semibold text-gray-500 px-6 py-2 hover:text-gray-900"
                        >
                            Print to PDF
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RecommendationLetterDraft;
