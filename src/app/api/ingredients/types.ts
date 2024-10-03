export interface Ingredient {
  name: string;
  unitPrice: number;
  unitQuantity: number;
  unitAvailability?: number;
  available: boolean;
}
