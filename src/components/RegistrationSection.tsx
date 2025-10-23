import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, FileText, Download, Check, ChevronDown, Upload, X } from 'lucide-react';
import { generateStudentPDF, generateMatricule } from '../utils/pdfGenerator';
import { getForms, createSubmission } from '../lib/hybridDatabase';
import type { DynamicForm, FormField, Filiere } from '../lib/supabase';

interface FormData {
  [key: string]: string | File | null;
  selectedFiliere: string;
  selectedMention: string;
  selectedFiliere2: string;
  selectedMention2: string;
}

const RegistrationSection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [studentMatricule, setStudentMatricule] = useState<string>('');
  const [availableForms, setAvailableForms] = useState<DynamicForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [showFormSelection, setShowFormSelection] = useState(true);
  const [availableMentions, setAvailableMentions] = useState<string[]>([]);
  const [totalSteps, setTotalSteps] = useState(3);
  const [showMentionModal, setShowMentionModal] = useState(false);
  const [selectedFiliereForModal, setSelectedFiliereForModal] = useState<Filiere | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [showConditionsModal, setShowConditionsModal] = useState(true); // Nouvel état pour le modal des conditions
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    selectedFiliere: '',
    selectedMention: '',
    selectedFiliere2: '',
    selectedMention2: ''
  });

  // Charger les formulaires dynamiques disponibles
  useEffect(() => {
    loadPublishedForms();
  }, []);

  const loadPublishedForms = async () => {
    try {
      setLoading(true);
      
      console.log('📋 Chargement des formulaires publiés...');
      
      // Charger tous les formulaires depuis Firebase
      const allForms = await getForms();
      
      // Filtrer seulement les formulaires publiés
      const publishedForms = allForms.filter(form => form.status === 'published');
      
      console.log(`✅ ${publishedForms.length} formulaire(s) publié(s) trouvé(s)`);
      
      setAvailableForms(publishedForms);
      
      // Ne pas sélectionner automatiquement un formulaire
      // L'utilisateur devra choisir manuellement
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des formulaires:', error);
      setAvailableForms([]);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le formulaire sélectionné
  useEffect(() => {
    if (selectedFormId) {
      const form = availableForms.find(f => f.id === selectedFormId);
      if (form) {
        setSelectedForm(form);
        setShowFormSelection(false);
        
        // Calculer le nombre d'étapes basé sur les champs
        const fieldCount = form.fields.length;
        const fieldsPerStep = 6;
        const formSteps = Math.ceil(fieldCount / fieldsPerStep);
        const totalSteps = formSteps + (form.filieres.length > 0 ? 1 : 0) + 1; // +1 pour confirmation
        setTotalSteps(totalSteps);
        
        // Réinitialiser les données du formulaire
        const initialData: FormData = {
          selectedFiliere: '',
          selectedMention: '',
          selectedFiliere2: '',
          selectedMention2: ''
        };
        
        form.fields.forEach(field => {
          initialData[field.id] = field.type === 'file' ? null : '';
        });
        
        setFormData(initialData);
        setAvailableMentions([]);
      }
    }
  }, [selectedFormId, availableForms]);

  // Mettre à jour les mentions quand la filière change
  useEffect(() => {
    if (formData.selectedFiliere && selectedForm) {
      const selectedFiliere = selectedForm.filieres.find(f => f.id === formData.selectedFiliere);
      if (selectedFiliere) {
        setAvailableMentions(selectedFiliere.mentions || []);
        setFormData(prev => ({ ...prev, selectedMention: '', selectedMention2: '' }));
      }
    } else {
      setAvailableMentions([]);
    }
  }, [formData.selectedFiliere, selectedForm]);

  const handleInputChange = (fieldId: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateCurrentStep = () => {
    if (!selectedForm) return false;
    
    // Réinitialiser les erreurs
    setFieldErrors({});

    const fieldsPerStep = 6;
    const formSteps = Math.ceil(selectedForm.fields.length / fieldsPerStep);
    const isFilieresStep = currentStep === formSteps + 1 && selectedForm.filieres.length > 0;
    const isConfirmationStep = currentStep === totalSteps;

    // Validation pour l'étape des filières
    if (isFilieresStep) {
      const errors: { [key: string]: string } = {};
      
      if (!formData.selectedFiliere) {
        errors['selectedFiliere'] = 'Veuillez sélectionner votre premier choix de filière.';
      }
      
      if (!formData.selectedFiliere2) {
        errors['selectedFiliere2'] = 'Veuillez sélectionner votre deuxième choix de filière.';
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return false;
      }
      
      return true;
    }

    // Fonction de validation par type de champ
    const validateFieldValue = (field: FormField, value: string | File | null): string | null => {
      // Si le champ est vide et non obligatoire, pas de validation
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        return field.required ? 'Ce champ est obligatoire' : null;
      }

      // Validation pour les fichiers
      if (field.type === 'file' && value instanceof File) {
        return null; // Les fichiers sont validés séparément
      }

      // Pour les autres types, on travaille avec des chaînes
      const stringValue = typeof value === 'string' ? value.trim() : '';
      
      if (!stringValue && field.required) {
        return 'Ce champ est obligatoire';
      }

      if (!stringValue) return null; // Champ vide et non obligatoire

      // Validation par type de champ
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(stringValue)) {
            return 'Veuillez saisir une adresse email valide (ex: nom@exemple.com)';
          }
          break;

        case 'tel':
          const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
          if (!phoneRegex.test(stringValue)) {
            return 'Veuillez saisir un numéro de téléphone valide (ex: +243123456789)';
          }
          break;

        case 'number':
          const numValue = parseFloat(stringValue);
          if (isNaN(numValue)) {
            return 'Veuillez saisir un nombre valide';
          }
          if (field.validation?.min !== undefined && numValue < field.validation.min) {
            return `La valeur doit être supérieure ou égale à ${field.validation.min}`;
          }
          if (field.validation?.max !== undefined && numValue > field.validation.max) {
            return `La valeur doit être inférieure ou égale à ${field.validation.max}`;
          }
          break;

        case 'date':
          const dateValue = new Date(stringValue);
          if (isNaN(dateValue.getTime())) {
            return 'Veuillez saisir une date valide';
          }
          // Vérifier que la date n'est pas dans le futur pour les dates de naissance
          if (field.label.toLowerCase().includes('naissance') && dateValue > new Date()) {
            return 'La date de naissance ne peut pas être dans le futur';
          }
          break;

        case 'url':
          try {
            new URL(stringValue);
          } catch {
            return 'Veuillez saisir une URL valide (ex: https://exemple.com)';
          }
          break;

        case 'text':
          if (field.validation?.minLength && stringValue.length < field.validation.minLength) {
            return `Ce champ doit contenir au moins ${field.validation.minLength} caractères`;
          }
          if (field.validation?.maxLength && stringValue.length > field.validation.maxLength) {
            return `Ce champ ne peut pas dépasser ${field.validation.maxLength} caractères`;
          }
          if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(stringValue)) {
              return 'Le format saisi n\'est pas valide';
            }
          }
          break;
      }

      return null; // Validation réussie
    };
    // Validation pour l'étape de confirmation
    if (isConfirmationStep) {
      // Vérifier tous les champs avec validation complète
      const errors: { [key: string]: string } = {};
      
      selectedForm.fields.forEach(field => {
        const value = formData[field.id];
        const error = validateFieldValue(field, value);
        if (error) {
          errors[field.id] = error;
        }
      });

      // Vérifier la filière si nécessaire
      if (selectedForm.filieres.length > 0) {
        if (!formData.selectedFiliere) {
          errors['selectedFiliere'] = 'Veuillez sélectionner votre premier choix de filière';
        }
        if (!formData.selectedFiliere2) {
          errors['selectedFiliere2'] = 'Veuillez sélectionner votre deuxième choix de filière';
        }
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return false;
      }

      return true;
    }

    // Validation pour les étapes de champs du formulaire
    const startIndex = (currentStep - 1) * fieldsPerStep;
    const endIndex = startIndex + fieldsPerStep;
    const currentFields = selectedForm.fields
      .sort((a, b) => a.order - b.order)
      .slice(startIndex, endIndex);

    // Valider les champs de l'étape actuelle
    const errors: { [key: string]: string } = {};
    
    currentFields.forEach(field => {
      const value = formData[field.id];
      const error = validateFieldValue(field, value);
      if (error) {
        errors[field.id] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!selectedForm) return;

    // Vérifier si déjà soumis
    if (hasSubmitted) {
      alert('Vous avez déjà soumis votre inscription. Une seule soumission par personne est autorisée.');
      return;
    }

    // Validation finale avant soumission
    if (!validateCurrentStep()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionSuccess(false);
    
    console.log('📝 Début de soumission du formulaire:', selectedForm.title);
    
    // Générer le matricule
    const matricule = generateMatricule();
    console.log('🎫 Matricule généré:', matricule);
    
    // Vérifier les doublons potentiels (email + nom)
    const duplicateKey = `${formData['email'] || ''}-${formData['nom'] || ''}-${formData['prenom'] || ''}`.toLowerCase();
    const existingSubmissions = localStorage.getItem('istm_submissions') || '[]';
    const submissions = JSON.parse(existingSubmissions);
    
    const isDuplicate = submissions.some((sub: any) => {
      const subKey = `${sub.email || ''}-${sub.nom || ''}-${sub.prenom || ''}`.toLowerCase();
      return subKey === duplicateKey && subKey.length > 10; // Éviter les clés vides
    });
    
    if (isDuplicate) {
      setIsSubmitting(false);
      alert('Une inscription avec ces informations (email + nom + prénom) existe déjà. Les doublons ne sont pas autorisés.');
      return;
    }
    
    // Construire l'objet StudentInscription
    const submissionData: any = {
      matricule,
      date: new Date().toLocaleDateString('fr-FR'),
      formTitle: selectedForm.title,
      email: formData['email'] || '',
      nom: formData['nom'] || '',
      prenom: formData['prenom'] || ''
    };
    
    // Mapper les champs du formulaire dynamique
    selectedForm.fields.forEach(field => {
      const value = formData[field.id];
      if (field.type === 'file' && value instanceof File) {
        submissionData[field.label] = value.name;
      } else {
        submissionData[field.label] = value || '';
      }
    });
    
    // Ajouter filière et mention
    if (selectedForm.filieres.length > 0 && formData.selectedFiliere) {
      const selectedFiliere = selectedForm.filieres.find(f => f.id === formData.selectedFiliere);
      submissionData['Filière'] = selectedFiliere?.name || '';
      submissionData['Mention'] = formData.selectedMention || '';
      
      // Ajouter deuxième choix si sélectionné
      if (formData.selectedFiliere2) {
        const selectedFiliere2 = selectedForm.filieres.find(f => f.id === formData.selectedFiliere2);
        submissionData['Filière 2ème choix'] = selectedFiliere2?.name || '';
        submissionData['Mention 2ème choix'] = formData.selectedMention2 || '';
      }
    }
    
    console.log('📋 Données à sauvegarder:', submissionData);
    
    try {
      // Sauvegarder l'inscription dans Firebase
      console.log('💾 Sauvegarde de l\'inscription dans Firebase...');
      
      const submissionToSave = {
        form_id: selectedForm.id,
        matricule: matricule,
        submission_data: submissionData,
        filiere_id: formData.selectedFiliere || null,
        filiere_name: selectedForm.filieres.find(f => f.id === formData.selectedFiliere)?.name || null,
        mention: formData.selectedMention || null,
        filiere_id_2: formData.selectedFiliere2 || null,
        filiere_name_2: selectedForm.filieres.find(f => f.id === formData.selectedFiliere2)?.name || null,
        mention_2: formData.selectedMention2 || null,
        status: 'pending' as const
      };
      
      await createSubmission(submissionToSave);
      
      // Sauvegarder localement pour éviter les doublons
      submissions.push({
        matricule,
        email: formData['email'] || '',
        nom: formData['nom'] || '',
        prenom: formData['prenom'] || '',
        timestamp: Date.now()
      });
      localStorage.setItem('istm_submissions', JSON.stringify(submissions));
      
      console.log('✅ Inscription sauvegardée avec succès dans Firebase !');
      
      // Marquer comme réussi
      setStudentMatricule(matricule);
      setSubmissionSuccess(true);
      setHasSubmitted(true);
      
      // Attendre 2 secondes avant d'afficher le succès
      setTimeout(() => {
        setIsSubmitted(true);
      }, 2000);

    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      
      // En cas d'erreur, ne pas marquer comme soumis
      setIsSubmitting(false);
      alert('Erreur lors de la soumission. Veuillez réessayer.');
      return;
    }
    
    setIsSubmitting(false);
  };

const generatePDF = () => {
  if (!studentMatricule || !selectedForm) return;
  
  // Récupérer les données de soumission depuis le state
  const studentRawData: any = {
    matricule: studentMatricule,
    date: new Date().toLocaleDateString('fr-FR'),
    formTitle: selectedForm.title
  };

  // Ajouter les données du formulaire
  selectedForm.fields.forEach(field => {
    const value = formData[field.id];
    studentRawData[field.label] = field.type === 'file' && value instanceof File ? value.name : (value || '');
  });

  // Récupérer les noms des filières et mentions depuis les objets filières
  const filiere1 = selectedForm.filieres.find(f => f.id === formData.selectedFiliere);
  const filiere2 = selectedForm.filieres.find(f => f.id === formData.selectedFiliere2);
  
  // Récupérer la province de l'école depuis les données du formulaire
  // Rechercher dans tous les champs du formulaire pour trouver la province
  let provinceEcole = '';
  
  // Essayer plusieurs clés possibles pour trouver la province
  const provinceKeys = [
    'Province de l\'Ecole', 'Province de l\'école', 'Province', 'province',
    'province-ecole', 'province_ecole', 'ProvinceEcole', 'provinceEcole'
  ];
  
  for (const key of provinceKeys) {
    if (formData[key]) {
      provinceEcole = String(formData[key]);
      break;
    }
  }
  
  // Si on n'a pas trouvé avec les clés directes, chercher dans les données du formulaire
  if (!provinceEcole) {
    for (const field of selectedForm.fields) {
      if (field.label.toLowerCase().includes('province') || 
          field.label.toLowerCase().includes('école') || 
          field.label.toLowerCase().includes('ecole')) {
        const value = formData[field.id];
        if (value) {
          provinceEcole = String(value);
          break;
        }
      }
    }
  }

  if (studentRawData) {
    // Préparer les données pour le PDF basé sur le formulaire
    const formDataForPDF: { [key: string]: string } = {};
    
    // Mapper tous les champs du formulaire
    selectedForm.fields.forEach(field => {
      const value = studentRawData[field.label];
      if (value !== undefined && value !== null) {
        formDataForPDF[field.label] = String(value);
      }
    });
    
    // Ajouter manuellement la province si elle a été trouvée
    if (provinceEcole) {
      formDataForPDF['Province de l\'école'] = provinceEcole;
    }
    
    // Préparer les données pour le générateur de PDF
    const studentData = {
      matricule: studentRawData.matricule || '',
      dateInscription: studentRawData.date || new Date().toLocaleDateString('fr-FR'),
      formTitle: selectedForm.title,
      formData: formDataForPDF,
      filiere: filiere1?.name || '',
      mention: formData.selectedMention || '',
      filiere2: filiere2?.name || '',
      mention2: formData.selectedMention2 || '',
      provinceEcole: provinceEcole // Ajout de la province de l'école
    };
    
    console.log('📊 Données envoyées au PDF:', studentData);
    
    // Appeler le générateur de PDF avec les données complètes
    generateStudentPDF(studentData);
  }
};
  
  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  const generateCSV = () => {
    if (!selectedForm) return;

    // Générer l'en-tête CSV
    const headers = ['date'];
    selectedForm.fields
      .sort((a, b) => a.order - b.order)
      .forEach(field => headers.push(`"${field.label}"`));
    
    if (selectedForm.filieres.length > 0) {
      headers.push('"Filière"', '"Mention"');
    }
    
    const csvHeader = headers.join(';');
    
    // Générer les données CSV
    const data = [new Date().toLocaleDateString('fr-FR')];
    selectedForm.fields
      .sort((a, b) => a.order - b.order)
      .forEach(field => {
        const value = formData[field.id];
        if (field.type === 'file' && value instanceof File) {
          data.push(`"${value.name}"`);
        } else {
          data.push(`"${value || ''}"`);
        }
      });
    
    if (selectedForm.filieres.length > 0) {
      const selectedFiliere = selectedForm.filieres.find(f => f.id === formData.selectedFiliere);
      data.push(`"${selectedFiliere?.name || ''}"`);
      data.push(`"${formData.selectedMention}"`);
    }
    
    const csvData = data.join(';');
    const csvContent = csvHeader + '\n' + csvData;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inscription_${selectedForm.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFieldInput = (field: FormField) => {
    const commonProps = {
      className: `w-full p-3 border rounded-lg focus:ring-2 focus:border-transparent ${
        fieldErrors[field.id] 
          ? 'border-red-300 focus:ring-red-500 bg-red-50' 
          : 'border-gray-300 focus:ring-blue-500'
      }`,
      placeholder: field.placeholder,
      required: field.required
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            value={formData[field.id] as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <select
            {...commonProps}
            value={formData[field.id] as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          >
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
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="mr-2"
                  required={field.required}
                />
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
                <input
                  type="checkbox"
                  value={option}
                  onChange={(e) => {
                    const currentValues = (formData[field.id] as string || '').split(',').filter(v => v);
                    if (e.target.checked) {
                      currentValues.push(option);
                    } else {
                      const index = currentValues.indexOf(option);
                      if (index > -1) currentValues.splice(index, 1);
                    }
                    handleInputChange(field.id, currentValues.join(','));
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0] || null)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={field.required}
              accept={field.label.toLowerCase().includes('photo') ? 'image/*' : '.pdf,.jpg,.jpeg,.png'}
            />
            {formData[field.id] && (
              <p className="text-sm text-green-600">
                Fichier sélectionné: {(formData[field.id] as File).name}
              </p>
            )}
          </div>
        );
      
      default:
        return (
          <input
            type={field.type}
            {...commonProps}
            value={formData[field.id] as string || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        );
    }
  };

  const renderStep = () => {
    if (showFormSelection || !selectedForm) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Choisissez votre type d'inscription</h3>
          
          {availableForms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {availableForms.map((form) => (
                <div
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Disponible
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    {form.title}
                  </h4>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {form.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{form.fields.length} champs à remplir</span>
                    <span>{form.filieres?.length || 0} filière{(form.filieres?.length || 0) > 1 ? 's' : ''}</span>
                  </div>
                  
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200">
                    Commencer cette inscription
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Aucun formulaire d'inscription disponible pour le moment.</p>
              <p className="text-sm text-gray-400 mt-2">
                Les formulaires d'inscription seront bientôt disponibles. Contactez l'administration pour plus d'informations.
              </p>
            </div>
          )}
        </div>
      );
    }

    const fieldsPerStep = 6;
    const formSteps = Math.ceil(selectedForm.fields.length / fieldsPerStep);
    const isFilieresStep = currentStep === formSteps + 1 && selectedForm.filieres.length > 0;
    const isConfirmationStep = currentStep === totalSteps;




// Dans la partie de code qui gère l'étape de confirmation (isConfirmationStep)
if (isConfirmationStep) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Confirmation</h3>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-4">Récapitulatif de votre inscription</h4>
        <div className="space-y-3">
          {selectedForm.fields
            .sort((a, b) => a.order - b.order)
            .slice(0, 10) // Augmenté de 8 à 10 pour afficher plus de champs
            .map((field) => {
              const value = formData[field.id];
              // Afficher tous les champs sauf les fichiers
              if (value && field.type !== 'file') {
                return (
                  <div key={field.id} className="flex justify-between">
                    <span className="font-medium text-gray-700">{field.label}:</span>
                    <span className="text-gray-900">{value as string}</span>
                  </div>
                );
              }
              return null;
            })}
          
          {/* Ajouter spécifiquement l'année d'obtention du diplôme si elle existe */}
          {formData['annee_obtention'] && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Année d'obtention du diplôme:</span>
              <span className="text-gray-900">{formData['annee_obtention'] as string}</span>
            </div>
          )}
          
          {formData['annee-obtention'] && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Année d'obtention du diplôme:</span>
              <span className="text-gray-900">{formData['annee-obtention'] as string}</span>
            </div>
          )}
          
          {formData['annee_obtention_diplome'] && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Année d'obtention du diplôme:</span>
              <span className="text-gray-900">{formData['annee_obtention_diplome'] as string}</span>
            </div>
          )}
          
          {formData['annee-diplome'] && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Année d'obtention du diplôme:</span>
              <span className="text-gray-900">{formData['annee-diplome'] as string}</span>
            </div>
          )}
          
          {selectedForm.filieres.length > 0 && formData.selectedFiliere && (
            <>
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">1er Choix - Filière:</span>
                <span className="text-gray-900">
                  {selectedForm.filieres.find(f => f.id === formData.selectedFiliere)?.name}
                </span>
              </div>
              {formData.selectedMention && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">1er Choix - Mention:</span>
                  <span className="text-gray-900">{formData.selectedMention}</span>
                </div>
              )}
              
              {/* Deuxième choix */}
              {formData.selectedFiliere2 && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">2ème Choix - Filière:</span>
                    <span className="text-gray-900">
                      {selectedForm.filieres.find(f => f.id === formData.selectedFiliere2)?.name}
                    </span>
                  </div>
                  {formData.selectedMention2 && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">2ème Choix - Mention:</span>
                      <span className="text-gray-900">{formData.selectedMention2}</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-800 text-sm">
          Vérifiez vos informations avant de soumettre votre inscription.
        </p>
      </div>
    </div>
  );
}



    

   /*if (isConfirmationStep) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Confirmation</h3>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-4">Récapitulatif de votre inscription</h4>
            <div className="space-y-3">
              {selectedForm.fields
                .sort((a, b) => a.order - b.order)
                .slice(0, 8)
                .map((field) => {
                  const value = formData[field.id];
                  if (value && field.type !== 'file') {
                    return (
                      <div key={field.id} className="flex justify-between">
                        <span className="font-medium text-gray-700">{field.label}:</span>
                        <span className="text-gray-900">{value as string}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              
              {selectedForm.filieres.length > 0 && formData.selectedFiliere && (
                <>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">1er Choix - Filière:</span>
                    <span className="text-gray-900">
                      {selectedForm.filieres.find(f => f.id === formData.selectedFiliere)?.name}
                    </span>
                  </div>
                  {formData.selectedMention && (
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">1er Choix - Mention:</span>
                      <span className="text-gray-900">{formData.selectedMention}</span>
                    </div>
                  )}*/
                  
                  {/* Deuxième choix 
                  {formData.selectedFiliere2 && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">2ème Choix - Filière:</span>
                        <span className="text-gray-900">
                          {selectedForm.filieres.find(f => f.id === formData.selectedFiliere2)?.name}
                        </span>
                      </div>
                      {formData.selectedMention2 && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">2ème Choix - Mention:</span>
                          <span className="text-gray-900">{formData.selectedMention2}</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              Vérifiez vos informations avant de soumettre votre inscription.
            </p>
          </div>
        </div>
      );
    }*/}

    if (isFilieresStep) {
      return (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Choix de Filières et Mentions</h3>
          
          <div className="space-y-6">
            {/* Premier choix de filière */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                1er Choix de Filière <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedForm.filieres.map((filiere) => (
                  <div
                    key={filiere.id}
                    onClick={() => {
                      // Logique identique au deuxième choix
                      if (formData.selectedFiliere === filiere.id) {
                        // Si déjà sélectionné, ouvrir le modal pour changer la mention
                        setSelectedFiliereForModal(filiere);
                        setShowMentionModal(true);
                      } else {
                        // Nouvelle sélection, sélectionner la filière et ouvrir le modal
                        handleInputChange('selectedFiliere', filiere.id);
                        handleInputChange('selectedMention', ''); // Reset mention
                        setSelectedFiliereForModal(filiere);
                        setShowMentionModal(true);
                      }
                    }}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      formData.selectedFiliere === filiere.id
                        ? 'border-blue-500 bg-blue-50'
                        : fieldErrors['selectedFiliere'] 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {filiere.name}
                    </h4>
                    <div className="text-sm text-gray-600 mb-3">
                      {filiere.mentions.length} mention{filiere.mentions.length > 1 ? 's' : ''} disponible{filiere.mentions.length > 1 ? 's' : ''}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {filiere.mentions.slice(0, 3).map((mention, index) => (
                        <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          {mention}
                        </span>
                      ))}
                      {filiere.mentions.length > 3 && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          +{filiere.mentions.length - 3} autres
                        </span>
                      )}
                    </div>
                    {formData.selectedFiliere === filiere.id && (
                      <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">1er Choix Sélectionné</div>
                        {formData.selectedMention && (
                          <div className="text-sm text-blue-700">Mention: {formData.selectedMention}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {fieldErrors['selectedFiliere'] && (
                <div className="mt-4 text-red-600 text-sm bg-red-50 px-4 py-2 rounded border border-red-200">
                  {fieldErrors['selectedFiliere']}
                </div>
              )}
              
              {formData.selectedFiliere && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, selectedFiliere: '', selectedMention: '' }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Supprimer le 1er choix
                  </button>
                </div>
              )}
            </div>

            {/* Deuxième choix de filière (optionnel) */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                2ème Choix de Filière <span className="text-red-500">*</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedForm.filieres
                  .filter(filiere => filiere.id !== formData.selectedFiliere)
                  .map((filiere) => (
                    <div
                      key={filiere.id}
                      onClick={() => {
                        // Logique identique au premier choix
                        if (formData.selectedFiliere2 === filiere.id) {
                          // Si déjà sélectionné, ouvrir le modal pour changer la mention
                          setSelectedFiliereForModal(filiere);
                          setShowMentionModal(true);
                        } else {
                          // Nouvelle sélection, sélectionner la filière et ouvrir le modal
                          handleInputChange('selectedFiliere2', filiere.id);
                          handleInputChange('selectedMention2', ''); // Reset mention
                          setSelectedFiliereForModal(filiere);
                          setShowMentionModal(true);
                        }
                      }}
                      className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        formData.selectedFiliere2 === filiere.id
                          ? 'border-green-500 bg-green-50'
                          : fieldErrors['selectedFiliere2'] 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-200 hover:border-green-300'
                      }`}
                    >
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {filiere.name}
                      </h4>
                      <div className="text-sm text-gray-600 mb-3">
                        {filiere.mentions.length} mention{filiere.mentions.length > 1 ? 's' : ''} disponible{filiere.mentions.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {filiere.mentions.slice(0, 3).map((mention, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {mention}
                          </span>
                        ))}
                        {filiere.mentions.length > 3 && (
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            +{filiere.mentions.length - 3} autres
                          </span>
                        )}
                      </div>
                      {formData.selectedFiliere2 === filiere.id && (
                        <div className="mt-3 p-2 bg-green-100 rounded-lg">
                          <div className="text-sm font-medium text-green-900">2ème Choix Sélectionné</div>
                          {formData.selectedMention2 && (
                            <div className="text-sm text-green-700">Mention: {formData.selectedMention2}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
              
              {fieldErrors['selectedFiliere2'] && (
                <div className="mt-4 text-red-600 text-sm bg-red-50 px-4 py-2 rounded border border-red-200">
                  {fieldErrors['selectedFiliere2']}
                </div>
              )}
              
              {formData.selectedFiliere2 && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, selectedFiliere2: '', selectedMention2: '' }));
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Supprimer le 2ème choix
                  </button>
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sélectionnez votre <strong>premier choix</strong> de filière (obligatoire)</li>
                <li>• Sélectionnez votre <strong>deuxième choix</strong> de filière (obligatoire)</li>
                <li>• Cliquez sur une filière pour voir ses mentions et faire votre sélection</li>
                <li>• Les deux choix sont obligatoires pour compléter votre inscription</li>
                <li>• Vous pouvez modifier vos choix en cliquant à nouveau sur une filière</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    // Étapes des champs du formulaire
    const startIndex = (currentStep - 1) * fieldsPerStep;
    const endIndex = startIndex + fieldsPerStep;
    const currentFields = selectedForm.fields
      .sort((a, b) => a.order - b.order)
      .slice(startIndex, endIndex);

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Étape {currentStep} - Informations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentFields.map((field) => (
            <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="relative">
                {renderFieldInput(field)}
                {fieldErrors[field.id] && (
                  <div className="absolute -bottom-6 left-0 text-red-600 text-sm bg-red-50 px-2 py-1 rounded border border-red-200">
                    {fieldErrors[field.id]}
                  </div>
                )}
              </div>
              {fieldErrors[field.id] && <div className="h-6"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <section className="py-20 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Inscription Soumise avec Succès !
            </h2>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-800 font-semibold">
                Votre Identifiant : <span className="text-blue-900 font-bold">{studentMatricule}</span>
              </p>
              <p className="text-blue-700 text-sm mt-1">
                Conservez précieusement ce numéro, il vous sera demandé pour toutes vos démarches.
              </p>
            </div>
            
            <p className="text-xl text-gray-600 mb-8"> 
              Cliquer sur Télécharger formulaire et imprimer le, rendez-vous à la Direction des Services Académiques avec ce document, vos dossiers physiques et le bordereau de paiement d’inscription délivré par la Banque.
            </p>

            <button
              onClick={generatePDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
            >
              <Download className="h-5 w-5" />
              <span>Télécharger formulaire</span>
            </button>

            <p className="text-sm text-gray-500 mt-6">
              ISTM - KIN
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modal des conditions d'inscription */}
        {showConditionsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white py-2">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Étapes d'inscription, frais éxigés et conditions d'admission
                  </h2>
                  <button 
                    onClick={() => setShowConditionsModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Étapes d'inscription</h3>
                    <ol className="list-decimal pl-5 space-y-2 text-blue-800">
                      <li>Payez les frais d'inscription</li>
                      <li>Remplir le formulaire d'inscription sur le site www.istm-kinshasa.ac.cd (voir les conditions d'admission)</li>
                      <li>Imprimer le formulaire généré par le système</li>
                      <li>Déposer le formulaire que vous avez imprimé, ainsi que vos documents physiques à la Direction des Services Académiques</li>
                    </ol>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
  <h3 className="text-lg font-semibold text-green-900 mb-2">Les Frais exigés :</h3>
  <ul className="list-disc pl-5 space-y-2 text-green-800">
    <li><strong>52$</strong>: Pour les candidats ayant obtenu moins de 60% et ceux des filières : Sciences Infirmières, Sage-femme et Biologie médicale (quel que soit le pourcentage obtenu aux Examens d'Etat).</li>
    <li><strong>42$</strong>: Pour les candidats ayant obtenu 60% des points et plus.</li>
  </ul>
  <p className="mt-3 text-green-800">
    Ces frais seront payés par voie bancaire dans les comptes ci-après :
  </p>
  <ul className="list-disc pl-5 mt-2 text-green-800">
    <li><strong>Rawbank</strong> : compte n°01045039401-82</li>
    <li><strong>Equity BCDC</strong> : compte n°00011041010000117109820</li>
  </ul>
</div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Conditions d'admission</h3>
                    
                    <div className="space-y-6">
                      {/* Licence LMD */}
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">1) Licence LMD :</h4>
                        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                          <h5 className="font-medium text-yellow-900 mb-2">📌 Conditions d'admission</h5>
                          <ul className="list-disc pl-5 space-y-1 text-yellow-800">
                            <li>Être porteur d'un diplôme d'État ou équivalent ;</li>
                            <li>Les candidats ayant obtenu 60 % des points et plus sont admis d'office, sauf les sections des Sciences Infirmières, Sage-Sage et Biologie Médicale où le concours est obligatoire quel que soit le pourcentage obtenu aux examens d'État ;</li>
                            <li>Les candidats ayant obtenu de 50 à 59 % des points sont admis après passation du concours et être classés en ordre utile ;</li>
                            <li>Avoir déposé un dossier physique complet à la DIRSAC, contenant les éléments ci-après :</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Documents requis :</h5>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>Farde chemise avec logo de l'ISTM-Kin à retirer sur place ;</li>
                            <li>Formulaire d'inscription dûment rempli, soumis en ligne et imprimé ;</li>
                            <li>Certificat d'aptitude physique (délivré au centre de santé ISTM-Kin) ;</li>
                            <li>Photocopie du diplôme d'État ou équivalent authentifié à la DIRSAC ;</li>
                            <li>Photocopie de la carte d'identité ;</li>
                            <li>Deux photos passeport ;</li>
                            <li>Certificat de bonne conduite, vie & mœurs ;</li>
                            <li>Attestation de naissance ;</li>
                            <li>Photocopie des bulletins 5ème et 6ème ;</li>
                            <li>Photocopie des bulletins 3ème et 4ème pour les candidats A2.</li>
                          </ul>
                        </div>
                      </div>

                      {/* MASTER */}
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">2) MASTER</h4>
                        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                          <h5 className="font-medium text-yellow-900 mb-2">📌 Conditions d'admission (Deuxième cycle)</h5>
                          <ul className="list-disc pl-5 space-y-1 text-yellow-800">
                            <li>Avoir déposé un dossier complet contenant les éléments ci-après :</li>
                            <li>Avoir obtenu le diplôme de licence (LMD) et être classé en ordre utile au test d'admission ;</li>
                            <li>Être gradué en techniques médicales et avoir réussi l'année de passerelle ;</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Documents requis :</h5>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>Farde chemise avec logo de l'ISTM-Kin à retirer sur place ;</li>
                            <li>Formulaire d'inscription dûment rempli, soumis en ligne et imprimé ;</li>
                            <li>Photocopie du diplôme d'État ou équivalent authentifié à la DIRSAC ;</li>
                            <li>Photocopie du diplôme de 1er Cycle (Graduat ou Licence LMD), authentifié à la DIRSAC ;</li>
                            <li>Relevés de notes du 1er Cycle ;</li>
                            <li>Photocopie de la carte d'identité (Carte d'étudiant, carte d'électeur, passeport, permis de conduire…) ;</li>
                            <li>Certificat d'aptitude physique (délivré au centre de santé ISTM-Kin) ;</li>
                            <li>Deux photos passeport ;</li>
                            <li>Certificat de bonne conduite, vie & mœurs ;</li>
                            <li>Attestation de naissance.</li>
                          </ul>
                        </div>
                      </div>

                      {/* PASSERELLE */}
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">3) PASSERELLE</h4>
                        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                          <h5 className="font-medium text-yellow-900 mb-2">📌 Conditions d'admission</h5>
                          <ul className="list-disc pl-5 space-y-1 text-yellow-800">
                            <li>Être porteur de diplôme de Graduat en Techniques médicales.</li>
                            <li>Être classé en ordre utile au concours d'admission (pour les gradués provenant d'autres établissements et ceux de l'ISTM/Kinshasa qui changent de filières).</li>
                            <li>Les candidats gradués de l'ISTM/Kinshasa, qui poursuivent la même filière sont admis d'office.</li>
                            <li>Avoir déposé un dossier complet contenant les éléments ci-après :</li>
                          </ul>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Documents requis :</h5>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            <li>Farde chemise avec logo de l'ISTM-Kin à retirer sur place ;</li>
                            <li>Formulaire d'inscription dûment rempli, soumis en ligne et imprimé ;</li>
                            <li>Photocopie du diplôme d'État ou équivalent authentifié à la DIRSAC ;</li>
                            <li>Photocopie du diplôme de 1er Cycle (Graduat), authentifié à la DIRSAC ;</li>
                            <li>Relevés de Notes du 1er Cycle ;</li>
                            <li>Photocopie de la carte d'identité (Carte d'étudiant, carte d'électeur, passeport, permis de conduire, …) ;</li>
                            <li>Certificat d'aptitude Physique (délivré au centre de santé ISTM-KIN) ;</li>
                            <li>Deux photos passeport ;</li>
                            <li>Certificat de bonne conduite, vie et mœurs ;</li>
                            <li>Attestation de naissance.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => setShowConditionsModal(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
                  >
                    S'inscrire maintenant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src="https://i.postimg.cc/CKRW0X1B/freepik-hand-drawn-online-tutoring-logo-20250521140425s-Emd.png" 
              alt="Logo ISTM Kinshasa" 
              className="w-25 h-20 object-contain"
              onError={(e) => {
                // Fallback si l'image ne charge pas
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement!;
                parent.innerHTML = '<div class="w-20 h-20 flex items-center justify-center"><span class="text-blue-600 font-bold text-2xl">ISTM</span></div>';
              }}
            />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Formulaire d'Inscription ISTM Kinshasa
          </h2>
          <p className="text-xl text-gray-600">
            Rejoignez l'Institut Supérieur des Techniques Médicales de Kinshasa
          </p>
        </div>

        {selectedForm && (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedForm.title}</h3>
                <button
                  onClick={() => {
                    setSelectedFormId('');
                    setSelectedForm(null);
                    setShowFormSelection(true);
                    setCurrentStep(1);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ← Changer de formulaire
                </button>
              </div>
              <div className="flex items-center justify-center space-x-4 mb-4">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                  <React.Fragment key={step}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step <= currentStep 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step}
                    </div>
                    {step < totalSteps && (
                      <div className={`w-16 h-1 ${
                        step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-center text-gray-600">
                Étape {currentStep} sur {totalSteps}
              </div>
            </div>
          </>
        )}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}

          {/* Navigation Buttons */}
          {selectedForm && (
            <div className="flex justify-between mt-12">
              <button
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>

              {currentStep < totalSteps ? (
                <button
                  onClick={() => {
                    if (validateCurrentStep()) {
                      setCurrentStep(Math.min(totalSteps, currentStep + 1));
                    }
                  }}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || hasSubmitted}
                  className={`px-8 py-3 rounded-lg font-semibold transition-colors duration-200 ${
                    isSubmitting || hasSubmitted 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Soumission en cours...</span>
                    </div>
                  ) : hasSubmitted ? (
                    'Déjà soumis'
                  ) : (
                    'Soumettre l\'inscription'
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Écran de chargement pendant la soumission */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center max-w-md">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Soumission en cours...</h3>
              <p className="text-gray-600">
                Veuillez patienter pendant que nous enregistrons votre inscription.
              </p>
              <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⏳ Vérification des données et sauvegarde en cours...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal de sélection des mentions */}
        {showMentionModal && selectedFiliereForModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Choisir une mention
                  </h2>
                  <button 
                    onClick={() => {
                      setShowMentionModal(false);
                      setSelectedFiliereForModal(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedFiliereForModal.name}
                  </h3>
                  <p className="text-gray-600">
                    Sélectionnez la mention/département qui vous intéresse dans cette filière :
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-6">
                  {selectedFiliereForModal.mentions.map((mention, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        // Déterminer si c'est pour le premier ou deuxième choix
                        const isSecondChoice = formData.selectedFiliere && 
                          selectedFiliereForModal.id !== formData.selectedFiliere;
                        
                        if (isSecondChoice) {
                          handleInputChange('selectedFiliere2', selectedFiliereForModal.id);
                          handleInputChange('selectedMention2', mention);
                        } else {
                          // Ne pas changer la filière si elle est déjà sélectionnée, juste la mention
                          handleInputChange('selectedMention', mention);
                        }
                        
                        setShowMentionModal(false);
                        setSelectedFiliereForModal(null);
                      }}
                      className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                    >
                      <div className="font-medium text-gray-900">{mention}</div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      setShowMentionModal(false);
                      setSelectedFiliereForModal(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RegistrationSection;