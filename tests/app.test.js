const { calculateNewQuantity, formatDate, formatDateKey } = require('../app');

describe('Frontend Logic', () => {
    
    describe('calculateNewQuantity', () => {
        test('should increment overtime by 0.25', () => {
            expect(calculateNewQuantity(0, 'add', 'overtime')).toBe(0.25);
            expect(calculateNewQuantity(1, 'add', 'overtime')).toBe(1.25);
        });

        test('should decrement overtime by 0.25', () => {
            expect(calculateNewQuantity(1, 'remove', 'overtime')).toBe(0.75);
        });

        test('should not decrement overtime below 0', () => {
            expect(calculateNewQuantity(0.1, 'remove', 'overtime')).toBe(0);
            expect(calculateNewQuantity(0, 'remove', 'overtime')).toBe(0);
        });

        test('should handle PM/Dusk special logic', () => {
            // First add starts at 4
            expect(calculateNewQuantity(0, 'add', 'pm-dusk')).toBe(4);
            // Subsequent adds increment by 1
            expect(calculateNewQuantity(4, 'add', 'pm-dusk')).toBe(5);
            
            // Remove decrements by 1
            expect(calculateNewQuantity(5, 'remove', 'pm-dusk')).toBe(4);
            // Don't go below 4 via remove button
            expect(calculateNewQuantity(4, 'remove', 'pm-dusk')).toBe(4);
        });
    });

    describe('Date Formatting', () => {
        test('formatDateKey should return YYYY-MM-DD', () => {
            const date = new Date(2023, 0, 15); // Jan 15 2023
            expect(formatDateKey(date)).toBe('2023-01-15');
        });

        test('formatDateKey should pad single digits', () => {
            const date = new Date(2023, 8, 5); // Sep 5 2023
            expect(formatDateKey(date)).toBe('2023-09-05');
        });

        test('formatDate should return readable string', () => {
            const date = new Date(2023, 10, 1); // Nov 1 2023
            expect(formatDate(date)).toBe('Wed 1 Nov');
        });
    });
});