import { ICellEditorComp, ICellEditorParams } from 'ag-grid-community';

export class MultiSelectCellEditor implements ICellEditorComp {
    private container!: HTMLElement;
    private value: string[] = [];
    private options: string[] = [];

    init(params: ICellEditorParams) {
        this.options = (params as any).options || [];

        // Initialiser la valeur depuis les paramètres
        if (typeof params.value === 'string') {
            this.value = params.value.split(',').map(s => s.trim()).filter(Boolean);
        } else if (Array.isArray(params.value)) {
            this.value = [...params.value];
        } else {
            this.value = [];
        }

        this.createEditor();
    }

    getGui() {
        return this.container;
    }

    getValue() {
        // Retourner une chaîne formatée au lieu d'un tableau
        // pour correspondre au type de données attendu par AG Grid
        return this.value.join(', ');
    }

    isPopup() {
        return true;
    }

    private createEditor() {
        this.container = document.createElement('div');
        this.container.className = 'multi-select-editor';
        this.container.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 8px;
            min-width: 200px;
            max-width: 300px;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;

        // Créer l'interface de l'éditeur
        this.container.innerHTML = `
            <div style="margin-bottom: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">Sélectionner les ressources:</div>
                <div id="selected-badges" style="margin-bottom: 8px; min-height: 20px;"></div>
            </div>
            <div style="margin-bottom: 8px;">
                <select id="resource-select" style="width: 100%; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
                    <option value="">Choisir une ressource...</option>
                    ${this.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                </select>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <button id="cancel-btn" style="padding: 4px 8px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 3px; cursor: pointer;">Annuler</button>
                <button id="save-btn" style="padding: 4px 8px; border: 1px solid #007bff; background: #007bff; color: white; border-radius: 3px; cursor: pointer;">Sauvegarder</button>
            </div>
        `;

        this.setupEventListeners();
        this.updateBadges();
    }

    private setupEventListeners() {
        const select = this.container.querySelector('#resource-select') as HTMLSelectElement;
        const saveBtn = this.container.querySelector('#save-btn') as HTMLButtonElement;
        const cancelBtn = this.container.querySelector('#cancel-btn') as HTMLButtonElement;

        select.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            const selectedValue = target.value;

            if (selectedValue && !this.value.includes(selectedValue)) {
                this.value.push(selectedValue);
                this.updateBadges();
                target.value = ''; // Reset select
            }
        });

        saveBtn.addEventListener('click', () => {
            // Sauvegarder les modifications
            this.onSave();
        });

        cancelBtn.addEventListener('click', () => {
            // Annuler les modifications
            this.onCancel();
        });
    }

    private updateBadges() {
        const badgesContainer = this.container.querySelector('#selected-badges') as HTMLElement;

        if (this.value.length === 0) {
            badgesContainer.innerHTML = '<span style="color: #999; font-style: italic;">Aucune ressource sélectionnée</span>';
            return;
        }

        badgesContainer.innerHTML = this.value.map(resource => `
            <span style="
                display: inline-block;
                background: #e3f2fd;
                color: #1976d2;
                padding: 2px 6px;
                margin: 2px;
                border-radius: 12px;
                font-size: 11px;
                position: relative;
            ">
                ${resource}
                <button onclick="this.removeBadge('${resource}')" style="
                    background: none;
                    border: none;
                    color: #1976d2;
                    cursor: pointer;
                    margin-left: 4px;
                    font-size: 10px;
                    padding: 0;
                " title="Supprimer">×</button>
            </span>
        `).join('');

        // Ajouter les event listeners pour les boutons de suppression
        badgesContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const badge = (e.target as HTMLElement).closest('span');
                if (badge) {
                    const resourceText = badge.textContent?.replace('×', '').trim();
                    if (resourceText) {
                        this.value = this.value.filter(r => r !== resourceText);
                        this.updateBadges();
                    }
                }
            });
        });
    }

    private onSave() {
        // Fermer l'éditeur et sauvegarder
        this.container.remove();
    }

    private onCancel() {
        // Fermer l'éditeur sans sauvegarder
        this.container.remove();
    }
}
