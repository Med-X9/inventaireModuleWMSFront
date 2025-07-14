import { CountingByArticle } from './CountingByArticle';
import { CountingByInBulk } from './CountingByInBulk';
import { CountingByStockImage } from './CountingByStockImage';
import type { Count } from '@/models/Count';

export class CountingDispatcher {
    private static byArticle = new CountingByArticle();
    private static byInBulk = new CountingByInBulk();
    private static byStockImage = new CountingByStockImage();

    /**
     * Valide un comptage selon son mode.
     * @throws CountingValidationError si les données sont invalides
     */
    static validateCount(data: Count): void {
        switch (data.count_mode) {
            case 'par article':
                this.byArticle.validateCount(data);
                break;
            case 'en vrac':
                this.byInBulk.validateCount(data);
                break;
            case 'image de stock':
                this.byStockImage.validateCount(data);
                break;
            default:
                throw new Error(`Mode de comptage inconnu : ${data.count_mode}`);
        }
    }
}
