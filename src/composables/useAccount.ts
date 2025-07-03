import { computed } from 'vue';
import { useAccountStore } from '@/stores/account';

export const useAccount = () => {
    const store = useAccountStore();
    const accounts = computed(() => store.accounts);
    const loading = computed(() => store.loading);
    const error = computed(() => store.error);

    const fetchAccounts = async () => {
        await store.fetchAccounts();
    };

    return { accounts, loading, error, fetchAccounts };
};
