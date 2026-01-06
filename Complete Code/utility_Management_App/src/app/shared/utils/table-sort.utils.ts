import { MatTableDataSource } from '@angular/material/table';

/**
 * Configures case-insensitive dictionary-style sorting for a MatTableDataSource.
 * This ensures that sorting is case-insensitive and lowercase letters come before
 * uppercase letters when they are the same letter (e.g., 'armaan' before 'Anita').
 * 
 * @param dataSource - The MatTableDataSource to configure
 */
export function configureCaseInsensitiveSort<T>(dataSource: MatTableDataSource<T>): void {
  dataSource.sortingDataAccessor = (item: T, property: string): string | number => {
    const value = (item as Record<string, unknown>)[property];
    
    // Handle null/undefined values - sort them to the end
    if (value === null || value === undefined) {
      return '';
    }
    
    // Handle string values - convert to lowercase for case-insensitive sorting
    // with lowercase letters coming before uppercase for the same letter
    if (typeof value === 'string') {
      if (value.length === 0) return '';
      
      const firstChar = value.charAt(0);
      // Check if first character is a letter and lowercase
      const isLowerCase = firstChar >= 'a' && firstChar <= 'z';
      const isUpperCase = firstChar >= 'A' && firstChar <= 'Z';
      
      if (isLowerCase || isUpperCase) {
        // Use '0' prefix for lowercase, '1' for uppercase to sort lowercase first
        const casePrefix = isLowerCase ? '0' : '1';
        return firstChar.toLowerCase() + casePrefix + value.slice(1).toLowerCase();
      }
      
      return value.toLowerCase();
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return value.getTime();
    }
    
    // Handle numbers and booleans directly
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    
    // For any other type, convert to string and lowercase
    return String(value).toLowerCase();
  };
}
