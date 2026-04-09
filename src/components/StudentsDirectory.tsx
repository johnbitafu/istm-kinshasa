import React, { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, RefreshCw, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Student {
  id: string;
  matricule: string;
  full_name: string;
  email: string;
  phone: string;
  birth_date: string | null;
  gender: string;
  birth_place: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

const StudentsDirectory: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents((data as Student[]) || []);
    } catch (err) {
      console.error('Erreur chargement étudiants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleStatusUpdate = async (studentId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    setUpdatingId(studentId);
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(prev =>
        prev.map(s => s.id === studentId ? { ...s, status: newStatus } : s)
      );

      if (selectedStudent?.id === studentId) {
        setSelectedStudent(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          s.full_name.toLowerCase().includes(term) ||
          s.matricule.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term) ||
          s.phone.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [students, statusFilter, searchTerm]);

  const counts = useMemo(() => ({
    all: students.length,
    pending: students.filter(s => s.status === 'pending').length,
    approved: students.filter(s => s.status === 'approved').length,
    rejected: students.filter(s => s.status === 'rejected').length,
  }), [students]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      default: return 'En attente';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3.5 w-3.5 mr-1" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 mr-1" />;
      default: return <Clock className="h-3.5 w-3.5 mr-1" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Répertoire des Étudiants</h2>
          <p className="text-gray-500 mt-1 text-sm">
            {filtered.length} étudiant{filtered.length > 1 ? 's' : ''} sur {students.length} au total
          </p>
        </div>
        <button
          onClick={loadStudents}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.all, color: 'border-blue-500', icon: <User className="h-7 w-7 text-blue-500" /> },
          { label: 'En attente', value: counts.pending, color: 'border-yellow-500', icon: <Clock className="h-7 w-7 text-yellow-500" /> },
          { label: 'Approuvés', value: counts.approved, color: 'border-green-500', icon: <CheckCircle className="h-7 w-7 text-green-500" /> },
          { label: 'Rejetés', value: counts.rejected, color: 'border-red-500', icon: <XCircle className="h-7 w-7 text-red-500" /> },
        ].map(card => (
          <div key={card.label} className={`bg-white p-4 rounded-xl shadow-sm border-l-4 ${card.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous ({counts.all})</option>
            <option value="pending">En attente ({counts.pending})</option>
            <option value="approved">Approuvés ({counts.approved})</option>
            <option value="rejected">Rejetés ({counts.rejected})</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-lg">Aucun étudiant trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Étudiant</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Naissance</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{student.full_name}</div>
                        <div className="text-xs text-gray-400 mt-0.5 font-mono">{student.matricule}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center text-xs text-gray-600">
                          <Mail className="h-3 w-3 mr-1.5 text-gray-400" />
                          <span className="truncate max-w-[160px]">{student.email || '—'}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="h-3 w-3 mr-1.5 text-gray-400" />
                          {student.phone || '—'}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-gray-600">
                        <div>{student.birth_date ? new Date(student.birth_date).toLocaleDateString('fr-FR') : '—'}</div>
                        <div className="text-gray-400">{student.gender}</div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(student.status)}`}>
                        {getStatusIcon(student.status)}
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1.5">
                        {student.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(student.id, 'approved')}
                            disabled={updatingId === student.id}
                            title="Approuver"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 disabled:opacity-40 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {student.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(student.id, 'rejected')}
                            disabled={updatingId === student.id}
                            title="Rejeter"
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {student.status !== 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(student.id, 'pending')}
                            disabled={updatingId === student.id}
                            title="Remettre en attente"
                            className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 disabled:opacity-40 transition-colors"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedStudent(student)}
                          title="Voir les détails"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <User className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">{selectedStudent.full_name}</h3>
                  <p className="text-white/70 text-xs font-mono">{selectedStudent.matricule}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-white/80 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Statut actuel</span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(selectedStudent.status)}`}>
                  {getStatusIcon(selectedStudent.status)}
                  {getStatusLabel(selectedStudent.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <div className="flex items-center space-x-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-800 truncate">{selectedStudent.email || '—'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                  <div className="flex items-center space-x-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span className="text-gray-800">{selectedStudent.phone || '—'}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Date de naissance</p>
                  <span className="text-gray-800">
                    {selectedStudent.birth_date ? new Date(selectedStudent.birth_date).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Sexe</p>
                  <span className="text-gray-800">{selectedStudent.gender || '—'}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Lieu de naissance</p>
                  <span className="text-gray-800">{selectedStudent.birth_place || '—'}</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Adresse</p>
                  <div className="flex items-start space-x-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span className="text-gray-800">{selectedStudent.address || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                {selectedStudent.status !== 'approved' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedStudent.id, 'approved')}
                    disabled={updatingId === selectedStudent.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approuver</span>
                  </button>
                )}
                {selectedStudent.status !== 'rejected' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedStudent.id, 'rejected')}
                    disabled={updatingId === selectedStudent.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Rejeter</span>
                  </button>
                )}
                {selectedStudent.status !== 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedStudent.id, 'pending')}
                    disabled={updatingId === selectedStudent.id}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    <span>En attente</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsDirectory;
