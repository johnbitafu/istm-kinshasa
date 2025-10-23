import React, { useState, useEffect, useMemo } from 'react';
import { Download, Eye, Trash2, Search, Filter, CheckCircle, XCircle, Clock, User, Calendar, Mail, Phone, MapPin, GraduationCap, FileDown, RefreshCw, BarChart3 } from 'lucide-react';
import { getSubmissions, deleteSubmission, updateSubmissionStatus, getForms } from '../lib/hybridDatabase';
import { generateStudentPDF, generateMatricule, getFieldValue } from '../utils/pdfGenerator';
import { generateDashboardPDF } from '../utils/dashboardPdfGenerator';
import type { FormSubmission, DynamicForm } from '../lib/supabase';

// Interface pour les données pré-traitées
interface ProcessedSubmission extends FormSubmission {
  fullName: string;
  email: string;
  phone: string;
  searchText: string;
  formTitle: string;
  displayFiliere: string;
}

const StudentManagement: React.FC = () => {
  const [submissions, setSubmissions] = useState<ProcessedSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<ProcessedSubmission | null>(null);
  
  // États pour la recherche avec debounce
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // États pour les filtres
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [filiereFilter, setFiliereFilter] = useState('all');
  const [formFilter, setFormFilter] = useState('all');
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  // États pour les options de filtrage
  const [availableFilieres, setAvailableFilieres] = useState<string[]>([]);
  const [availableForms, setAvailableForms] = useState<{id: string, title: string}[]>([]);
  
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [generatingDashboard, setGeneratingDashboard] = useState(false);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Réinitialiser à la page 1 lors de la recherche
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Réinitialiser la page lors du changement de filtres
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, startDateFilter, endDateFilter, filiereFilter, formFilter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      console.log('🔍 Chargement des soumissions et formulaires...');
      
      // Charger les soumissions et formulaires en parallèle
      const [submissionsData, formsData] = await Promise.all([
        getSubmissions(),
        getForms()
      ]);
      
      console.log(`📋 ${submissionsData.length} soumission(s) et ${formsData.length} formulaire(s) chargé(s)`);
      
      // Pré-traiter les données
      const processedSubmissions: ProcessedSubmission[] = submissionsData.map(submission => {
        // Extraire les informations avec getFieldValue
        const nom = getFieldValue(submission.submission_data, ['Nom', 'nom']);
        const postnom = getFieldValue(submission.submission_data, ['Post-Nom', 'post-nom', 'Post-nom']);
        const prenom = getFieldValue(submission.submission_data, ['Prénom', 'prenom', 'prénom']);
        const email = getFieldValue(submission.submission_data, ['E-mail', 'email', 'Email']);
        const phone = getFieldValue(submission.submission_data, ['Téléphone', 'telephone', 'phone']);
        
        // Construire le nom complet
        const fullName = `${nom} ${postnom} ${prenom}`.trim();
        
        // Trouver le titre du formulaire
        const form = formsData.find(f => f.id === submission.form_id);
        const formTitle = form?.title || 'Formulaire inconnu';
        
        // Construire l'affichage de la filière
        let displayFiliere = submission.filiere_name || 'Non spécifiée';
        if (submission.mention) {
          displayFiliere += ` - ${submission.mention}`;
        }
        
        // Construire le texte de recherche (tout en minuscules pour la recherche)
        const searchText = [
          submission.matricule,
          nom, postnom, prenom,
          email, phone,
          submission.filiere_name || '',
          submission.mention || '',
          formTitle
        ].join(' ').toLowerCase();
        
        return {
          ...submission,
          fullName,
          email,
          phone,
          searchText,
          formTitle,
          displayFiliere
        };
      });
      
      setSubmissions(processedSubmissions);
      
      // Extraire les filières et formulaires uniques pour les filtres
      const uniqueFilieres = [...new Set(processedSubmissions
        .map(s => s.filiere_name)
        .filter(f => f && f.trim() !== '')
      )].sort();
      
      const uniqueForms = formsData.map(f => ({ id: f.id, title: f.title }));
      
      setAvailableFilieres(uniqueFilieres);
      setAvailableForms(uniqueForms);
      
      console.log(`✅ ${processedSubmissions.length} soumission(s) pré-traitée(s)`);
      console.log(`📊 ${uniqueFilieres.length} filière(s) unique(s) trouvée(s)`);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des soumissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  // Filtrage optimisé avec useMemo
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      // Filtre par statut
      if (statusFilter !== 'all' && submission.status !== statusFilter) {
        return false;
      }
      
      // Filtre par recherche (utilise le texte pré-calculé)
      if (debouncedSearchTerm && !submission.searchText.includes(debouncedSearchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtre par date de début
      if (startDateFilter) {
        const submissionDate = new Date(submission.submitted_at).toISOString().split('T')[0];
        if (submissionDate < startDateFilter) {
          return false;
        }
      }
      
      // Filtre par date de fin
      if (endDateFilter) {
        const submissionDate = new Date(submission.submitted_at).toISOString().split('T')[0];
        if (submissionDate > endDateFilter) {
          return false;
        }
      }
      
      // Filtre par filière
      if (filiereFilter !== 'all' && submission.filiere_name !== filiereFilter) {
        return false;
      }
      
      // Filtre par formulaire
      if (formFilter !== 'all' && submission.form_id !== formFilter) {
        return false;
      }
      
      return true;
    });
  }, [submissions, statusFilter, debouncedSearchTerm, startDateFilter, endDateFilter, filiereFilter, formFilter]);

  // Calculs de pagination
  const totalItems = filteredSubmissions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);

  const handleStatusUpdate = async (submissionId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    if (!confirm(`Êtes-vous sûr de vouloir ${newStatus === 'approved' ? 'approuver' : newStatus === 'rejected' ? 'rejeter' : 'remettre en attente'} cette inscription ?`)) {
      return;
    }

    try {
      setUpdatingStatus(submissionId);
      await updateSubmissionStatus(submissionId, newStatus);
      
      // Mettre à jour l'état local immédiatement
      setSubmissions(prev => 
        prev.map(submission => 
          submission.id === submissionId 
            ? { ...submission, status: newStatus, updated_at: new Date().toISOString() }
            : submission
        )
      );
      
      console.log(`✅ Statut mis à jour vers ${newStatus}`);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette inscription ?')) {
      return;
    }

    try {
      await deleteSubmission(submissionId);
      setSubmissions(prev => prev.filter(s => s.id !== submissionId));
      if (selectedSubmission?.id === submissionId) {
        setSelectedSubmission(null);
      }
      console.log('✅ Soumission supprimée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la soumission');
    }
  };

  const handleGeneratePDF = async (submission: ProcessedSubmission) => {
    try {
      console.log('📄 Génération du PDF pour:', submission.matricule);
      
      const studentData = {
        matricule: submission.matricule,
        dateInscription: new Date(submission.submitted_at).toLocaleDateString('fr-FR'),
        formTitle: submission.formTitle,
        formData: submission.submission_data,
        filiere: submission.filiere_name,
        mention: submission.mention,
        filiere2: submission.filiere_name_2,
        mention2: submission.mention_2
      };

      await generateStudentPDF(studentData);
      console.log('✅ PDF généré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la génération du PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      console.log('📊 Exportation des données en cours...');

      // Utiliser les données filtrées ou toutes les données
      const dataToExport = filteredSubmissions.length > 0 ? filteredSubmissions : submissions;

      if (dataToExport.length === 0) {
        alert('Aucune donnée à exporter');
        return;
      }

      // En-têtes CSV
      const headers = [
        'Matricule',
        'Nom Complet',
        'Email',
        'Téléphone',
        'Date de Naissance',
        'Sexe',
        'Lieu de Naissance',
        'Adresse',
        'École',
        'Province École',
        'Section Humanités',
        'Année Obtention',
        'Pourcentage',
        'Filière 1',
        'Mention 1',
        'Filière 2',
        'Mention 2',
        'Statut',
        'Date Inscription',
        'Formulaire'
      ];

      // Construire les lignes CSV
      const csvRows = [
        headers.join(','), // En-tête
        ...dataToExport.map(submission => {
          const data = submission.submission_data;
          return [
            `"${submission.matricule}"`,
            `"${submission.fullName}"`,
            `"${submission.email}"`,
            `"${submission.phone}"`,
            `"${getFieldValue(data, ['Date de naissance', 'date-naissance', 'date_naissance'])}"`,
            `"${getFieldValue(data, ['Sexe', 'sexe'])}"`,
            `"${getFieldValue(data, ['Lieu de naissance', 'lieu-naissance', 'lieu_naissance'])}"`,
            `"${getFieldValue(data, ['Adresse Kinshasa', 'adresse-kinshasa', 'adresse_kinshasa', 'adresse'])}"`,
            `"${getFieldValue(data, ['Nom de l\'Ecole', 'nom-ecole', 'nom_ecole', 'ecole'])}"`,
            `"${getFieldValue(data, ['Province de l\'Ecole', 'province-ecole', 'province_ecole', 'province'])}"`,
            `"${getFieldValue(data, ['Section suivie aux humanités', 'section-humanites', 'section_humanites', 'section'])}"`,
            `"${getFieldValue(data, ['Année d\'obtention', 'annee-obtention', 'annee_obtention', 'annee'])}"`,
            `"${getFieldValue(data, ['Pourcentage', 'pourcentage'])}"`,
            `"${submission.filiere_name || ''}"`,
            `"${submission.mention || ''}"`,
            `"${submission.filiere_name_2 || ''}"`,
            `"${submission.mention_2 || ''}"`,
            `"${submission.status}"`,
            `"${new Date(submission.submitted_at).toLocaleDateString('fr-FR')}"`,
            `"${submission.formTitle}"`
          ].join(',');
        })
      ];

      // Créer et télécharger le fichier CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM pour Excel
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `inscriptions_istm_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`✅ Export CSV réussi: ${dataToExport.length} inscription(s) exportée(s)`);

    } catch (error) {
      console.error('❌ Erreur lors de l\'exportation:', error);
      alert('Erreur lors de l\'exportation des données');
    } finally {
      setExporting(false);
    }
  };

  const handleGenerateDashboard = async () => {
    try {
      setGeneratingDashboard(true);
      console.log('📊 Génération du tableau de bord PDF...');

      if (submissions.length === 0) {
        alert('Aucune donnée disponible pour générer le tableau de bord');
        return;
      }

      await generateDashboardPDF({ submissions });
      console.log('✅ Tableau de bord PDF généré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la génération du tableau de bord:', error);
      alert('Erreur lors de la génération du tableau de bord');
    } finally {
      setGeneratingDashboard(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
    setFiliereFilter('all');
    setFormFilter('all');
    setCurrentPage(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'pending': return Clock;
      default: return Clock;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approuvé';
      case 'rejected': return 'Rejeté';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  const statusCounts = useMemo(() => ({
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length
  }), [submissions]);

  // Génération des numéros de page pour la pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestion des Inscriptions</h2>
          <p className="text-gray-600 mt-1">
            {totalItems} inscription{totalItems > 1 ? 's' : ''} trouvée{totalItems > 1 ? 's' : ''} sur {submissions.length} au total
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateDashboard}
            disabled={generatingDashboard || submissions.length === 0}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg transition-all duration-200 transform hover:scale-105"
            title="Générer un PDF avec statistiques complètes des inscriptions"
          >
            <BarChart3 className={`h-4 w-4 ${generatingDashboard ? 'animate-pulse' : ''}`} />
            <span className="font-semibold">{generatingDashboard ? 'Génération...' : 'Tableau de Bord PDF'}</span>
          </button>

          <button
            onClick={handleExportData}
            disabled={exporting || totalItems === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <FileDown className={`h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
            <span>{exporting ? 'Export...' : 'Exporter CSV'}</span>
          </button>

          <button
            onClick={loadSubmissions}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.all}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En attente</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approuvées</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejetées</p>
              <p className="text-2xl font-bold text-gray-900">{statusCounts.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Filtres et Recherche</h3>
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Effacer tous les filtres
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Recherche */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nom, matricule, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous ({statusCounts.all})</option>
              <option value="pending">En attente ({statusCounts.pending})</option>
              <option value="approved">Approuvées ({statusCounts.approved})</option>
              <option value="rejected">Rejetées ({statusCounts.rejected})</option>
            </select>
          </div>
          
          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filière */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
            <select
              value={filiereFilter}
              onChange={(e) => setFiliereFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toutes les filières</option>
              {availableFilieres.map(filiere => (
                <option key={filiere} value={filiere}>{filiere}</option>
              ))}
            </select>
          </div>
          
          {/* Formulaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Formulaire</label>
            <select
              value={formFilter}
              onChange={(e) => setFormFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les formulaires</option>
              {availableForms.map(form => (
                <option key={form.id} value={form.id}>{form.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des soumissions avec pagination */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : currentSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">
              {submissions.length === 0 ? 'Aucune inscription reçue' : 'Aucune inscription trouvée'}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {submissions.length === 0 
                ? 'Les inscriptions apparaîtront ici une fois soumises' 
                : 'Essayez de modifier vos critères de recherche ou filtres'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filière
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formulaire
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentSubmissions.map((submission) => {
                    const StatusIcon = getStatusIcon(submission.status);
                    return (
                      <tr key={submission.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {submission.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              Matricule: {submission.matricule}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1 text-gray-400" />
                              <span className="text-xs">{submission.email || 'N/A'}</span>
                            </div>
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1 text-gray-400" />
                              <span className="text-xs">{submission.phone || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{submission.displayFiliere}</div>
                            {submission.filiere_name_2 && (
                              <div className="text-xs text-gray-400 mt-1">
                                2ème choix: {submission.filiere_name_2}
                                {submission.mention_2 && ` - ${submission.mention_2}`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="max-w-32 truncate" title={submission.formTitle}>
                            {submission.formTitle}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {getStatusLabel(submission.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {/* Boutons de changement de statut */}
                            {submission.status !== 'approved' && (
                              <button
                                onClick={() => handleStatusUpdate(submission.id, 'approved')}
                                disabled={updatingStatus === submission.id}
                                className="text-green-600 hover:text-green-900 p-1 rounded disabled:opacity-50"
                                title="Approuver"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            )}
                            
                            {submission.status !== 'rejected' && (
                              <button
                                onClick={() => handleStatusUpdate(submission.id, 'rejected')}
                                disabled={updatingStatus === submission.id}
                                className="text-red-600 hover:text-red-900 p-1 rounded disabled:opacity-50"
                                title="Rejeter"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                            
                            {submission.status !== 'pending' && (
                              <button
                                onClick={() => handleStatusUpdate(submission.id, 'pending')}
                                disabled={updatingStatus === submission.id}
                                className="text-yellow-600 hover:text-yellow-900 p-1 rounded disabled:opacity-50"
                                title="Remettre en attente"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => setSelectedSubmission(submission)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleGeneratePDF(submission)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded"
                              title="Générer PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteSubmission(submission.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Affichage de <span className="font-medium">{indexOfFirstItem + 1}</span> à{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, totalItems)}</span> sur{' '}
                      <span className="font-medium">{totalItems}</span> résultats
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Précédent
                      </button>
                      
                      {getPageNumbers().map(number => (
                        <button
                          key={number}
                          onClick={() => setCurrentPage(number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            number === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {number}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Suivant
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de détails */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Détails de l'inscription</h2>
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* En-tête avec statut */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedSubmission.fullName}</h3>
                      <p className="text-gray-600">Matricule: {selectedSubmission.matricule}</p>
                      <p className="text-sm text-gray-500">Formulaire: {selectedSubmission.formTitle}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedSubmission.status)}`}>
                        {React.createElement(getStatusIcon(selectedSubmission.status), { className: "h-4 w-4 mr-1" })}
                        {getStatusLabel(selectedSubmission.status)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions rapides */}
                  <div className="flex space-x-2">
                    {selectedSubmission.status !== 'approved' && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedSubmission.id, 'approved');
                          setSelectedSubmission({ ...selectedSubmission, status: 'approved' });
                        }}
                        disabled={updatingStatus === selectedSubmission.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approuver</span>
                      </button>
                    )}
                    
                    {selectedSubmission.status !== 'rejected' && (
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedSubmission.id, 'rejected');
                          setSelectedSubmission({ ...selectedSubmission, status: 'rejected' });
                        }}
                        disabled={updatingStatus === selectedSubmission.id}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Rejeter</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleGeneratePDF(selectedSubmission)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Générer PDF</span>
                    </button>
                  </div>
                </div>

                {/* Informations détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Informations personnelles</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(selectedSubmission.submission_data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium text-gray-600">{key}:</span>
                          <span className="text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-3">Choix de filières</h4>
                    <div className="space-y-3">
                      {selectedSubmission.filiere_name && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <h5 className="font-medium text-blue-900">1er Choix</h5>
                          <p className="text-blue-800">{selectedSubmission.filiere_name}</p>
                          {selectedSubmission.mention && (
                            <p className="text-sm text-blue-600">Mention: {selectedSubmission.mention}</p>
                          )}
                        </div>
                      )}
                      
                      {selectedSubmission.filiere_name_2 && (
                        <div className="p-3 bg-green-50 rounded-lg">
                          <h5 className="font-medium text-green-900">2ème Choix</h5>
                          <p className="text-green-800">{selectedSubmission.filiere_name_2}</p>
                          {selectedSubmission.mention_2 && (
                            <p className="text-sm text-green-600">Mention: {selectedSubmission.mention_2}</p>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-900 mb-2">Informations de soumission</h5>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Soumis le: {new Date(selectedSubmission.submitted_at).toLocaleString('fr-FR')}</p>
                        <p>Dernière mise à jour: {new Date(selectedSubmission.updated_at).toLocaleString('fr-FR')}</p>
                        <p>ID: {selectedSubmission.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setSelectedSubmission(null)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;