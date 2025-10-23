import React, { useState } from 'react';
import { Plus, Trash2, Edit, Save, Eye, Copy, Settings, Upload, Calendar, Hash, Type, Mail, Phone, MapPin, FileText, CheckSquare, ToggleLeft, List, Star } from 'lucide-react';

interface FormField {
  id: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'datetime-local' | 'time' | 'url' | 'password' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'range' | 'color' | 'rating' | 'signature';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  description?: string;
  defaultValue?: string;
  multiple?: boolean;
  accept?: string; // for file inputs
}

interface Form {
  id: string;
  title: string;
  description: string;
  fields: FormField[];
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  submissions: number;
}

const FormBuilder: React.FC = () => {
  const [forms, setForms] = useState<Form[]>([
    {
      id: '1',
      title: 'Formulaire d\'inscription ISTM',
      description: 'Formulaire principal pour l\'inscription des nouveaux étudiants',
      fields: [
        { id: '1', type: 'text', label: 'Nom complet', required: true },
        { id: '2', type: 'email', label: 'Adresse email', required: true },
        { id: '3', type: 'select', label: 'Programme', required: true, options: ['Soins Infirmiers', 'Laboratoire Médical', 'Imagerie Médicale'] }
      ],
      status: 'published',
      createdAt: '2025-01-15',
      submissions: 45
    }
  ]);

  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  const fieldTypes = [
    { type: 'text', label: 'Texte', icon: Type, description: 'Champ de texte simple' },
    { type: 'email', label: 'Email', icon: Mail, description: 'Adresse email avec validation' },
    { type: 'tel', label: 'Téléphone', icon: Phone, description: 'Numéro de téléphone' },
    { type: 'number', label: 'Nombre', icon: Hash, description: 'Champ numérique' },
    { type: 'date', label: 'Date', icon: Calendar, description: 'Sélecteur de date' },
    { type: 'datetime-local', label: 'Date et Heure', icon: Calendar, description: 'Date et heure locale' },
    { type: 'time', label: 'Heure', icon: Calendar, description: 'Sélecteur d\'heure' },
    { type: 'url', label: 'URL', icon: MapPin, description: 'Lien web avec validation' },
    { type: 'password', label: 'Mot de passe', icon: Settings, description: 'Champ mot de passe masqué' },
    { type: 'textarea', label: 'Zone de texte', icon: FileText, description: 'Texte multiligne' },
    { type: 'select', label: 'Liste déroulante', icon: List, description: 'Sélection dans une liste' },
    { type: 'radio', label: 'Boutons radio', icon: CheckSquare, description: 'Choix unique parmi plusieurs options' },
    { type: 'checkbox', label: 'Cases à cocher', icon: CheckSquare, description: 'Choix multiples' },
    { type: 'file', label: 'Téléchargement', icon: Upload, description: 'Upload de fichiers' },
    { type: 'range', label: 'Curseur', icon: ToggleLeft, description: 'Sélection par curseur' },
    { type: 'color', label: 'Couleur', icon: Settings, description: 'Sélecteur de couleur' },
    { type: 'rating', label: 'Évaluation', icon: Star, description: 'Système d\'étoiles' },
    { type: 'signature', label: 'Signature', icon: Edit, description: 'Zone de signature électronique' }
  ];

  const createNewForm = () => {
    const newForm: Form = {
      id: Date.now().toString(),
      title: 'Nouveau formulaire',
      description: 'Description du formulaire',
      fields: [],
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      submissions: 0
    };
    setForms([...forms, newForm]);
    setSelectedForm(newForm);
    setIsEditing(true);
  };

  const addField = (type: FormField['type']) => {
    if (!selectedForm) return;

    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: `Nouveau champ ${type}`,
      required: false,
      ...(type === 'select' || type === 'radio' || type === 'checkbox' ? { options: ['Option 1', 'Option 2'] } : {}),
      ...(type === 'file' ? { accept: '*/*', multiple: false } : {}),
      ...(type === 'range' ? { validation: { min: 0, max: 100 } } : {})
    };

    const updatedForm = {
      ...selectedForm,
      fields: [...selectedForm.fields, newField]
    };

    setSelectedForm(updatedForm);
    setForms(forms.map(f => f.id === selectedForm.id ? updatedForm : f));
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!selectedForm) return;

    const updatedForm = {
      ...selectedForm,
      fields: selectedForm.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f)
    };

    setSelectedForm(updatedForm);
    setForms(forms.map(f => f.id === selectedForm.id ? updatedForm : f));
  };

  const deleteField = (fieldId: string) => {
    if (!selectedForm) return;

    const updatedForm = {
      ...selectedForm,
      fields: selectedForm.fields.filter(f => f.id !== fieldId)
    };

    setSelectedForm(updatedForm);
    setForms(forms.map(f => f.id === selectedForm.id ? updatedForm : f));
  };

  const renderFieldEditor = (field: FormField) => (
    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold text-gray-900">{field.label}</h4>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditingField(field)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4" />
          </button>
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

        {field.type === 'file' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Types acceptés</label>
              <input
                type="text"
                value={field.accept || '*/*'}
                onChange={(e) => updateField(field.id, { accept: e.target.value })}
                placeholder="ex: .pdf,.jpg,.png"
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={field.multiple || false}
                onChange={(e) => updateField(field.id, { multiple: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm text-gray-700">Fichiers multiples</label>
            </div>
          </>
        )}

        {(field.type === 'number' || field.type === 'range') && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur min</label>
              <input
                type="number"
                value={field.validation?.min || ''}
                onChange={(e) => updateField(field.id, { 
                  validation: { ...field.validation, min: parseInt(e.target.value) || undefined }
                })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valeur max</label>
              <input
                type="number"
                value={field.validation?.max || ''}
                onChange={(e) => updateField(field.id, { 
                  validation: { ...field.validation, max: parseInt(e.target.value) || undefined }
                })}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderFieldPreview = (field: FormField) => {
    const commonProps = {
      className: "w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      placeholder: field.placeholder,
      required: field.required
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
                <input type="radio" name={field.id} value={option} className="mr-2" />
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
                <input type="checkbox" value={option} className="mr-2" />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Cliquez pour télécharger ou glissez vos fichiers ici</p>
            <input type="file" accept={field.accept} multiple={field.multiple} className="hidden" />
          </div>
        );
      
      case 'range':
        return (
          <div>
            <input 
              type="range" 
              min={field.validation?.min || 0} 
              max={field.validation?.max || 100}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{field.validation?.min || 0}</span>
              <span>{field.validation?.max || 100}</span>
            </div>
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className="h-6 w-6 text-gray-300 hover:text-yellow-400 cursor-pointer" />
            ))}
          </div>
        );
      
      case 'signature':
        return (
          <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 text-center">
            <Edit className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Zone de signature électronique</p>
          </div>
        );
      
      default:
        return <input type={field.type} {...commonProps} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Créateur de Formulaires</h2>
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
          <h3 className="text-lg font-semibold mb-4">Mes Formulaires</h3>
          <div className="space-y-3">
            {forms.map(form => (
              <div
                key={form.id}
                onClick={() => setSelectedForm(form)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedForm?.id === form.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
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
                <p className="text-sm text-gray-600 mb-2">{form.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{form.fields.length} champs</span>
                  <span>{form.submissions} soumissions</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Éditeur de formulaire */}
        {selectedForm && (
          <div className="lg:col-span-2 space-y-6">
            {/* En-tête du formulaire */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Éditeur de Formulaire</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Aperçu</span>
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
                    onChange={(e) => {
                      const updatedForm = { ...selectedForm, title: e.target.value };
                      setSelectedForm(updatedForm);
                      setForms(forms.map(f => f.id === selectedForm.id ? updatedForm : f));
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={selectedForm.status}
                    onChange={(e) => {
                      const updatedForm = { ...selectedForm, status: e.target.value as Form['status'] };
                      setSelectedForm(updatedForm);
                      setForms(forms.map(f => f.id === selectedForm.id ? updatedForm : f));
                    }}
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
                  onChange={(e) => {
                    const updatedForm = { ...selectedForm, description: e.target.value };
                    setSelectedForm(updatedForm);
                    setForms(forms.map(f => f.id === selectedForm.id ? updatedForm : f));
                  }}
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
                    
                    {selectedForm.fields.map(field => (
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
                    
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                      Soumettre le formulaire
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
                    selectedForm.fields.map(field => (
                      <div key={field.id}>
                        {isEditing ? renderFieldEditor(field) : (
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <h5 className="font-medium">{field.label}</h5>
                                <p className="text-sm text-gray-600">Type: {field.type}</p>
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
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormBuilder;