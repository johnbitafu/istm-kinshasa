import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, Eye, Copy, Settings, Upload, Calendar, Hash, Type, Mail, Phone, MapPin, FileText, CheckSquare, ToggleLeft, List, Star, Download, Users } from 'lucide-react';
import { getForms, createForm, updateForm, deleteForm, getSubmissions } from '../lib/hybridDatabase';
import type { DynamicForm, FormField, Filiere, FormSubmission } from '../lib/supabase';
import StudentManagement from './StudentManagement';

const DynamicFormBuilder: React.FC = () => {
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'submissions'>('builder');
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  const fieldTypes = [
    { type: 'text', label: 'Texte', icon: Type, description: 'Champ de texte simple' },
    { type: 'email', label: 'Email', icon: Mail, description: 'Adresse email avec validation' },
    { type: 'tel', label: 'Téléphone', icon: Phone, description: 'Numéro de téléphone' },
    { type: 'number', label: 'Nombre', icon: Hash, description: 'Champ numérique' },
    { type: 'date', label: 'Date', icon: Calendar, description: 'Sélecteur de date' },
    { type: 'textarea', label: 'Zone de texte', icon: FileText, description: 'Texte multiligne' },
    { type: 'select', label: 'Liste déroulante', icon: List, description: 'Sélection dans une liste' },
    { type: 'radio', label: 'Boutons radio', icon: CheckSquare, description: 'Choix unique parmi plusieurs options' },
    { type: 'checkbox', label: 'Cases à cocher', icon: CheckSquare, description: 'Choix multiples' },
    { type: 'file', label: 'Téléchargement', icon: Upload, description: 'Upload de fichiers' }
  ];

  useEffect(() => {
    loadForms();
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const submissionsData = await getSubmissions();
      setSubmissions(submissionsData);
      
      // Mettre à jour le nombre de soumissions pour chaque formulaire
      const submissionCounts = submissionsData.reduce((acc, submission) => {
        acc[submission.form_id] = (acc[submission.form_id] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      setForms(prevForms => 
        prevForms.map(form => ({
          ...form,
          submissions_count: submissionCounts[form.id] || 0
        }))
      );
      
    } catch (error) {
      console.error('Erreur lors du chargement des soumissions:', error);
    }
  };

  const loadForms = async () => {
    try {
      setLoading(true);
      const formsData = await getForms();
      setForms(formsData);
      console.log(`📋 ${formsData.length} formulaire(s) chargé(s)`);
    } catch (error) {
      console.error('Erreur lors du chargement des formulaires:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewForm = () => {
    const newForm: DynamicForm = {
      id: '',
      title: 'Nouveau formulaire',
      description: 'Description du formulaire',
      fields: [],
      filieres: [],
      status: 'draft',
      submissions_count: 0,
      created_by: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSelectedForm(newForm);
    setIsEditing(true);
  };

  const duplicateForm = async (formToDuplicate: DynamicForm) => {
    try {
      setSaving(true);
      
      const duplicatedForm: Partial<DynamicForm> = {
        title: `${formToDuplicate.title} (Copie)`,
        description: formToDuplicate.description,
        fields: formToDuplicate.fields.map(field => ({
          ...field,
          id: `${field.id}_copy_${Date.now()}`
        })),
        filieres: formToDuplicate.filieres.map(filiere => ({
          ...filiere,
          id: `${filiere.id}_copy_${Date.now()}`
        })),
        status: 'draft' as const,
        created_by: 'admin'
      };

      console.log('📋 Duplication du formulaire:', formToDuplicate.title);
      const newForm = await createForm(duplicatedForm);
      
      setForms(prev => [...prev, newForm]);
      setSelectedForm(newForm);
      setIsEditing(true);
      await loadSubmissions(); // Recharger pour mettre à jour les compteurs
      
      console.log('✅ Formulaire dupliqué avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la duplication:', error);
      alert('Erreur lors de la duplication du formulaire');
    } finally {
      setSaving(false);
    }
  };

  const saveForm = async () => {
    if (!selectedForm) return;

    try {
      setSaving(true);
      
      if (selectedForm.id) {
        // Mise à jour d'un formulaire existant
        console.log('📝 Mise à jour du formulaire:', selectedForm.title);
        const updatedForm = await updateForm(selectedForm.id, selectedForm);
        setForms(prev => prev.map(f => f.id === selectedForm.id ? updatedForm : f));
        await loadSubmissions(); // Recharger pour mettre à jour les compteurs
        console.log('✅ Formulaire mis à jour avec succès');
      } else {
        // Création d'un nouveau formulaire
        console.log('📝 Création du formulaire:', selectedForm.title);
        const newForm = await createForm(selectedForm);
        setForms(prev => [...prev, newForm]);
        setSelectedForm(newForm);
        await loadSubmissions(); // Recharger pour mettre à jour les compteurs
        console.log('✅ Formulaire créé avec succès');
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert('Erreur lors de la sauvegarde du formulaire');
    } finally {
      setSaving(false);
    }
  };

  const deleteFormHandler = async (formId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce formulaire ?')) {
      return;
    }

    try {
      await deleteForm(formId);
      setForms(prev => prev.filter(f => f.id !== formId));
      if (selectedForm?.id === formId) {
        setSelectedForm(null);
      }
      await loadSubmissions(); // Recharger pour mettre à jour les compteurs
      console.log('✅ Formulaire supprimé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du formulaire');
    }
  };

  const addField = (type: FormField['type']) => {
    if (!selectedForm) return;

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `Nouveau champ ${type}`,
      required: false,
      order: selectedForm.fields.length + 1,
      ...(type === 'select' || type === 'radio' || type === 'checkbox' ? { options: ['Option 1', 'Option 2'] } : {}),
      ...(type === 'file' ? { validation: {} } : {})
    };

    setSelectedForm({
      ...selectedForm,
      fields: [...selectedForm.fields, newField]
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!selectedForm) return;

    setSelectedForm({
      ...selectedForm,
      fields: selectedForm.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    });
  };

  const deleteField = (fieldId: string) => {
    if (!selectedForm) return;

    setSelectedForm({
      ...selectedForm,
      fields: selectedForm.fields.filter(f => f.id !== fieldId)
    });
  };

  const addFiliere = () => {
    if (!selectedForm) return;

    const newFiliere: Filiere = {
      id: `filiere_${Date.now()}`,
      name: 'Nouvelle Filière',
      mentions: ['Mention 1', 'Mention 2']
    };

    setSelectedForm({
      ...selectedForm,
      filieres: [...selectedForm.filieres, newFiliere]
    });
  };

  const updateFiliere = (filiereId: string, updates: Partial<Filiere>) => {
    if (!selectedForm) return;

    setSelectedForm({
      ...selectedForm,
      filieres: selectedForm.filieres.map(f => f.id === filiereId ? { ...f, ...updates } : f)
    });
  };

  const deleteFiliere = (filiereId: string) => {
    if (!selectedForm) return;

    setSelectedForm({
      ...selectedForm,
      filieres: selectedForm.filieres.filter(f => f.id !== filiereId)
    });
  };

  const renderFieldEditor = (field: FormField) => (
    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-gray-900">{field.label}</h4>
        <div className="flex space-x-2">
          <button
            onClick={() => deleteField(field.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(e) => updateField(field.id, { required: e.target.checked })}
            className="mr-2"
          />
          <label className="text-sm text-gray-700">Champ obligatoire</label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
          <input
            type="number"
            value={field.order}
            onChange={(e) => updateField(field.id, { order: parseInt(e.target.value) || 1 })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            min="1"
          />
        </div>

        {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Options (une par ligne)</label>
            <textarea
              value={field.options?.join('\n') || ''}
              onChange={(e) => updateField(field.id, { options: e.target.value.split('\n').filter(o => o.trim()) })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={3}
            />
          </div>
        )}

        {field.description !== undefined && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={field.description || ''}
              onChange={(e) => updateField(field.id, { description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              placeholder="Description optionnelle du champ"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderFiliereEditor = (filiere: Filiere) => (
    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-gray-900">{filiere.name}</h4>
        <button
          onClick={() => deleteFiliere(filiere.id)}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la filière</label>
          <input
            type="text"
            value={filiere.name}
            onChange={(e) => updateFiliere(filiere.id, { name: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mentions (une par ligne)</label>
          <textarea
            value={filiere.mentions.join('\n')}
            onChange={(e) => updateFiliere(filiere.id, { mentions: e.target.value.split('\n').filter(m => m.trim()) })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
            rows={4}
            placeholder="Mention 1&#10;Mention 2&#10;Mention 3"
          />
        </div>
      </div>
    </div>
  );

  const renderFieldPreview = (field: FormField) => {
    const commonProps = {
      className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      placeholder: field.placeholder,
      required: field.required,
      disabled: true
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={4} />;
      
      case 'select':
        return (
          <select {...commonProps}>
            <option value="">Sélectionner...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input type="radio" name={field.id} value={option} className="mr-2" disabled />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center">
                <input type="checkbox" value={option} className="mr-2" disabled />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Zone de téléchargement de fichier</p>
          </div>
        );
      
      default:
        return <input type={field.type} {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('builder')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'builder'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Créateur de Formulaires
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'submissions'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Inscriptions Reçues
        </button>
      </div>

      {activeTab === 'submissions' ? (
        <StudentManagement />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Créateur de Formulaires Dynamiques</h2>
            <button
              onClick={createNewForm}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Formulaire</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste des formulaires */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Mes Formulaires ({forms.length})</h3>
              <div className="space-y-3">
                {forms.map(form => (
                  <div
                    key={form.id}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      selectedForm?.id === form.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div 
                      onClick={() => setSelectedForm(form)}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-gray-900">{form.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          form.status === 'published' ? 'bg-green-100 text-green-800' :
                          form.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {form.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{form.description}</p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{form.fields.length} champs</span>
                        <span>{form.filieres?.length || 0} filières</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                          {form.submissions_count || 0} inscription{(form.submissions_count || 0) > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateForm(form);
                          }}
                          disabled={saving}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="Dupliquer le formulaire"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFormHandler(form.id);
                          }}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Supprimer le formulaire"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {forms.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun formulaire créé</p>
                    <p className="text-sm mt-2">Commencez par créer votre premier formulaire</p>
                  </div>
                )}
              </div>
            </div>

            {/* Éditeur de formulaire */}
            {selectedForm && (
              <div className="lg:col-span-2 space-y-6">
                {/* En-tête du formulaire */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {selectedForm.id ? 'Modifier le Formulaire' : 'Nouveau Formulaire'}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Aperçu</span>
                      </button>
                      <button
                        onClick={saveForm}
                        disabled={saving}
                        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                      </button>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                        <span>{isEditing ? 'Terminer' : 'Modifier'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Titre du formulaire</label>
                      <input
                        type="text"
                        value={selectedForm.title}
                        onChange={(e) => setSelectedForm({ ...selectedForm, title: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                      <select
                        value={selectedForm.status}
                        onChange={(e) => setSelectedForm({ ...selectedForm, status: e.target.value as DynamicForm['status'] })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        disabled={!isEditing}
                      >
                        <option value="draft">Brouillon</option>
                        <option value="published">Publié</option>
                        <option value="archived">Archivé</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={selectedForm.description}
                      onChange={(e) => setSelectedForm({ ...selectedForm, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Types de champs disponibles */}
                {isEditing && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h4 className="text-lg font-semibold mb-4">Ajouter un champ</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {fieldTypes.map(fieldType => {
                        const IconComponent = fieldType.icon;
                        return (
                          <button
                            key={fieldType.type}
                            onClick={() => addField(fieldType.type as FormField['type'])}
                            className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            title={fieldType.description}
                          >
                            <IconComponent className="h-6 w-6 text-gray-600 mb-2" />
                            <span className="text-xs text-center">{fieldType.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Gestion des filières */}
                {isEditing && (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-semibold">Filières et Mentions</h4>
                      <button
                        onClick={addFiliere}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Ajouter Filière</span>
                      </button>
                    </div>
                    
                    {selectedForm.filieres.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Aucune filière configurée</p>
                        <p className="text-xs mt-1">Ajoutez des filières pour permettre aux étudiants de choisir leur parcours</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedForm.filieres.map(filiere => renderFiliereEditor(filiere))}
                      </div>
                    )}
                  </div>
                )}

                {/* Champs du formulaire */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h4 className="text-lg font-semibold mb-4">
                    Champs du formulaire ({selectedForm.fields.length})
                  </h4>
                  
                  {showPreview ? (
                    <div className="space-y-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                        <h3 className="text-xl font-bold mb-2">{selectedForm.title}</h3>
                        <p className="text-gray-600 mb-6">{selectedForm.description}</p>
                        
                        {selectedForm.fields
                          .sort((a, b) => a.order - b.order)
                          .map(field => (
                            <div key={field.id} className="mb-6">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              {field.description && (
                                <p className="text-sm text-gray-500 mb-2">{field.description}</p>
                              )}
                              {renderFieldPreview(field)}
                            </div>
                          ))}
                        
                        {/* Aperçu des filières */}
                        {selectedForm.filieres.length > 0 && (
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Choix de filière <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedForm.filieres.map(filiere => (
                                <div key={filiere.id} className="p-4 border border-gray-300 rounded-lg">
                                  <h5 className="font-medium text-gray-900 mb-2">{filiere.name}</h5>
                                  <div className="text-sm text-gray-600">
                                    {filiere.mentions.length} mention{filiere.mentions.length > 1 ? 's' : ''} disponible{filiere.mentions.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700" disabled>
                          Soumettre le formulaire (Aperçu)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedForm.fields.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Aucun champ ajouté. Commencez par ajouter des champs à votre formulaire.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedForm.fields
                            .sort((a, b) => a.order - b.order)
                            .map(field => (
                              <div key={field.id}>
                                {isEditing ? renderFieldEditor(field) : (
                                  <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <h5 className="font-medium">{field.label}</h5>
                                        <p className="text-sm text-gray-600">Type: {field.type} • Ordre: {field.order}</p>
                                        {field.description && (
                                          <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {field.required && (
                                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                            Obligatoire
                                          </span>
                                        )}
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                          {field.type}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Affichage des filières en mode lecture */}
                      {!isEditing && selectedForm.filieres.length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-lg font-semibold mb-4">Filières configurées ({selectedForm.filieres.length})</h4>
                          <div className="space-y-3">
                            {selectedForm.filieres.map(filiere => (
                              <div key={filiere.id} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                                <h5 className="font-medium text-gray-900 mb-2">{filiere.name}</h5>
                                <div className="flex flex-wrap gap-2">
                                  {filiere.mentions.map((mention, index) => (
                                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                      {mention}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DynamicFormBuilder;