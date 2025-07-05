import { defineStore } from 'pinia';
import { ref } from 'vue';
import { AccountService } from '@/services/AccountService';
import type { Account } from '@/models/Account';

export const useAccountStore = defineStore('account', () => {
    const accounts = ref<Account[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchAccounts = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await AccountService.getAll();
            accounts.value = response.data.data || [];
            console.log('💰 Accounts chargés:', accounts.value.length);
        } catch (err: any) {
            error.value = err.message || 'Erreur lors du chargement des comptes';
            accounts.value = []; // S'assurer que c'est toujours un tableau
            console.error('❌ Erreur chargement accounts:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return { accounts, loading, error, fetchAccounts };
});
