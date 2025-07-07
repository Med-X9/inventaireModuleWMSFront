import { ICellEditorComp, ICellEditorParams } from 'ag-grid-community';

export class MultiSelectCellEditor implements ICellEditorComp {
    private container: HTMLElement;
    private value: string[] = [];
    private originalValue: string[] = [];
    private options: string[] = [];
    private gridApi: any;

    init(params: ICellEditorParams) {
        this.container = document.createElement('div');
        this.options = params.options || [];
        this.gridApi = params.api;

        // Convertir la valeur en tableau
        if (Array.isArray(params.value)) {
            this.value = [...params.value];
            this.originalValue = [...params.value];
        } else if (typeof params.value === 'string' && params.value) {
            this.value = params.value.split(',').map(v => v.trim()).filter(Boolean);
            this.originalValue = [...this.value];
        } else {
            this.value = [];
            this.originalValue = [];
        }

        this.renderEditor();

        // Focus sur le select
        setTimeout(() => {
            const select = this.container.querySelector('select') as HTMLSelectElement;
            if (select) select.focus();
        }, 100);
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

    destroy() {
        // Cleanup si nécessaire
    }

    private renderEditor() {
        this.container.innerHTML = `
            <div class="multi-select-editor" style="
                position: relative;
                min-width: 200px;
                max-width: 300px;
                background: white;
                border: 2px solid #3b82f6;
                border-radius: 4px;
                padding: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                z-index: 1000;
            ">
                <div class="selected-items" style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    margin-bottom: 8px;
                ">
                    ${this.value.map((val, index) => `
                        <span class="selected-item" data-index="${index}" style="
                            display: inline-flex;
                            align-items: center;
                            background: #3b82f6;
                            color: white;
                            padding: 2px 6px;
                            border-radius: 12px;
                            font-size: 11px;
                            gap: 4px;
                        ">
                            ${val}
                            <button class="remove-btn" data-index="${index}" style="
                                background: none;
                                border: none;
                                color: white;
                                cursor: pointer;
                                font-size: 12px;
                                padding: 0;
                                width: 16px;
                                height: 16px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border-radius: 50%;
                            ">×</button>
                        </span>
                    `).join('')}
                </div>

                <select class="multi-select-input" style="
                    width: 100%;
                    padding: 4px 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 4px;
                    font-size: 12px;
                    background: white;
                    color: #374151;
                ">
                    <option value="">Ajouter des ressources...</option>
                    ${this.options.filter(option => !this.value.includes(option)).map(option => `
                        <option value="${option}">${option}</option>
                    `).join('')}
                </select>

                <div class="editor-actions" style="
                    display: flex;
                    gap: 4px;
                    margin-top: 8px;
                    justify-content: flex-end;
                ">
                    <button class="save-btn" style="
                        padding: 4px 8px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: bold;
                        background: #10b981;
                        color: white;
                    ">✓</button>
                    <button class="cancel-btn" style="
                        padding: 4px 8px;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: bold;
                        background: #ef4444;
                        color: white;
                    ">✕</button>
                </div>
            </div>
        `;

        // Ajouter les event listeners
        this.addEventListeners();
    }

    private addEventListeners() {
        // Boutons de suppression
        const removeButtons = this.container.querySelectorAll('.remove-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
                this.removeValue(index);
            });
        });

        // Select pour ajouter des ressources
        const select = this.container.querySelector('.multi-select-input') as HTMLSelectElement;
        if (select) {
            select.addEventListener('change', (e) => {
                this.onSelectChange(e);
            });
            select.addEventListener('keydown', (e) => {
                this.onKeyDown(e);
            });
        }

        // Bouton sauvegarder
        const saveBtn = this.container.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.onSave();
            });
        }

        // Bouton annuler
        const cancelBtn = this.container.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.onCancel();
            });
        }
    }

    private removeValue(index: number) {
        this.value.splice(index, 1);
        this.renderEditor();
    }

    private onSelectChange(event: Event) {
        const target = event.target as HTMLSelectElement;
        const selectedOption = target.value;

        if (selectedOption && !this.value.includes(selectedOption)) {
            this.value.push(selectedOption);
            target.value = ''; // Reset pour permettre une nouvelle sélection
            this.renderEditor();
        }
    }

    private onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.onSave();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            this.onCancel();
        }
    }

    private onSave() {
        // AG Grid va automatiquement récupérer la valeur via getValue()
        this.gridApi.stopEditing();
    }

    private onCancel() {
        // Restaurer les valeurs originales
        this.value = [...this.originalValue];
        this.gridApi.stopEditing();
    }
}
