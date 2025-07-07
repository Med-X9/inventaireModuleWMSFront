// src/utils/pdfGenerator.ts

import { InventoryMagasin, InventoryRessource } from '@/models/InventoryDetail';
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';

interface Comptage {
    mode?: string;
    count_mode?: string;
    isVariant?: boolean;
    useScanner?: boolean;
    useSaisie?: boolean;
    champs_actifs?: string[];
}



interface Team {
    id: number;
    name: string;
}

interface InventoryData {
    inventory: {
        label: string;
        reference: string;
        inventory_date: string;
        statut: string;
        contages?: Comptage[];
        teams?: Team[];
    };
    magasins?: InventoryMagasin[];
    resources?: InventoryRessource[];
}

export const generatePDF = async (data: InventoryData, filename: string) => {
    const doc = new jsPDF({ unit: 'pt' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let cursorY = 40;

    // Couleurs professionnelles
    const colors = {
        primary: [254, 205, 28] as [number, number, number], // Jaune doré #FECD1C
        secondary: [52, 73, 94] as [number, number, number], // Gris foncé
        accent: [230, 126, 34] as [number, number, number], // Orange
        success: [46, 204, 113] as [number, number, number], // Vert
        warning: [241, 196, 15] as [number, number, number], // Jaune
        danger: [231, 76, 60] as [number, number, number], // Rouge
        lightGray: [236, 240, 241] as [number, number, number], // Gris clair
        white: [255, 255, 255] as [number, number, number]
    };

    // Fonction pour ajouter le logo
    const addLogo = async () => {
        try {
            const logoUrl = '/assets/images/logo/logo.png';
            const img = new Image();
            img.src = logoUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            // Ajouter le logo en haut à gauche avec largeur > hauteur
            doc.addImage(img, 'PNG', 40, 20, 80, 40);
            return true;
        } catch (error) {
            console.warn('Logo non trouvé, utilisation du texte par défaut');
            return false;
        }
    };

    // Fonction pour ajouter pied de page professionnel
    const addFooter = () => {
        const page = doc.getCurrentPageInfo().pageNumber;
        const totalPages = doc.getNumberOfPages();
        const currentDate = new Date().toLocaleDateString('fr-FR');

        // Ligne de séparation
        doc.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        doc.setLineWidth(1);
        doc.line(40, pageHeight - 50, pageWidth - 40, pageHeight - 50);

        // Informations de pied de page
        doc.setFontSize(8);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);

        // Date de génération
        doc.text(`Généré le ${currentDate}`, 40, pageHeight - 35);

        // Numéro de page
        const footerText = `Page ${page} sur ${totalPages}`;
        const textWidth = doc.getTextWidth(footerText);
        doc.text(footerText, pageWidth - textWidth - 40, pageHeight - 35);

        // Nom de l'application
        const appName = 'Système de Gestion d\'Inventaire';
        const appNameWidth = doc.getTextWidth(appName);
        doc.text(appName, (pageWidth - appNameWidth) / 2, pageHeight - 35);
    };

    // Vérification saut de page
    const checkPage = (heightNeeded: number) => {
        if (cursorY + heightNeeded > pageHeight - 80) {
            doc.addPage();
            cursorY = 40;
        }
    };

    // Fonction pour dessiner une section avec fond coloré
    const drawSectionHeader = (title: string, y: number) => {
        // Fond coloré pour l'en-tête de section
        doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        doc.rect(40, y - 15, pageWidth - 80, 25, 'F');

        // Bordure
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.setLineWidth(2);
        doc.line(40, y - 15, pageWidth - 40, y - 15);

        // Titre
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(title, 50, y);

        return y + 20;
    };

    // Fonction pour créer une carte d'information
    const createInfoCard = (title: string, value: string, x: number, y: number, width: number) => {
        // Fond de la carte
        doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, width, 40, 3, 3, 'FD');

        // Titre
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text(title, x + 10, y + 12);

        // Valeur
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(value, x + 10, y + 28);
    };

    // Fonction pour créer un badge de statut
    const createStatusBadge = (status: string, x: number, y: number) => {
        const statusColors = {
            'EN PREPARATION': colors.warning,
            'EN REALISATION': colors.accent,
            'TERMINEE': colors.success,
            'CLOTUREE': colors.danger,
        };

        const color = statusColors[status.toLowerCase()] || colors.secondary;

        // Fond du badge
        doc.setFillColor(color[0], color[1], color[2]);
        doc.setDrawColor(color[0], color[1], color[2]);
        doc.roundedRect(x, y, 80, 20, 10, 10, 'F');

        // Texte du badge
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.text(status, x + 40, y + 12, { align: 'center' });
    };

    // --- EN-TÊTE PROFESSIONNEL ---
    await addLogo();

    // Titre principal
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text('Rapport d\'Inventaire', pageWidth / 2, 50, { align: 'center' });

    // Sous-titre
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(data.inventory.label, pageWidth / 2, 75, { align: 'center' });

    cursorY = 100;

    // Ligne de séparation décorative
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(3);
    doc.line(40, cursorY, pageWidth - 40, cursorY);
    cursorY += 30;

    // --- SECTION GÉNÉRALE ---
    checkPage(120);
    cursorY = drawSectionHeader('Informations Générales', cursorY);

    // Cartes d'information
    const cardWidth = (pageWidth - 120) / 2;
    createInfoCard('Référence', data.inventory.reference, 50, cursorY, cardWidth);
    createInfoCard('Date d\'inventaire', new Date(data.inventory.inventory_date).toLocaleDateString('fr-FR'), 50 + cardWidth + 20, cursorY, cardWidth);
    cursorY += 60;

    // Statut avec badge
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text('Statut:', 50, cursorY);
    createStatusBadge(data.inventory.statut, 120, cursorY - 15);
    cursorY += 40;

    // --- PARAMÈTRES DE COMPTAGE ---
    if (data.inventory.contages?.length) {
        checkPage(60 + data.inventory.contages.length * 30);
        cursorY = drawSectionHeader('Paramètres de Comptage', cursorY);

        data.inventory.contages.forEach((contage, index) => {
            // Carte pour chaque comptage
            doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
            doc.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(50, cursorY, pageWidth - 100, 50, 5, 5, 'FD');

            // Numéro du comptage
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.text(`Comptage ${index + 1}`, 60, cursorY + 15);

            // Mode de comptage - gérer la nouvelle structure
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);

            const countMode = contage.count_mode || contage.mode || 'Non défini';
            doc.text(`Mode: ${countMode}`, 60, cursorY + 30);

            // Options - gérer la nouvelle structure avec champs_actifs
            const extras: string[] = [];

            // Ancienne structure
            if (contage.isVariant) extras.push('Variantes');
            if (contage.useScanner) extras.push('Scanner');
            if (contage.useSaisie) extras.push('Saisie');

            // Nouvelle structure avec champs_actifs
            if (contage.champs_actifs && Array.isArray(contage.champs_actifs)) {
                extras.push(...contage.champs_actifs);
            }

            if (extras.length) {
                doc.text(`Options: ${extras.join(', ')}`, 60, cursorY + 45);
            }

            cursorY += 70;
        });
        cursorY += 20;
    }

    // --- MAGASINS ---
    checkPage(60);
    cursorY = drawSectionHeader('Magasins Associés', cursorY);

    if (data.magasins?.length) {
        data.magasins.forEach((mag, index) => {
            // Icône magasin
            doc.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
            doc.circle(60, cursorY + 8, 4, 'F');

            // Nom du magasin
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(mag.nom, 75, cursorY + 12);

            // Date du magasin (plus petit, en dessous)
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(`Date: ${new Date(mag.date).toLocaleDateString('fr-FR')}`, 75, cursorY + 25);

            cursorY += 35;
        });
    } else {
        // Message quand aucun magasin n'est associé
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text('Aucun magasin associé', 60, cursorY + 12);
    }
    cursorY += 40; // Marge supplémentaire après les magasins

    // --- ÉQUIPES ASSIGNÉES ---
    checkPage(60);
    cursorY = drawSectionHeader('Équipes Assignées', cursorY);

    if (data.inventory.teams?.length) {
        data.inventory.teams.forEach((team, index) => {
            // Avatar équipe
            doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.circle(60, cursorY + 8, 6, 'F');

            // Initiale de l'équipe
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
            doc.text(team.name.charAt(0).toUpperCase(), 60, cursorY + 12, { align: 'center' });

            // Nom de l'équipe
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
            doc.text(team.name, 75, cursorY + 12);

            cursorY += 25;
        });
    } else {
        // Message quand aucune équipe n'est assignée
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text('Aucune équipe assignée', 60, cursorY + 12);
    }
    cursorY += 40; // Marge supplémentaire après les équipes

    // --- RESSOURCES ---
            checkPage(100);
    cursorY = drawSectionHeader('Ressources', cursorY);

    if (data.resources?.length) {
        // Tableau des ressources avec style professionnel
        const head = [['Nom', 'Référence', 'Quantité']];
        const body = data.resources.map(resource => [
            resource.ressource_nom || '-',
            resource.reference || '-',
            resource.quantity ? `${resource.quantity}` : '-'
        ]);

            const options: UserOptions = {
                startY: cursorY,
                head,
                body,
                styles: {
                    fontSize: 9,
                    cellPadding: 5,
                    lineColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
                    lineWidth: 0.5
                },
                theme: 'grid',
                headStyles: {
                    fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
                    textColor: [colors.white[0], colors.white[1], colors.white[2]],
                    halign: 'center',
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [248, 249, 250]
                }
            };

            autoTable(doc as any, options as any);
            const last = (doc as any).lastAutoTable;
            cursorY = last?.finalY ? last.finalY + 20 : cursorY + 40;
    } else {
        // Message quand aucune ressource n'est assignée
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.text('Aucune ressource assignée', 60, cursorY + 12);
    }

            cursorY += 40;

    // Ajout des pieds de page sur chaque page
    const totalPg = doc.getNumberOfPages();
    for (let i = 1; i <= totalPg; i++) {
        doc.setPage(i);
        addFooter();
    }

    // Enregistrement du PDF
    doc.save(`${filename}.pdf`);
};
