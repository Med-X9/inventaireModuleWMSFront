// src/utils/pdfGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

interface Contage { mode: string; isVariant: boolean; useScanner: boolean; useSaisie: boolean; }
interface Job { name: string; status: string; date: string; operator: string; }
interface Team { id: number; name: string; }
interface InventoryData {
  inventory: { label: string; reference: string; inventory_date: string; statut: string; contages?: Contage[]; teams?: Team[]; };
  magasins?: string[];
  jobsData?: Record<string, Job[]>;
}

export const generatePDF = async (data: InventoryData, filename: string) => {
  const doc = new jsPDF({ unit: 'pt' });
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let cursorY = 40;

  // Fonction pour ajouter pied de page
  const addFooter = () => {
    const page = doc.getCurrentPageInfo().pageNumber;
    const totalPages = doc.getNumberOfPages();
    doc.setFontSize(8);
    const footerText = `Page ${page} sur ${totalPages}`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, pageWidth - textWidth - 40, pageHeight - 30);
  };

  // Vérification saut de page
  const checkPage = (heightNeeded: number) => {
    if (cursorY + heightNeeded > pageHeight - 60) {
      doc.addPage();
      cursorY = 40;
    }
  };

  // Ligne de séparation
  const drawLine = (y: number) => {
    doc.setLineWidth(0.5);
    doc.line(40, y, pageWidth - 40, y);
  };

  // --- EN-TÊTE ---
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.inventory.label, pageWidth / 2, cursorY, { align: 'left' });
  cursorY += 30;
  drawLine(cursorY);
  cursorY += 20;

  // --- SECTION GÉNÉRALE ---
  checkPage(60);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Détails généraux', 40, cursorY);
  cursorY += 18;

  // Infos inventaire
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Libellé: ${data.inventory.label}`, 40, cursorY);
  doc.text(`Reference: ${data.inventory.reference}`, pageWidth / 2, cursorY);
  cursorY += 16;
  doc.text(`Date: ${new Date(data.inventory.inventory_date).toLocaleDateString('fr-FR')}`, 40, cursorY);
  doc.text(`Statut: ${data.inventory.statut}`, pageWidth / 2, cursorY);
  cursorY += 24;
  drawLine(cursorY);
  cursorY += 20;

  // --- PARAMÈTRES DE COMPTAGE ---
  if (data.inventory.contages?.length) {
    checkPage(40 + data.inventory.contages.length * 20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Paramètres de comptage', 40, cursorY);
    cursorY += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.inventory.contages.forEach((contage, index) => {
      const extras: string[] = [];
      contage.isVariant && extras.push('Variantes');
      contage.useScanner && extras.push('Scanner');
      contage.useSaisie && extras.push('Saisie');
      doc.text(
        `Comptage ${index + 1}: Mode=${contage.mode}${extras.length ? ` (${extras.join(', ')})` : ''}`,
        50,
        cursorY
      );
      cursorY += 16;
    });
    cursorY += 12;
    drawLine(cursorY);
    cursorY += 20;
  }

  // --- MAGASINS ---
  if (data.magasins?.length) {
    checkPage(40 + data.magasins.length * 16);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Magasins associés', 40, cursorY);
    cursorY += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.magasins.forEach(mag => {
      doc.text(`• ${mag}`, 50, cursorY);
      cursorY += 14;
    });
    cursorY += 12;
    drawLine(cursorY);
    cursorY += 20;
  }

  // --- ÉQUIPES ASSIGNÉES ---
  if (data.inventory.teams?.length) {
    checkPage(40 + data.inventory.teams.length * 16);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Équipes assignées', 40, cursorY);
    cursorY += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    data.inventory.teams.forEach(team => {
      doc.text(`- ${team.name}`, 50, cursorY);
      cursorY += 14;
    });
    cursorY += 12;
    drawLine(cursorY);
    cursorY += 20;
  }

  // --- TÂCHES ET STATISTIQUES ---
  if (data.jobsData) {
    Object.entries(data.jobsData).forEach(([section, jobs]) => {
      if (!jobs?.length) return;

      // Titre section tâches
      checkPage(60);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Tâches - ${section}`, 40, cursorY);
      cursorY += 22;

      // Tableau tâches
      const head = [['Nom', 'Statut', 'Date', 'Opérateur']];
      const body = jobs.map(j => [j.name, j.status, j.date, j.operator]);
      const options: UserOptions = {
        startY: cursorY,
        head,
        body,
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [255, 204, 17], textColor: 20, halign: 'center' }
      };
      autoTable(doc as any, options as any);
      const last = (doc as any).lastAutoTable;
      cursorY = last?.finalY ? last.finalY + 20 : cursorY + 40;

      // Titre statistiques
      checkPage(40);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Statistiques', 40, cursorY);
      cursorY += 18;

      // Contenu statistiques
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const total = jobs.length;
      const completed = jobs.filter(j => j.status.toLowerCase() === 'terminé').length;
      const inProgress = jobs.filter(j => j.status.toLowerCase() === 'en cours').length;
      const pending = jobs.filter(j => j.status.toLowerCase() === 'en attente').length;
      doc.text(`Terminés: ${completed}`, 50, cursorY);
      cursorY += 14;
      doc.text(`En cours: ${inProgress}`, 50, cursorY);
      cursorY += 14;
      doc.text(`En attente: ${pending}`, 50, cursorY);
      cursorY += 24;
      drawLine(cursorY - 10);
      cursorY += 20;
    });
  }

  // Ajout des pieds de page sur chaque page
  const totalPg = doc.getNumberOfPages();
  for (let i = 1; i <= totalPg; i++) {
    doc.setPage(i);
    addFooter();
  }

  // Enregistrement du PDF
  doc.save(`${filename}.pdf`);
};