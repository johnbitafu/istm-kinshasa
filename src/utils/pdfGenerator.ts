import jsPDF from 'jspdf';
import QRCode from 'qrcode';

// Fonction utilitaire pour récupérer une valeur avec plusieurs variantes - EXPORTÉE
export const getFieldValue = (data: any, fieldNames: string[]): string => {
  for (const fieldName of fieldNames) {
    if (data[fieldName] !== undefined && data[fieldName] !== null && data[fieldName] !== '') {
      return String(data[fieldName]);
    }
  }
  return '';
};

interface StudentData {
  matricule: string;
  dateInscription: string;
  formTitle: string;
  formData: { [key: string]: string };
  filiere?: string;
  mention?: string;
  filiere2?: string;
  mention2?: string;
  provinceEcole?: string; // Nouveau champ ajouté

}

export const generateStudentPDF = async (studentData: StudentData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Couleurs institutionnelles
  const primaryColor = '#1e40af'; // Bleu foncé
  const secondaryColor = '#059669'; // Vert
  const textColor = '#333333'; // Gris foncé
  const lightBgColor = '#f3f4f6'; // Gris très clair
  
  // En-tête officiel avec fond
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 70, 'F');
  
  // Logo et bannière en-tête
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Titre République Démocratique du Congo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', pageWidth/2, 10, { align: 'center' });
  doc.text('MINISTERE DE L ENSEGNEMENT SUPERIEUR ET UNIVERSITAIRE ', pageWidth/2, 15, { align: 'center' });
  
  // Logo ISTM
  try {
    const logoUrl = '/basec.png';
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = logoUrl;
    
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Erreur de chargement du logo'));
      setTimeout(() => reject(new Error('Timeout chargement logo')), 5000);
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible de créer le contexte canvas');
    
    const logoSize = 25;
    const scaleFactor = 4;
    canvas.width = logoSize * scaleFactor;
    canvas.height = logoSize * scaleFactor;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
    
    const logoDataURL = canvas.toDataURL('image/png', 1.0);
    doc.addImage(logoDataURL, 'PNG', pageWidth/2 - logoSize/2, 30, logoSize, logoSize);
    
    console.log('✅ Logo ajouté au PDF avec succès');
  } catch (error) {
    console.warn('⚠️ Erreur chargement logo, utilisation du logo par défaut:', error);
    doc.setFillColor(255, 255, 255);
    doc.circle(pageWidth/2, 42, 12, 'F');
    doc.setFillColor(primaryColor);
    doc.circle(pageWidth/2, 42, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ISTM', pageWidth/2, 44, { align: 'center' });
  }
  
  // Titres institutionnels
  doc.setTextColor(primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES', pageWidth/2, 60, { align: 'center' });
  doc.text('DE KINSHASA', pageWidth/2, 67, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  doc.text('SERVICE DES INSCRIPTIONS', pageWidth/2, 75, { align: 'center' });
  
  // Ligne de séparation décorative
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.line(20, 82, pageWidth - 20, 82);
  
  // Encadré matricule et date
  doc.setFillColor(lightBgColor);
  doc.roundedRect(20, 88, pageWidth - 40, 15, 3, 3, 'F');
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Matricule: ${studentData.matricule}`, 30, 98);
  doc.text(`Date d'inscription: ${studentData.dateInscription}`, pageWidth - 30, 98, { align: 'right' });
  
  // Titre du document
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text(studentData.formTitle || 'FICHE D\'INSCRIPTION ÉTUDIANT', pageWidth/2, 115, { align: 'center' });
  
  // Position Y pour le contenu
  let yPosition = 125;
  
  // Organiser les données par sections logiques
  const sections = [
    {
      title: 'INFORMATIONS PERSONNELLES',
      fields: [
        { label: 'Nom', value: getFieldValue(studentData.formData, ['Nom', 'nom']) },
        { label: 'Post-Nom', value: getFieldValue(studentData.formData, ['Post-Nom', 'post-nom']) },
        { label: 'Prénom', value: getFieldValue(studentData.formData, ['Prénom', 'prenom']) },
        { label: 'Lieu de naissance', value: getFieldValue(studentData.formData, ['Lieu de naissance', 'lieu-naissance', 'lieu_naissance']) },
        { label: 'Date de naissance', value: getFieldValue(studentData.formData, ['Date de naissance', 'date-naissance', 'date_naissance']) },
        { label: 'Sexe', value: getFieldValue(studentData.formData, ['Sexe', 'sexe']) },
        { label: 'État civil', value: getFieldValue(studentData.formData, ['État civil', 'etat-civil', 'etat_civil']) },
        { label: 'Nationalité', value: getFieldValue(studentData.formData, ['Nationalité (Pays)', 'nationalite', 'Nationalité']) }
      ]
    },
    {
      title: 'CONTACT',
      fields: [
        { label: 'Adresse Kinshasa', value: getFieldValue(studentData.formData, ['Adresse Kinshasa', 'adresse-kinshasa', 'adresse_kinshasa']) },
        { label: 'Téléphone', value: getFieldValue(studentData.formData, ['Téléphone', 'telephone']) },
        { label: 'E-mail', value: getFieldValue(studentData.formData, ['E-mail', 'email']) }
      ]
    },


{
  title: 'DIPLÔME D\'ÉTAT',
  fields: [
    { 
      label: 'École', 
      value: getFieldValue(studentData.formData, ['Nom de l\'Ecole', 'nom-ecole', 'nom_ecole', 'ecole', 'Ecole', 'École', 'établissement', 'etablissement']) 
    },
    { 
      label: 'Province de l\'École', 
      value: studentData.provinceEcole || getFieldValue(studentData.formData, ['Province de l\'Ecole', 'province-ecole', 'province_ecole', 'province']) 
    },
    { 
      label: 'Section humanités', 
      value: getFieldValue(studentData.formData, ['Section suivie aux humanités', 'section-humanites', 'section_humanites', 'section', 'Option', 'option']) 
    },
    { 
      label: 'Année d\'obtention', 
      value: getFieldValue(studentData.formData, ['Année d\'obtention', 'Année d\'obtention ', 'annee-obtention', 'annee_obtention', 'annee', 'Année', 'année']) 
    },
    { 
      label: 'Pourcentage', 
      value: getFieldValue(studentData.formData, ['Pourcentage', 'Pourcentage ', 'pourcentage', 'Score', 'score']) + '%' 
    }
  ]
}

    
// Dans la section DIPLÔME D'ÉTAT, modifiez le champ Province de l'École JOBER
/*{
  title: 'DIPLÔME D\'ÉTAT',
  fields: [
    { label: 'École', value: getFieldValue(studentData.formData, ['Nom de l\'Ecole', 'nom-ecole', 'nom_ecole', 'ecole']) },
    { label: 'Province de l\'École', value: studentData.provinceEcole || getFieldValue(studentData.formData, ['Province de l\'Ecole', 'province-ecole', 'province_ecole', 'province']) },
    { label: 'Section humanités', value: getFieldValue(studentData.formData, ['Section suivie aux humanités', 'section-humanites', 'section_humanites', 'section']) },
    { label: 'Année d\'obtention', value: getFieldValue(studentData.formData, ['Année d\'obtention', 'Année d\'obtention ', 'annee-obtention', 'annee_obtention', 'annee']) },
    { label: 'Pourcentage', value: getFieldValue(studentData.formData, ['Pourcentage', 'Pourcentage ', 'pourcentage']) + '%' }
  ]
}*/



    
    /*{
      title: 'DIPLÔME D\'ÉTAT',
      fields: [
        { label: 'Nom de l\'École', value: getFieldValue(studentData.formData, ['Nom de l\'Ecole', 'nom-ecole', 'nom_ecole', 'ecole']) },
        { label: 'Province de l\'École', value: getFieldValue(studentData.formData, ['Province de l\'Ecole', 'province-ecole', 'province_ecole', 'province']) },
        { label: 'Section humanités', value: getFieldValue(studentData.formData, ['Section suivie aux humanités', 'section-humanites', 'section_humanites', 'section']) },
        { label: 'Année d\'obtention', value: getFieldValue(studentData.formData, ['Année d\'obtention', 'Année d\'obtention ', 'annee-obtention', 'annee_obtention', 'annee']) },
        { label: 'Pourcentage', value: getFieldValue(studentData.formData, ['Pourcentage', 'Pourcentage ', 'pourcentage']) + '%' }
      ]
    }*/
  ];

  // Ajouter les autres champs non catégorisés
  const categorizedFields = new Set();
  sections.forEach(section => {
    section.fields.forEach(field => {
      categorizedFields.add(field.label);
    });
  });

  const otherFields = Object.entries(studentData.formData)
    .filter(([key, value]) => 
      !categorizedFields.has(key) && 
      value !== undefined && 
      value !== null && 
      value !== '' &&
      !key.toLowerCase().includes('filiere') &&
      !key.toLowerCase().includes('mention') &&
      !key.toLowerCase().includes('choix') &&
      !key.toLowerCase().includes('section suivie aux hurfzmfd6glque') // Exclure le champ corrompu
    )
    .map(([key, value]) => ({ label: key, value: String(value) }));

  /*if (otherFields.length > 0) {
    sections.push({
      title: 'AUTRES INFORMATIONS',
      fields: otherFields
    });
  }*/

  // Générer les sections avec espacement réduit
  sections.forEach((section) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // En-tête de section avec style amélioré
    doc.setFillColor(primaryColor);
    doc.roundedRect(20, yPosition, pageWidth - 40, 8, 2, 2, 'F'); // Hauteur réduite
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 25, yPosition + 5.5); // Position ajustée
    yPosition += 12; // Espacement réduit

    // Champs de la section - chaque champ sur sa propre ligne
    doc.setTextColor(textColor);
    doc.setFontSize(10);

    section.fields.forEach((field) => {
      if (field.value && field.value.trim() !== '' && field.value !== '%') {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${field.label}:`, 25, yPosition);
        doc.setFont('helvetica', 'normal');

        // Gérer les textes longs
        const maxWidth = pageWidth - 60;
        const lines = doc.splitTextToSize(field.value, maxWidth);
        doc.text(lines, 25, yPosition + 5); // Décalage réduit

        // Ajuster la position Y en fonction du nombre de lignes
        yPosition += (lines.length * 5) + 5; // Espacement réduit
      }
    });

    yPosition += 8; // Espacement réduit entre les sections
  });
  
  // Section Filière (toujours affichée même si vide)
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }
  
  // En-tête de section filières
  doc.setFillColor(secondaryColor);
  doc.roundedRect(20, yPosition, pageWidth - 40, 8, 2, 2, 'F'); // Hauteur réduite
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CHOIX DE FILIÈRES', 25, yPosition + 5.5); // Position ajustée
  yPosition += 12; // Espacement réduit
  
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  
  // Premier choix
  if (studentData.filiere) {
    doc.setFont('helvetica', 'bold');
    doc.text('1er Choix:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Filière: ${studentData.filiere}`, 60, yPosition);
    yPosition += 6; // Espacement réduit
    
    if (studentData.mention) {
      doc.text(`Mention: ${studentData.mention}`, 60, yPosition);
      yPosition += 6; // Espacement réduit
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun premier choix spécifié', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 6; // Espacement réduit
  }
  
  yPosition += 4; // Espacement réduit
  
  // Deuxième choix
  if (studentData.filiere2) {
    doc.setFont('helvetica', 'bold');
    doc.text('2ème Choix:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Filière: ${studentData.filiere2}`, 60, yPosition);
    yPosition += 6; // Espacement réduit
    
    if (studentData.mention2) {
      doc.text(`Mention: ${studentData.mention2}`, 60, yPosition);
      yPosition += 6; // Espacement réduit
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun deuxième choix spécifié', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 6; // Espacement réduit
  }
  
  yPosition += 10; // Espacement réduit
  
  // Pied de page avec QR code
  const footerY = pageHeight - 40;
  
  // Ligne de séparation
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, footerY, pageWidth - 20, footerY);
  
  // Générer QR Code
  try {
    const qrData = `ISTM-${studentData.matricule}-${studentData.dateInscription}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 50,
      margin: 1,
      color: {
        dark: primaryColor,
        light: '#FFFFFF'
      }
    });
    
    // QR code en bas à droite
    doc.addImage(qrCodeDataURL, 'PNG', pageWidth - 45, footerY + 5, 25, 25);
    
    // Texte explicatif du QR code
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Code de vérification', pageWidth - 32.5, footerY + 32, { align: 'center' });
  } catch (error) {
    console.warn('Erreur génération QR code:', error);
  }
  
  // Informations institutionnelles
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('fr-FR');
  const timeStr = currentDate.toLocaleTimeString('fr-FR');
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(`Document généré le ${dateStr} à ${timeStr}`, pageWidth/2, footerY + 20, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Institut Supérieur des Techniques Médicales de Kinshasa', pageWidth/2, footerY + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Route Kimwenza, Vallée de la FUNA, Mont-Ngafula. Réf : en face du CNPP. Kinshasa, RDC | Tél: +243 977 127 160', pageWidth/2, footerY + 15, { align: 'center' });
  
  // Télécharger le PDF
  const nom = getFieldValue(studentData.formData, ['Nom', 'nom']);
  const postnom = getFieldValue(studentData.formData, ['Post-Nom', 'post-nom']);
  const fileName = `Inscription_${studentData.matricule}_${nom}_${postnom}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
};

export const generateMatricule = (): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const extraRandom = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const uniqueNum = (timestamp + extraRandom).slice(-4);
  return `ISTM${year}${uniqueNum}`;
};






/*import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface StudentData {
  matricule: string;
  dateInscription: string;
  formTitle: string;
  formData: { [key: string]: string };
  filiere?: string;
  mention?: string;
  filiere2?: string;
  mention2?: string;
  filiere2?: string;
  mention2?: string;
}

export const generateStudentPDF = async (studentData: StudentData): Promise<void> => {
  // Fonction utilitaire pour récupérer une valeur avec plusieurs variantes
  const getFieldValue = (data: any, fieldNames: string[]): string => {
    for (const fieldName of fieldNames) {
      if (data[fieldName] !== undefined && data[fieldName] !== null && data[fieldName] !== '') {
        return String(data[fieldName]);
      }
    }
    return '';
  };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Couleurs
  const primaryColor = '#000000'; // Bleu
  const secondaryColor = '#000000'; // Vert
  const textColor = '#000000'; // Gris foncé
  
  // En-tête officiel avec fond
  doc.setFillColor(255, 255, 255); // Bleu très clair
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  // Titre République Démocratique du Congo (en haut, centré, police réduite)
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', pageWidth/2, 12, { align: 'center' });
  
  // Logo ISTM (centré entre le titre du pays et le nom de l'institut)
  try {
    // Utiliser le logo local depuis public/basec.png avec haute qualité
    const logoUrl = '/basec.png';
    
    // Créer une image et la charger
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = logoUrl;
    
    // Attendre que l'image soit chargée
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Erreur de chargement du logo'));
      // Timeout après 5 secondes
      setTimeout(() => reject(new Error('Timeout chargement logo')), 5000);
    });
    
    // Créer un canvas pour convertir l'image en base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible de créer le contexte canvas');
    
    // Définir la taille du canvas avec très haute résolution
    const logoSize = 30; // Taille du logo en points PDF
    const scaleFactor = 8; // Facteur d'échelle pour haute qualité
    canvas.width = logoSize * scaleFactor;
    canvas.height = logoSize * scaleFactor;
    
    // Configurer le canvas pour une qualité optimale
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Dessiner l'image sur le canvas SANS fond blanc (transparence préservée)
    ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
    
    // Convertir en PNG avec qualité maximale (pas de compression JPEG)
    const logoDataURL = canvas.toDataURL('image/png', 1.0);
    
    // Ajouter le logo au PDF (centré horizontalement, entre les deux textes)
    const logoX = pageWidth/2 - logoSize/2; // Centré horizontalement
    const logoY = 12; // Position verticale entre les deux textes
    doc.addImage(logoDataURL, 'PNG', logoX, logoY, logoSize, logoSize);
    
    console.log('✅ Logo ajouté au PDF avec succès');
  } catch (error) {
    console.warn('⚠️ Erreur chargement logo, utilisation du logo par défaut:', error);
    
    // Logo par défaut (cercle bleu avec texte ISTM) si l'image ne charge pas
    doc.setFillColor(30, 64, 175);
    const logoSize = 15;
    const logoX = pageWidth/2;
    const logoY = 35;
    doc.circle(logoX, logoY, logoSize, 'F');
    
    // Texte ISTM en blanc au centre du cercle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ISTM', logoX, logoY + 2, { align: 'center' });
  }
  
  // Titres institutionnels (en bas du logo)
  doc.setTextColor(30, 64, 175);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES DE KINSHASA', pageWidth/2, 45, { align: 'center' });
 // doc.text('', pageWidth/2, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(5, 150, 105);
  doc.text('SERVICE DES INSCRIPTIONS', pageWidth/2, 50, { align: 'center' });
  
  // Ligne de séparation
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1.5);
  doc.line(15, 80, pageWidth - 15, 80);
  
  // Numéro matricule et date
  doc.setTextColor(textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Matricule: ${studentData.matricule}`, 15, 90);
  doc.text(`Date d'inscription: ${studentData.dateInscription}`, pageWidth - 15, 90, { align: 'right' });
  
  // Titre du document
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(studentData.formTitle || 'FICHE D\'INSCRIPTION ÉTUDIANT', pageWidth/2, 110, { align: 'center' });
  
  // Position Y pour le contenu
  let yPosition = 120;
  
  // Organiser les données par sections logiques
  const sections = [
    {
      title: 'INFORMATIONS PERSONNELLES',
      fields: [
        { label: 'Nom', value: getFieldValue(studentData.formData, ['Nom', 'nom']) },
        { label: 'Post-Nom', value: getFieldValue(studentData.formData, ['Post-Nom', 'post-nom']) },
        { label: 'Prénom', value: getFieldValue(studentData.formData, ['Prénom', 'prenom']) },
        { label: 'Lieu de naissance', value: getFieldValue(studentData.formData, ['Lieu de naissance', 'lieu-naissance', 'lieu_naissance']) },
        { label: 'Date de naissance', value: getFieldValue(studentData.formData, ['Date de naissance', 'date-naissance', 'date_naissance']) },
        { label: 'Sexe', value: getFieldValue(studentData.formData, ['Sexe', 'sexe']) },
        { label: 'État civil', value: getFieldValue(studentData.formData, ['État civil', 'etat-civil', 'etat_civil']) },
        { label: 'Nationalité', value: getFieldValue(studentData.formData, ['Nationalité (Pays)', 'nationalite', 'Nationalité']) }
      ]
    },
    {
      title: 'CONTACT',
      fields: [
        { label: 'Adresse Kinshasa', value: getFieldValue(studentData.formData, ['Adresse Kinshasa', 'adresse-kinshasa', 'adresse_kinshasa']) },
        { label: 'Téléphone', value: getFieldValue(studentData.formData, ['Téléphone', 'telephone']) },
        { label: 'E-mail', value: getFieldValue(studentData.formData, ['E-mail', 'email']) }
      ]
    },
    {
      title: 'DIPLÔME D\'ÉTAT',
      fields: [
        { label: 'École', value: getFieldValue(studentData.formData, ['Nom de l\'Ecole', 'nom-ecole', 'nom_ecole', 'ecole']) },
        { label: 'Province de l\'École', value: getFieldValue(studentData.formData, ['Province de l\'Ecole', 'province-ecole', 'province_ecole', 'province']) },
        { label: 'Section humanités', value: getFieldValue(studentData.formData, ['Section suivie aux humanités', 'section-humanites', 'section_humanites', 'section']) },
        { label: 'Année d\'obtention', value: getFieldValue(studentData.formData, ['Année d\'obtention', 'Année d\'obtention ', 'annee-obtention', 'annee_obtention', 'annee']) },
        { label: 'Pourcentage', value: getFieldValue(studentData.formData, ['Pourcentage', 'Pourcentage ', 'pourcentage']) + '%' }
      ]
    }
  ];

  // Ajouter les autres champs non catégorisés
  const categorizedFields = new Set();
  sections.forEach(section => {
    section.fields.forEach(field => {
      field.label.split(',').forEach(variant => categorizedFields.add(variant.trim()));
    });
  });

  const otherFields = Object.entries(studentData.formData)
    .filter(([key, value]) => 
      !categorizedFields.has(key) && 
      value !== undefined && 
      value !== null && 
      value !== '' &&
      !key.includes('filiere') &&
      !key.includes('mention') &&
      !key.includes('choix')
    )
    .map(([key, value]) => ({ label: key, value: String(value) }));

  if (otherFields.length > 0) {
    sections.push({
      title: 'AUTRES INFORMATIONS',
      fields: otherFields
    });
  }

  // Générer les sections
  sections.forEach((section, sectionIndex) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // En-tête de section
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 20, yPosition + 5);
    yPosition += 15;

    // Champs de la section
    doc.setTextColor(textColor);
    doc.setFontSize(9);

    section.fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '' && field.value !== '%') {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        const xPos = index % 2 === 0 ? 20 : pageWidth/2 + 10;
        if (index % 2 === 0 && index > 0) yPosition += 8;

        doc.setFont('helvetica', 'bold');
        doc.text(`${field.label}:`, xPos, yPosition);
        doc.setFont('helvetica', 'normal');

        // Gérer les textes longs
        const maxWidth = (pageWidth/2) - 70;
        const lines = doc.splitTextToSize(field.value, maxWidth);
        doc.text(lines, xPos + 50, yPosition);

        if (lines.length > 1) {
          yPosition += (lines.length - 1) * 5;
        }
      }
    });

    yPosition += 20;
  });
  
  // Section Filière (si présente)
  if (studentData.filiere) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F');
    doc.setTextColor(30, 64, 175);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('CHOIX DE FILIÈRES', 20, yPosition + 5);
    yPosition += 15;
    
    doc.setTextColor(textColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    doc.setFont('helvetica', 'bold');
    doc.text('1er Choix - Filière:', 20, yPosition);
    doc.setFont('helvetica', 'normal');
    const filiereLines = doc.splitTextToSize(studentData.filiere, pageWidth - 100);
    doc.text(filiereLines, 70, yPosition);
    yPosition += Math.max(filiereLines.length * 5, 8);
    
    if (studentData.mention) {
      doc.setFont('helvetica', 'bold');
      doc.text('1er Choix - Mention:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      const mentionLines = doc.splitTextToSize(studentData.mention, pageWidth - 100);
      doc.text(mentionLines, 70, yPosition);
      yPosition += Math.max(mentionLines.length * 5, 8);
    }
    
    // Deuxième choix de filière (si présent)
    if (studentData.filiere2 && studentData.filiere2.trim() !== '') {
      yPosition += 8; // Espacement
      
      doc.setFont('helvetica', 'bold');
      doc.text('2ème Choix - Filière:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      const filiere2Lines = doc.splitTextToSize(studentData.filiere2, pageWidth - 100);
      doc.text(filiere2Lines, 70, yPosition);
      yPosition += Math.max(filiere2Lines.length * 5, 8);
      
      if (studentData.mention2 && studentData.mention2.trim() !== '') {
        doc.setFont('helvetica', 'bold');
        doc.text('2ème Choix - Mention:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        const mention2Lines = doc.splitTextToSize(studentData.mention2, pageWidth - 100);
        doc.text(mention2Lines, 70, yPosition);
        yPosition += Math.max(mention2Lines.length * 5, 8);
      }
    }
  }
  
  // Bas de page officiel
  const footerY = pageHeight - 85; // 3cm = ~85 points
  
  // Ligne de séparation pour le pied de page
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.5);
  doc.line(15, footerY + 65, pageWidth - 15, footerY + 65);
  
  // Générer QR Code (coin droit en bas de page)
  try {
    const qrData = `ISTM-${studentData.matricule}-${Object.values(studentData.formData).slice(0, 2).join('-')}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 60,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // QR code en bas à droite
    doc.addImage(qrCodeDataURL, 'PNG', (pageWidth/2)-15, footerY + 30, 30, 30);
    
    // Texte explicatif du QR code
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Code QR de vérification',(pageWidth/2), footerY + 63, { align: 'center' });
  } catch (error) {
    console.warn('Erreur génération QR code:', error);
  }
  
  // Informations institutionnelles
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('fr-FR');
  const timeStr = currentDate.toLocaleTimeString('fr-FR');
  
  // Pied de page avec informations institutionnelles
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.text(`Document généré le ${dateStr} à ${timeStr}`, pageWidth/2, footerY +74, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Institut Supérieur des Techniques Médicales de Kinshasa', pageWidth/2, footerY + 68, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Avenue Université, Kinshasa - RDC | Tél: +243 977 127 160', pageWidth/2, footerY +71, { align: 'center' });
  
  // Télécharger le PDF
  const fileName = `Inscription_${studentData.matricule}_${Object.values(studentData.formData).slice(0, 2).join('_')}.pdf`;
  doc.save(fileName);
};

export const generateMatricule = (): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const extraRandom = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const uniqueNum = (timestamp + extraRandom).slice(-4);
  return `ISTM${year}${uniqueNum}`;
};*/



/*import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface StudentData {
  matricule: string;
  dateInscription: string;
  formTitle: string;
  formData: { [key: string]: string };
  filiere?: string;
  mention?: string;
  filiere2?: string;
  mention2?: string;
}

export const generateStudentPDF = async (studentData: StudentData): Promise<void> => {
  // Fonction utilitaire pour récupérer une valeur avec plusieurs variantes
  const getFieldValue = (data: any, fieldNames: string[]): string => {
    for (const fieldName of fieldNames) {
      if (data[fieldName] !== undefined && data[fieldName] !== null && data[fieldName] !== '') {
        return String(data[fieldName]);
      }
    }
    return '';
  };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Couleurs institutionnelles
  const primaryColor = '#1e40af'; // Bleu foncé
  const secondaryColor = '#059669'; // Vert
  const accentColor = '#dc2626'; // Rouge pour les éléments importants
  const textColor = '#333333'; // Gris foncé
  const lightBgColor = '#f3f4f6'; // Gris très clair
  
  // En-tête officiel avec fond
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 70, 'F');
  
  // Logo et bannière en-tête
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  // Titre République Démocratique du Congo
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', pageWidth/2, 10, { align: 'center' });
  
  // Logo ISTM
  try {
    const logoUrl = '/basec.png';
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.src = logoUrl;
    
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject(new Error('Erreur de chargement du logo'));
      setTimeout(() => reject(new Error('Timeout chargement logo')), 5000);
    });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Impossible de créer le contexte canvas');
    
    const logoSize = 25;
    const scaleFactor = 4;
    canvas.width = logoSize * scaleFactor;
    canvas.height = logoSize * scaleFactor;
    
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
    
    const logoDataURL = canvas.toDataURL('image/png', 1.0);
    doc.addImage(logoDataURL, 'PNG', pageWidth/2 - logoSize/2, 30, logoSize, logoSize);
    
    console.log('✅ Logo ajouté au PDF avec succès');
  } catch (error) {
    console.warn('⚠️ Erreur chargement logo, utilisation du logo par défaut:', error);
    doc.setFillColor(255, 255, 255);
    doc.circle(pageWidth/2, 42, 12, 'F');
    doc.setFillColor(primaryColor);
    doc.circle(pageWidth/2, 42, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ISTM', pageWidth/2, 44, { align: 'center' });
  }
  
  // Titres institutionnels
  doc.setTextColor(primaryColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INSTITUT SUPÉRIEUR DES TECHNIQUES MÉDICALES', pageWidth/2, 60, { align: 'center' });
  doc.text('DE KINSHASA', pageWidth/2, 67, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor);
  doc.text('SERVICE DES INSCRIPTIONS', pageWidth/2, 75, { align: 'center' });
  
  // Ligne de séparation décorative
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(1);
  doc.line(20, 82, pageWidth - 20, 82);
  
  // Encadré matricule et date
  doc.setFillColor(lightBgColor);
  doc.roundedRect(20, 88, pageWidth - 40, 15, 3, 3, 'F');
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Matricule: ${studentData.matricule}`, 30, 98);
  doc.text(`Date d'inscription: ${studentData.dateInscription}`, pageWidth - 30, 98, { align: 'right' });
  
  // Titre du document
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text(studentData.formTitle || 'FICHE D\'INSCRIPTION ÉTUDIANT', pageWidth/2, 115, { align: 'center' });
  
  // Position Y pour le contenu
  let yPosition = 125;
  
  // Organiser les données par sections logiques
  const sections = [
    {
      title: 'INFORMATIONS PERSONNELLES',
      fields: [
        { label: 'Nom', value: getFieldValue(studentData.formData, ['Nom', 'nom']) },
        { label: 'Post-Nom', value: getFieldValue(studentData.formData, ['Post-Nom', 'post-nom']) },
        { label: 'Prénom', value: getFieldValue(studentData.formData, ['Prénom', 'prenom']) },
        { label: 'Lieu de naissance', value: getFieldValue(studentData.formData, ['Lieu de naissance', 'lieu-naissance', 'lieu_naissance']) },
        { label: 'Date de naissance', value: getFieldValue(studentData.formData, ['Date de naissance', 'date-naissance', 'date_naissance']) },
        { label: 'Sexe', value: getFieldValue(studentData.formData, ['Sexe', 'sexe']) },
        { label: 'État civil', value: getFieldValue(studentData.formData, ['État civil', 'etat-civil', 'etat_civil']) },
        { label: 'Nationalité', value: getFieldValue(studentData.formData, ['Nationalité (Pays)', 'nationalite', 'Nationalité']) }
      ]
    },
    {
      title: 'CONTACT',
      fields: [
        { label: 'Adresse Kinshasa', value: getFieldValue(studentData.formData, ['Adresse Kinshasa', 'adresse-kinshasa', 'adresse_kinshasa']) },
        { label: 'Téléphone', value: getFieldValue(studentData.formData, ['Téléphone', 'telephone']) },
        { label: 'E-mail', value: getFieldValue(studentData.formData, ['E-mail', 'email']) }
      ]
    },
    {
      title: 'DIPLÔME D\'ÉTAT',
      fields: [
        { label: 'École', value: getFieldValue(studentData.formData, ['Nom de l\'Ecole', 'nom-ecole', 'nom_ecole', 'ecole']) },
        { label: 'Province de l\'École', value: getFieldValue(studentData.formData, ['Province de l\'Ecole', 'province-ecole', 'province_ecole', 'province']) },
        { label: 'Section humanités', value: getFieldValue(studentData.formData, ['Section suivie aux humanités', 'section-humanites', 'section_humanites', 'section']) },
        { label: 'Année d\'obtention', value: getFieldValue(studentData.formData, ['Année d\'obtention', 'Année d\'obtention ', 'annee-obtention', 'annee_obtention', 'annee']) },
        { label: 'Pourcentage', value: getFieldValue(studentData.formData, ['Pourcentage', 'Pourcentage ', 'pourcentage']) + '%' }
      ]
    }
  ];

  // Ajouter les autres champs non catégorisés
  const categorizedFields = new Set();
  sections.forEach(section => {
    section.fields.forEach(field => {
      categorizedFields.add(field.label);
    });
  });

  const otherFields = Object.entries(studentData.formData)
    .filter(([key, value]) => 
      !categorizedFields.has(key) && 
      value !== undefined && 
      value !== null && 
      value !== '' &&
      !key.toLowerCase().includes('filiere') &&
      !key.toLowerCase().includes('mention') &&
      !key.toLowerCase().includes('choix')
    )
    .map(([key, value]) => ({ label: key, value: String(value) }));

  if (otherFields.length > 0) {
    sections.push({
      title: 'AUTRES INFORMATIONS',
      fields: otherFields
    });
  }

  // Générer les sections
  sections.forEach((section) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    // En-tête de section avec style amélioré
    doc.setFillColor(primaryColor);
    doc.roundedRect(20, yPosition, pageWidth - 40, 10, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 25, yPosition + 7);
    yPosition += 15;

    // Champs de la section
    doc.setTextColor(textColor);
    doc.setFontSize(10);

    section.fields.forEach((field, index) => {
      if (field.value && field.value.trim() !== '' && field.value !== '%') {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Alternance entre deux colonnes
        const xPos = index % 2 === 0 ? 25 : pageWidth/2 + 5;
        if (index % 2 === 0 && index > 0) yPosition += 8;

        doc.setFont('helvetica', 'bold');
        doc.text(`${field.label}:`, xPos, yPosition);
        doc.setFont('helvetica', 'normal');

        // Gérer les textes longs
        const maxWidth = (pageWidth/2) - 40;
        const lines = doc.splitTextToSize(field.value, maxWidth);
        doc.text(lines, xPos + 35, yPosition);

        if (lines.length > 1) {
          yPosition += (lines.length - 1) * 5;
        }
        
        yPosition += 7;
      }
    });

    yPosition += 10;
  });
  
  // Section Filière (toujours affichée même si vide)
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }
  
  // En-tête de section filières
  doc.setFillColor(secondaryColor);
  doc.roundedRect(20, yPosition, pageWidth - 40, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CHOIX DE FILIÈRES', 25, yPosition + 7);
  yPosition += 15;
  
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  
  // Premier choix
  if (studentData.filiere) {
    doc.setFont('helvetica', 'bold');
    doc.text('1er Choix:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Filière: ${studentData.filiere}`, 60, yPosition);
    yPosition += 7;
    
    if (studentData.mention) {
      doc.text(`Mention: ${studentData.mention}`, 60, yPosition);
      yPosition += 7;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun premier choix spécifié', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 7;
  }
  
  yPosition += 5;
  
  // Deuxième choix
  if (studentData.filiere2) {
    doc.setFont('helvetica', 'bold');
    doc.text('2ème Choix:', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Filière: ${studentData.filiere2}`, 60, yPosition);
    yPosition += 7;
    
    if (studentData.mention2) {
      doc.text(`Mention: ${studentData.mention2}`, 60, yPosition);
      yPosition += 7;
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.text('Aucun deuxième choix spécifié', 25, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 7;
  }
  
  yPosition += 15;
  
  // Pied de page avec QR code
  const footerY = pageHeight - 50;
  
  // Ligne de séparation
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, footerY, pageWidth - 20, footerY);
  
  // Générer QR Code
  try {
    const qrData = `ISTM-${studentData.matricule}-${studentData.dateInscription}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      width: 60,
      margin: 1,
      color: {
        dark: primaryColor,
        light: '#FFFFFF'
      }
    });
    
    // QR code en bas à droite
    doc.addImage(qrCodeDataURL, 'PNG', pageWidth - 50, footerY + 5, 30, 30);
    
    // Texte explicatif du QR code
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Code de vérification', pageWidth - 35, footerY + 38, { align: 'center' });
  } catch (error) {
    console.warn('Erreur génération QR code:', error);
  }
  
  // Informations institutionnelles
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('fr-FR');
  const timeStr = currentDate.toLocaleTimeString('fr-FR');
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text(`Document généré le ${dateStr} à ${timeStr}`, pageWidth/2, footerY + 20, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Institut Supérieur des Techniques Médicales de Kinshasa', pageWidth/2, footerY + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Avenue Université, Kinshasa - RDC | Tél: +243 977 127 160', pageWidth/2, footerY + 15, { align: 'center' });
  
  // Télécharger le PDF
  const nom = getFieldValue(studentData.formData, ['Nom', 'nom']);
  const postnom = getFieldValue(studentData.formData, ['Post-Nom', 'post-nom']);
  const fileName = `Inscription_${studentData.matricule}_${nom}_${postnom}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
};

export const generateMatricule = (): string => {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const extraRandom = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const uniqueNum = (timestamp + extraRandom).slice(-4);
  return `ISTM${year}${uniqueNum}`;
};*/