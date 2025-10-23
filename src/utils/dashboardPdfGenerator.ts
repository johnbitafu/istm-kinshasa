import jsPDF from 'jspdf';
import type { FormSubmission } from '../lib/supabase';
import { getFieldValue } from './pdfGenerator';

interface StatsData {
  submissions: FormSubmission[];
}

interface FiliereStats {
  name: string;
  mentions: { [key: string]: number };
  total: number;
}

interface GenderStats {
  hommes: number;
  femmes: number;
}

interface DailyStats {
  date: string;
  count: number;
}

// Fonction helper pour charger le logo
const loadLogo = async (): Promise<string | null> => {
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

    const logoSize = 30;
    const scaleFactor = 4;
    canvas.width = logoSize * scaleFactor;
    canvas.height = logoSize * scaleFactor;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logoImg, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/png', 1.0);
  } catch (error) {
    console.warn('⚠️ Erreur chargement logo:', error);
    return null;
  }
};

export const generateDashboardPDF = async (data: StatsData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const primaryColor = '#1e40af';
  const secondaryColor = '#059669';
  const accentColor = '#dc2626';
  const textColor = '#333333';

  // Charger le logo une seule fois
  const logoDataURL = await loadLogo();

  // En-tête avec logo
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');

  if (logoDataURL) {
    doc.addImage(logoDataURL, 'PNG', 15, 7, 30, 30);
    console.log('✅ Logo ajouté au tableau de bord PDF');
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLEAU DE BORD DES INSCRIPTIONS', pageWidth/2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Institut Supérieur des Techniques Médicales de Kinshasa', pageWidth/2, 25, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Statistiques et analyse des inscriptions en ligne', pageWidth/2, 35, { align: 'center' });

  let yPos = 55;

  // Calculer les statistiques par filière et mention
  const filiereStats: { [key: string]: FiliereStats } = {};

  data.submissions.forEach(sub => {
    const filiere = sub.filiere_name || 'Non spécifiée';
    const mention = sub.mention || 'Aucune';

    if (!filiereStats[filiere]) {
      filiereStats[filiere] = {
        name: filiere,
        mentions: {},
        total: 0
      };
    }

    if (!filiereStats[filiere].mentions[mention]) {
      filiereStats[filiere].mentions[mention] = 0;
    }

    filiereStats[filiere].mentions[mention]++;
    filiereStats[filiere].total++;
  });

  // Statistiques par genre
  const genderStats: GenderStats = {
    hommes: 0,
    femmes: 0
  };

  data.submissions.forEach(sub => {
    const sexe = getFieldValue(sub.submission_data, ['Sexe', 'sexe', 'Genre', 'genre'])?.toLowerCase();
    if (sexe === 'masculin' || sexe === 'homme' || sexe === 'm') {
      genderStats.hommes++;
    } else if (sexe === 'féminin' || sexe === 'femme' || sexe === 'f') {
      genderStats.femmes++;
    }
  });

  // Statistiques temporelles
  const dailyStats: { [key: string]: number } = {};
  data.submissions.forEach(sub => {
    const date = new Date(sub.submitted_at).toISOString().split('T')[0];
    dailyStats[date] = (dailyStats[date] || 0) + 1;
  });

  const sortedDates = Object.keys(dailyStats).sort();
  const last7Days = sortedDates.slice(-7);

  // Section 1: Statistiques générales
  doc.setFillColor(primaryColor);
  doc.roundedRect(15, yPos, pageWidth - 30, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('STATISTIQUES GÉNÉRALES', 20, yPos + 7);
  yPos += 15;

  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const totalInscriptions = data.submissions.length;
  const approuves = data.submissions.filter(s => s.status === 'approved').length;
  const enAttente = data.submissions.filter(s => s.status === 'pending').length;
  const rejetes = data.submissions.filter(s => s.status === 'rejected').length;

  // Boîtes de statistiques
  const boxWidth = (pageWidth - 40) / 4;
  const boxHeight = 25;

  // Total
  doc.setFillColor(240, 249, 255);
  doc.roundedRect(15, yPos, boxWidth - 2, boxHeight, 2, 2, 'F');
  doc.setTextColor(primaryColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(totalInscriptions.toString(), 15 + boxWidth/2 - 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Total', 15 + boxWidth/2 - 2, yPos + 20, { align: 'center' });

  // Approuvés
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15 + boxWidth, yPos, boxWidth - 2, boxHeight, 2, 2, 'F');
  doc.setTextColor(secondaryColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(approuves.toString(), 15 + boxWidth * 1.5 - 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Approuvés', 15 + boxWidth * 1.5 - 2, yPos + 20, { align: 'center' });

  // En attente
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(15 + boxWidth * 2, yPos, boxWidth - 2, boxHeight, 2, 2, 'F');
  doc.setTextColor(180, 130, 20);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(enAttente.toString(), 15 + boxWidth * 2.5 - 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('En attente', 15 + boxWidth * 2.5 - 2, yPos + 20, { align: 'center' });

  // Rejetés
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(15 + boxWidth * 3, yPos, boxWidth - 2, boxHeight, 2, 2, 'F');
  doc.setTextColor(accentColor);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(rejetes.toString(), 15 + boxWidth * 3.5 - 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Rejetés', 15 + boxWidth * 3.5 - 2, yPos + 20, { align: 'center' });

  yPos += 35;

  // Section 2: Répartition par Genre
  doc.setFillColor(secondaryColor);
  doc.roundedRect(15, yPos, pageWidth - 30, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RÉPARTITION PAR GENRE', 20, yPos + 7);
  yPos += 15;

  const genderTotal = genderStats.hommes + genderStats.femmes;
  const hommesPercent = genderTotal > 0 ? ((genderStats.hommes / genderTotal) * 100).toFixed(1) : '0.0';
  const femmesPercent = genderTotal > 0 ? ((genderStats.femmes / genderTotal) * 100).toFixed(1) : '0.0';

  // Graphique à barres horizontales pour le genre
  const barHeight = 20;
  const barMaxWidth = pageWidth - 110;

  // Hommes
  doc.setFillColor(59, 130, 246);
  const hommesBarWidth = genderTotal > 0 ? (genderStats.hommes / genderTotal) * barMaxWidth : 0;
  doc.roundedRect(80, yPos, hommesBarWidth, barHeight, 2, 2, 'F');
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Hommes:', 20, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${genderStats.hommes} (${hommesPercent}%)`, 80 + barMaxWidth + 5, yPos + 13);

  yPos += 25;

  // Femmes
  doc.setFillColor(236, 72, 153);
  const femmesBarWidth = genderTotal > 0 ? (genderStats.femmes / genderTotal) * barMaxWidth : 0;
  doc.roundedRect(80, yPos, femmesBarWidth, barHeight, 2, 2, 'F');
  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Femmes:', 20, yPos + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${genderStats.femmes} (${femmesPercent}%)`, 80 + barMaxWidth + 5, yPos + 13);

  yPos += 35;

  // Section 3: Statistiques par Filière et Mention
  doc.setFillColor(primaryColor);
  doc.roundedRect(15, yPos, pageWidth - 30, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INSCRIPTIONS PAR FILIÈRE ET MENTION', 20, yPos + 7);
  yPos += 15;

  doc.setTextColor(textColor);
  doc.setFontSize(9);

  // Tableau des filières
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  let colorIndex = 0;

  Object.values(filiereStats).forEach((filiere) => {
    if (yPos > pageHeight - 50) {
      doc.addPage();
      yPos = 20;
    }

    const color = colors[colorIndex % colors.length];
    colorIndex++;

    // Nom de la filière
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(20, yPos, pageWidth - 40, 8, 2, 2, 'F');
    doc.setTextColor(primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${filiere.name} (${filiere.total} inscrits)`, 25, yPos + 5.5);
    yPos += 12;

    // Mentions de cette filière
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor);

    Object.entries(filiere.mentions).forEach(([mention, count]) => {
      const percent = ((count / filiere.total) * 100).toFixed(1);
      const barWidth = (count / filiere.total) * (pageWidth - 120);

      // Extraire les valeurs RGB de la couleur hex
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);

      doc.setFillColor(r, g, b);
      doc.roundedRect(100, yPos, barWidth, 6, 1, 1, 'F');

      doc.text(`${mention}:`, 30, yPos + 4.5);
      doc.text(`${count} (${percent}%)`, 100 + barWidth + 5, yPos + 4.5);

      yPos += 8;
    });

    yPos += 5;
  });

  // Nouvelle page pour les tendances
  doc.addPage();

  // En-tête page 2 avec logo
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');

  if (logoDataURL) {
    doc.addImage(logoDataURL, 'PNG', 15, 5, 20, 20);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TABLEAU DE BORD - Page 2', pageWidth/2, 18, { align: 'center' });

  yPos = 40;

  // Section 4: Performance des inscriptions (7 derniers jours)
  doc.setFillColor(secondaryColor);
  doc.roundedRect(15, yPos, pageWidth - 30, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PERFORMANCE DES INSCRIPTIONS EN LIGNE (7 DERNIERS JOURS)', 20, yPos + 7);
  yPos += 20;

  if (last7Days.length > 0) {
    // Graphique linéaire simple
    const graphHeight = 80;
    const graphWidth = pageWidth - 60;
    const graphX = 40;
    const graphY = yPos;

    // Axes
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(graphX, graphY, graphX, graphY + graphHeight);
    doc.line(graphX, graphY + graphHeight, graphX + graphWidth, graphY + graphHeight);

    // Trouver le max pour l'échelle
    const maxCount = Math.max(...last7Days.map(d => dailyStats[d]));
    const scale = maxCount > 0 ? graphHeight / maxCount : 1;

    // Tracer les points et lignes
    doc.setDrawColor(primaryColor);
    doc.setLineWidth(2);

    last7Days.forEach((date, i) => {
      const count = dailyStats[date];
      const x = graphX + (i * graphWidth) / (last7Days.length - 1 || 1);
      const y = graphY + graphHeight - (count * scale);

      // Point
      doc.setFillColor(primaryColor);
      doc.circle(x, y, 2, 'F');

      // Ligne vers le point suivant
      if (i < last7Days.length - 1) {
        const nextCount = dailyStats[last7Days[i + 1]];
        const nextX = graphX + ((i + 1) * graphWidth) / (last7Days.length - 1);
        const nextY = graphY + graphHeight - (nextCount * scale);
        doc.line(x, y, nextX, nextY);
      }

      // Étiquette de date
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      const dateLabel = new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      doc.text(dateLabel, x, graphY + graphHeight + 8, { align: 'center' });

      // Valeur
      doc.setFontSize(8);
      doc.setTextColor(primaryColor);
      doc.text(count.toString(), x, y - 5, { align: 'center' });
    });

    yPos += graphHeight + 20;
  } else {
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(10);
    doc.text('Aucune donnée disponible pour les 7 derniers jours', pageWidth/2, yPos + 20, { align: 'center' });
    yPos += 40;
  }

  // Statistiques supplémentaires
  doc.setFillColor(primaryColor);
  doc.roundedRect(15, yPos, pageWidth - 30, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('STATISTIQUES SUPPLÉMENTAIRES', 20, yPos + 7);
  yPos += 18;

  doc.setTextColor(textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const totalFilies = Object.keys(filiereStats).length;
  const avgPerFiliere = totalFilies > 0 ? (totalInscriptions / totalFilies).toFixed(1) : '0';
  const mostPopularFiliere = Object.values(filiereStats).reduce((max, f) => f.total > max.total ? f : max, { name: 'N/A', total: 0 });

  const stats = [
    { label: 'Nombre de filières proposées', value: totalFilies.toString() },
    { label: 'Moyenne d\'inscrits par filière', value: avgPerFiliere },
    { label: 'Filière la plus demandée', value: `${mostPopularFiliere.name} (${mostPopularFiliere.total})` },
    { label: 'Taux d\'approbation', value: totalInscriptions > 0 ? `${((approuves / totalInscriptions) * 100).toFixed(1)}%` : '0%' }
  ];

  stats.forEach(stat => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${stat.label}:`, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.value, 120, yPos);
    yPos += 8;
  });

  // Pied de page
  const footerY = pageHeight - 20;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, footerY, pageWidth - 15, footerY);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.text(`Document généré le ${dateGeneration}`, pageWidth/2, footerY + 8, { align: 'center' });
  doc.text('Institut Supérieur des Techniques Médicales de Kinshasa', pageWidth/2, footerY + 13, { align: 'center' });

  // Télécharger le PDF
  const fileName = `Tableau_Bord_Inscriptions_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
