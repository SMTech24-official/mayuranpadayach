export type IBusinessFilterRequest = {
  name?: string | undefined;
  category?: string | undefined;
  subCategory?: string | undefined;
  address?: string | undefined;
  searchTerm?: string | undefined;
  priceRangeLower?: string | undefined;
  priceRangeUpper?: string | undefined; 
  rating?: number | undefined; 
  bookingDate?: Date | undefined;
  latitude?: string | undefined;
  longitude?: string | undefined; 
};