import React, { useState } from 'react';
import { ArrowLeft, Calendar, Edit, Clock, Users, Plus, X, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OCEventDetails = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Overview');
    const [editingId, setEditingId] = useState(null);

    // MOCK DATA STATES
    const [tasks, setTasks] = useState([
        { id: 1, task: "Finalize Speakers", assignedTo: "Dineth Perera", deadline: "July 25, 2025", responsible: "Kavindi Silva", status: "Completed" },
        { id: 2, task: "Design Promotional Materials", assignedTo: "Rachelle Perera", deadline: "July 10, 2025", responsible: "Kavindi Silva", status: "Completed" },
        { id: 3, task: "Registration Portal Setup", assignedTo: "Nipun Jayasekara", deadline: "July 25, 2025", responsible: "Kavindi Silva", status: "In Progress" },
        { id: 4, task: "Social Media Campaign", assignedTo: "Ishara Fernando", deadline: "July 30, 2025", responsible: "Kavindi Silva", status: "In Progress" },
        { id: 5, task: "Venue Booking for Finals", assignedTo: "Dineth Perera", deadline: "August 15, 2025", responsible: "Kavindi Silva", status: "Not Started" },
    ]);

    const [ocMembers, setOcMembers] = useState([
        { id: 1, name: "Sajith Liyanagamage", studentId: "IM/2021/045", role: "Main Coordinator" },
        { id: 2, name: "Rochelle Jayasuriya", studentId: "IM/2021/023", role: "Marketing Coordinator" },
        { id: 3, name: "Malith Jayasuriya", studentId: "IM/2021/078", role: "Finance Coordinator" },
        { id: 4, name: "Ishara Fernando", studentId: "IM/2021/102", role: "Media Coordinator" },
        { id: 5, name: "Malith Jayasinghe", studentId: "IM/2021/001", role: "Volunteer" },
    ]);



    const eventData = {
        name: "hackX 10.0",
        date: "July 19 - November 11, 2025",
        description: "A Global Impact driven 24-hour startup challenge organized by the Industrial Management Science Students' Association aimed at creating visible social impact.",
        goals: [
            "Engage 300+ talented university students / IT Leans",
            "Pitch 50+ startup solutions",
            "Provide mentorship opportunities with tech professionals",
            "Idea box for IT solutions for Social problems"
        ]
    };

    const timeline = [
        { id: 1, title: "Ideasprint", date: "July 19, 2025", color: "bg-teal-500" },
        { id: 2, title: "Registrations Open", date: "August 6, 2025", color: "bg-teal-500" },
        { id: 3, title: "Proposal Submission", date: "August 27, 2025", color: "bg-teal-500" },
        { id: 4, title: "IdeaX Semi Finals", date: "October 11, 2025", color: "bg-teal-500" },
        { id: 5, title: "designX Workshop 1", date: "October 18, 2025", color: "bg-teal-500" },
        { id: 6, title: "designX Workshop 2", date: "October 23, 2025", color: "bg-teal-500" },
        { id: 7, title: "designX Workshop 3", date: "October 30, 2025", color: "bg-teal-500" },
        { id: 8, title: "Grand Finals", date: "November 11, 2025", color: "bg-teal-500" },
    ];

    // TAB COMPONENTS
    const Overview = () => (
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Event Description</h3>
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">{eventData.description}</p>

            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Event Goals</h3>
                    <ul className="space-y-4">
                        {eventData.goals.map((goal, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xs">{idx + 1}</span>
                                <span className="text-gray-600 text-sm">{goal}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="w-[400px] h-[250px] bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center text-gray-400">
                    <img src="/placeholder-event.jpg" alt="Event" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    <span className="text-sm">Event Image Placeholder</span>
                </div>
            </div>
        </div>
    );

    const Tasks = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Task Summary</h3>
                <button onClick={() => setShowTaskModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={16} /> Add Task
                </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Task</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Deadline</th>
                            <th className="px-6 py-4">Responsible OC</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{task.task}</td>
                                <td className="px-6 py-4 text-gray-500">{task.assignedTo}</td>
                                <td className="px-6 py-4 text-gray-500">{task.deadline}</td>
                                <td className="px-6 py-4 text-gray-500">{task.responsible}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'Completed' ? 'bg-green-100 text-green-600' :
                                        task.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {task.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex items-center gap-3">
                                    {task.status !== 'Completed' && (
                                        <button onClick={() => handleApproveTask(task.id)} className="text-green-600 font-medium text-xs hover:underline flex items-center gap-1">
                                            <CheckCircle size={12} /> Approve
                                        </button>
                                    )}
                                    <button className="text-blue-600 font-medium text-xs hover:underline flex items-center gap-1">
                                        <Edit size={12} /> Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const OC = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">OC Members</h3>
                <button onClick={() => setShowOcModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={16} /> Add OC
                </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Student ID</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {ocMembers.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-bold text-gray-900">{member.name}</td>
                                <td className="px-6 py-4 text-gray-500">{member.studentId}</td>
                                <td className="px-6 py-4 text-gray-500">{member.role}</td>
                                <td className="px-6 py-4 flex gap-3">
                                    <button className="text-blue-600 font-medium text-xs hover:underline flex items-center gap-1"><Edit size={12} /> Edit</button>
                                    <button className="text-red-600 font-medium text-xs hover:underline flex items-center gap-1"><Trash2 size={12} /> Remove</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    // PARTNERSHIPS STATE
    const [partnerships, setPartnerships] = useState([]); // Blank table starts empty
    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [newPartner, setNewPartner] = useState({
        company_name: '',
        contact_person: '',
        email: '',
        package_type: 'Monetary',
        amount_promised: '',
        status: 'Pending'
    });

    const handleAddPartner = (e) => {
        e.preventDefault();
        if (editingId) {
            setPartnerships(prev => prev.map(p => p.partnership_id === editingId ? { ...p, ...newPartner } : p));
            setEditingId(null);
        } else {
            setPartnerships([...partnerships, { ...newPartner, partnership_id: Date.now() }]);
        }
        setShowPartnerModal(false);
        setNewPartner({ company_name: '', contact_person: '', email: '', package_type: 'Monetary', amount_promised: '', status: 'Pending' });
    };

    const handleEditPartner = (partner) => {
        setNewPartner(partner);
        setEditingId(partner.partnership_id);
        setShowPartnerModal(true);
    };

    const Partnerships = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Request Letters / Partnerships</h3>
                <button onClick={() => { setEditingId(null); setNewPartner({ company_name: '', contact_person: '', email: '', package_type: 'Monetary', amount_promised: '', status: 'Pending' }); setShowPartnerModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                    <Plus size={16} /> Add Partner
                </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden min-h-[200px] overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Company Name</th>
                            <th className="px-6 py-4">Contact Person</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Package</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {partnerships.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-400 italic">
                                    No partnerships added yet.
                                </td>
                            </tr>
                        ) : (
                            partnerships.map(p => (
                                <tr key={p.partnership_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-bold text-gray-900">{p.company_name}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.contact_person}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.email}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.package_type}</td>
                                    <td className="px-6 py-4 text-gray-500">{p.amount_promised}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Signed' ? 'bg-green-100 text-green-700' :
                                            p.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                            }`}>{p.status}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleEditPartner(p)} className="text-blue-600 font-medium text-xs hover:underline">Edit</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* PARTNER MODAL IN PLACE */}
            {showPartnerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
                    <div className="bg-white p-6 rounded-xl w-[500px] shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">{editingId ? 'Edit Partner' : 'Add Partner'}</h3>
                            <button onClick={() => setShowPartnerModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddPartner} className="space-y-4">
                            <input required placeholder="Company Name" className="w-full border p-2 rounded text-sm" value={newPartner.company_name} onChange={e => setNewPartner({ ...newPartner, company_name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input required placeholder="Contact Person" className="w-full border p-2 rounded text-sm" value={newPartner.contact_person} onChange={e => setNewPartner({ ...newPartner, contact_person: e.target.value })} />
                                <input required type="email" placeholder="Email" className="w-full border p-2 rounded text-sm" value={newPartner.email} onChange={e => setNewPartner({ ...newPartner, email: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <select className="w-full border p-2 rounded text-sm" value={newPartner.package_type} onChange={e => setNewPartner({ ...newPartner, package_type: e.target.value })}>
                                    <option>Monetary</option>
                                    <option>Beverage</option>
                                    <option>Gift Partner</option>
                                    <option>Other</option>
                                </select>
                                <input placeholder="Amount Promised (if any)" className="w-full border p-2 rounded text-sm" type="number" value={newPartner.amount_promised} onChange={e => setNewPartner({ ...newPartner, amount_promised: e.target.value })} />
                            </div>
                            <select className="w-full border p-2 rounded text-sm" value={newPartner.status} onChange={e => setNewPartner({ ...newPartner, status: e.target.value })}>
                                <option>Pending</option>
                                <option>Contacted</option>
                                <option>In Progress</option>
                                <option>Signed</option>
                                <option>Rejected</option>
                            </select>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm">{editingId ? 'Update Partner' : 'Add Partner'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );

    const Timeline = () => (
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6">Event Timeline</h3>
            <div className="relative border-l-2 border-gray-100 ml-4 space-y-8">
                {timeline.map((item, index) => (
                    <div key={item.id} className="ml-8 relative">
                        <span className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${item.color}`}>
                            {index + 1}
                        </span>
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{item.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Clock size={12} /> {item.date}
                                </div>
                            </div>
                            <button className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-3 py-1 rounded text-xs font-medium flex items-center gap-1">
                                <Edit size={12} /> Edit
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="pb-10 bg-gray-50 min-h-screen font-sans relative">
            {/* HEADER */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 leading-tight">Industrial Management Science Students' Association</h1>
                        <p className="text-xs text-gray-500">University of Kelaniya</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="bg-gray-100 px-3 py-1 rounded-md text-xs font-semibold text-gray-700">Organizing Committee</button>
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">SM</div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 mt-8">
                {/* Back Button & Title */}
                <div className="flex items-center gap-4 mb-6">
                    <ArrowLeft className="cursor-pointer text-gray-600 hover:text-gray-900" size={20} onClick={() => navigate(-1)} />
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-gray-900">hackX 10.0</h2>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar size={14} /> July 19 - November 11, 2025
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="border-b border-gray-200 mb-8">
                    <div className="flex gap-8">
                        {['Overview', 'Tasks', 'OC', 'Timeline', 'Partnerships'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab
                                    ? 'text-blue-600 border-blue-600'
                                    : 'text-gray-500 border-transparent hover:text-gray-800'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[400px]">
                    {activeTab === 'Overview' && <Overview />}
                    {activeTab === 'Tasks' && <Tasks />}
                    {activeTab === 'OC' && <OC />}
                    {activeTab === 'Timeline' && <Timeline />}
                    {activeTab === 'Partnerships' && <Partnerships />}
                </div>
            </div>

            {/* MODALS */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-xl w-[400px] shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Add New Task</h3>
                            <button onClick={() => setShowTaskModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <input required placeholder="Task Title" className="w-full border p-2 rounded text-sm" value={newTask.task} onChange={e => setNewTask({ ...newTask, task: e.target.value })} />
                            <input required placeholder="Assigned To" className="w-full border p-2 rounded text-sm" value={newTask.assignedTo} onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })} />
                            <input required placeholder="Deadline" className="w-full border p-2 rounded text-sm" value={newTask.deadline} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} />
                            <input required placeholder="Responsible OC" className="w-full border p-2 rounded text-sm" value={newTask.responsible} onChange={e => setNewTask({ ...newTask, responsible: e.target.value })} />
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm">Add Task</button>
                        </form>
                    </div>
                </div>
            )}

            {showOcModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-xl w-[400px] shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Add OC Member</h3>
                            <button onClick={() => setShowOcModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <form onSubmit={handleAddOC} className="space-y-4">
                            <input required placeholder="Name" className="w-full border p-2 rounded text-sm" value={newOC.name} onChange={e => setNewOC({ ...newOC, name: e.target.value })} />
                            <input required placeholder="Student ID" className="w-full border p-2 rounded text-sm" value={newOC.studentId} onChange={e => setNewOC({ ...newOC, studentId: e.target.value })} />
                            <input required placeholder="Role" className="w-full border p-2 rounded text-sm" value={newOC.role} onChange={e => setNewOC({ ...newOC, role: e.target.value })} />
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm">Add Member</button>
                        </form>
                    </div>
                </div>
            )}



        </div>
    );
};

export default OCEventDetails;
