// src/utils/pdfGenerator.ts

import { InventoryEquipe, InventoryMagasin, InventoryRessource } from '@/models/InventoryDetail';
import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { logger } from '@/services/loggerService';

interface Comptage {
    mode?: string;
    count_mode?: string;
    isVariant?: boolean;
    useScanner?: boolean;
    useSaisie?: boolean;
    champs_actifs?: string[];
}





interface InventoryData {
    inventory: {
        label: string;
        reference: string;
        inventory_date: string;
        statut: string;
        contages?: Comptage[];
        teams?: InventoryEquipe[];
    };
    magasins?: InventoryMagasin[];
    resources?: InventoryRessource[];
}

export const generatePDF = async (data: InventoryData, filename: string) => {
    const doc = new jsPDF({ unit: 'pt' });
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let cursorY = 50;

    // Palette de couleurs professionnelle et moderne - monochrome avec accent subtil
    const colors = {
        text: [30, 30, 30] as [number, number, number], // Noir foncé pour le texte principal
        textSecondary: [100, 100, 100] as [number, number, number], // Gris moyen pour texte secondaire
        textLight: [150, 150, 150] as [number, number, number], // Gris clair pour texte tertiaire
        accent: [60, 60, 60] as [number, number, number], // Gris foncé pour accents
        background: [250, 250, 250] as [number, number, number], // Gris très clair pour fonds
        border: [220, 220, 220] as [number, number, number], // Gris clair pour bordures
        white: [255, 255, 255] as [number, number, number],
        // Pour les statuts, utiliser des nuances de gris
        statusDefault: [180, 180, 180] as [number, number, number],
        statusActive: [100, 100, 100] as [number, number, number]
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
            logger.warn('Logo non trouvé, utilisation du texte par défaut', error);
            return false;
        }
    };

    // Fonction pour ajouter pied de page professionnel et minimaliste
    const addFooter = () => {
        const page = doc.getCurrentPageInfo().pageNumber;
        const totalPages = doc.getNumberOfPages();
        const currentDate = new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Ligne de séparation fine
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.5);
        doc.line(50, pageHeight - 40, pageWidth - 50, pageHeight - 40);

        // Informations de pied de page
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);

        // Date de génération à gauche
        doc.text(`Généré le ${currentDate}`, 50, pageHeight - 25);

        // Numéro de page à droite
        const footerText = `${page} / ${totalPages}`;
        const textWidth = doc.getTextWidth(footerText);
        doc.text(footerText, pageWidth - textWidth - 50, pageHeight - 25);
    };

    // Vérification saut de page
    const checkPage = (heightNeeded: number) => {
        if (cursorY + heightNeeded > pageHeight - 80) {
            doc.addPage();
            cursorY = 40;
        }
    };

    // Fonction pour dessiner une section avec style moderne et minimaliste
    const drawSectionHeader = (title: string, y: number) => {
        // Fond très léger
        doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
        doc.rect(50, y - 18, pageWidth - 100, 28, 'F');

        // Ligne d'accent fine en haut
        doc.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        doc.setLineWidth(2);
        doc.line(50, y - 18, pageWidth - 50, y - 18);

        // Titre en gras
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text(title.toUpperCase(), 60, y + 2);

        // Petite ligne de séparation sous le titre
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.5);
        doc.line(60, y + 8, pageWidth - 60, y + 8);

        return y + 25;
    };

    // Fonction pour créer une carte d'information moderne et épurée
    const createInfoCard = (title: string, value: string, x: number, y: number, width: number) => {
        // Fond blanc avec bordure subtile
        doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(x, y, width, 50, 4, 4, 'FD');

        // Titre en petit et gris
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text(title.toUpperCase(), x + 12, y + 14);

        // Valeur en grand et foncé
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text(value, x + 12, y + 35);
    };

    // Fonction pour créer un badge de statut moderne et sobre
    const createStatusBadge = (status: string, x: number, y: number) => {
        // Badge avec fond gris et bordure
        doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.setLineWidth(1);
        doc.roundedRect(x, y, 100, 22, 3, 3, 'FD');

        // Texte du badge en gras
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.text(status, x + 50, y + 14, { align: 'center' });
    };

    // --- EN-TÊTE MODERNE ET PROFESSIONNEL ---
    await addLogo();

    // Titre principal en grand et gras
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text('Rapport d\'Inventaire', pageWidth / 2, 70, { align: 'center' });

    // Sous-titre (label de l'inventaire)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text(data.inventory.label, pageWidth / 2, 95, { align: 'center' });

    cursorY = 120;

    // Ligne de séparation fine et moderne
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(1);
    doc.line(50, cursorY, pageWidth - 50, cursorY);
    cursorY += 35;

    // --- SECTION GÉNÉRALE ---
    checkPage(140);
    cursorY = drawSectionHeader('Informations Générales', cursorY);

    // Cartes d'information
    const cardWidth = (pageWidth - 140) / 2;
    createInfoCard('Référence', data.inventory.reference, 60, cursorY, cardWidth);
    createInfoCard('Date d\'inventaire', new Date(data.inventory.inventory_date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }), 60 + cardWidth + 20, cursorY, cardWidth);
    cursorY += 70;

    // Statut avec badge
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
    doc.text('Statut:', 60, cursorY);
    createStatusBadge(data.inventory.statut, 120, cursorY - 16);
    cursorY += 45;

    // --- PARAMÈTRES DE COMPTAGE ---
    if (data.inventory.contages?.length) {
        checkPage(60 + data.inventory.contages.length * 80);
        cursorY = drawSectionHeader('Paramètres de Comptage', cursorY);

        data.inventory.contages.forEach((contage, index) => {
            // Carte moderne pour chaque comptage
            doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.5);
            doc.roundedRect(60, cursorY, pageWidth - 120, 70, 4, 4, 'FD');

            // Numéro du comptage en gras
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            doc.text(`${index + 1}${index === 0 ? 'er' : 'ème'} Comptage`, 75, cursorY + 18);

            // Mode de comptage - gérer la nouvelle structure
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.textSecondary[0], colors.textSecondary[1], colors.textSecondary[2]);
            const countMode = contage.count_mode || contage.mode || 'Non défini';
            doc.text(`Mode: ${countMode}`, 75, cursorY + 35);

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
                doc.setFontSize(8);
                doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
                const optionsText = extras.join(' • ');
                doc.text(`Options: ${optionsText}`, 75, cursorY + 50);
            }

            cursorY += 90;
        });
        cursorY += 25;
    }

    // --- MAGASINS ---
    checkPage(60);
    cursorY = drawSectionHeader('Magasins Associés', cursorY);

    if (data.magasins?.length) {
        data.magasins.forEach((mag, index) => {
            // Point de liste simple
            doc.setFillColor(colors.text[0], colors.text[1], colors.text[2]);
            doc.circle(70, cursorY + 10, 2, 'F');

            // Nom du magasin en gras
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            doc.text(mag.nom, 85, cursorY + 14);

            // Date du magasin (plus petit, en dessous)
            if (mag.date) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
                doc.text(new Date(mag.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                }), 85, cursorY + 28);
                cursorY += 35;
            } else {
                cursorY += 20;
            }
        });
    } else {
        // Message quand aucun magasin n'est associé
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text('Aucun magasin associé', 70, cursorY + 14);
        cursorY += 25;
    }
    cursorY += 30;

    // --- ÉQUIPES ASSIGNÉES ---
    checkPage(60);
    cursorY = drawSectionHeader('Équipes Assignées', cursorY);

    if (data.inventory.teams?.length) {
        data.inventory.teams.forEach((team, index) => {
            // Cercle simple pour avatar
            doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(1);
            doc.circle(70, cursorY + 10, 5, 'FD');

            // Initiale de l'équipe
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            const userName = team.user || (team as any).userObject?.username || '';
            const initiale = userName ? userName.charAt(0).toUpperCase() : '?';
            doc.text(initiale, 70, cursorY + 13, { align: 'center' });

            // Nom de l'équipe
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            const nomEquipe = userName || 'Utilisateur inconnu';
            doc.text(nomEquipe, 85, cursorY + 14);

            // Nombre de comptages si disponible
            if (team.nombre_comptage !== undefined) {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
                doc.text(`${team.nombre_comptage} comptage(s)`, 85, cursorY + 28);
                cursorY += 35;
            } else {
                cursorY += 25;
            }
        });
    } else {
        // Message quand aucune équipe n'est assignée
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text('Aucune équipe assignée', 70, cursorY + 14);
        cursorY += 25;
    }
    cursorY += 30;

    // --- RESSOURCES ---
    checkPage(100);
    cursorY = drawSectionHeader('Ressources', cursorY);

    if (data.resources?.length) {
        // Tableau des ressources avec style moderne et sobre
        const head = [['Nom', 'Référence', 'Quantité']];
        const body = data.resources.map(resource => [
            resource.ressource_nom || '-',
            resource.reference || resource.ressource_reference || '-',
            resource.quantity ? `${resource.quantity}` : '-'
        ]);

        const options: UserOptions = {
            startY: cursorY,
            head,
            body,
            styles: {
                fontSize: 9,
                cellPadding: 8,
                lineColor: [colors.border[0], colors.border[1], colors.border[2]],
                lineWidth: 0.5,
                textColor: [colors.text[0], colors.text[1], colors.text[2]]
            },
            theme: 'striped',
            headStyles: {
                fillColor: [colors.accent[0], colors.accent[1], colors.accent[2]],
                textColor: [colors.white[0], colors.white[1], colors.white[2]],
                halign: 'left',
                fontStyle: 'bold',
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [colors.background[0], colors.background[1], colors.background[2]]
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'left' },
                2: { halign: 'center' }
            }
        };

        autoTable(doc as any, options as any);
        const last = (doc as any).lastAutoTable;
        cursorY = last?.finalY ? last.finalY + 20 : cursorY + 40;
    } else {
        // Message quand aucune ressource n'est assignée
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
        doc.text('Aucune ressource assignée', 70, cursorY + 14);
        cursorY += 30;
    }

    cursorY += 30;

    // Ajout des pieds de page sur chaque page
    const totalPg = doc.getNumberOfPages();
    for (let i = 1; i <= totalPg; i++) {
        doc.setPage(i);
        addFooter();
    }

    // Enregistrement du PDF
    doc.save(`${filename}.pdf`);
};
