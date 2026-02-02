import { generateShopName } from './shop-name.util';

describe('generateShopName', () => {
  it('should convert English-only to lowercase', () => {
    expect(generateShopName('MyBrand')).toBe('mybrand');
    expect(generateShopName('ASSEMBLIER')).toBe('assemblier');
  });

  it('should remove spaces', () => {
    expect(generateShopName('My Brand Store')).toBe('mybrandstore');
    expect(generateShopName('  Test  Brand  ')).toBe('testbrand');
  });

  it('should remove Korean characters and keep English', () => {
    expect(generateShopName('피키 assemblier')).toBe('assemblier');
    expect(generateShopName('한글브랜드English')).toBe('english');
    expect(generateShopName('Piki Assem')).toBe('pikiassem');
  });

  it('should remove special characters', () => {
    expect(generateShopName('My Brand!')).toBe('mybrand');
    expect(generateShopName('@Brand#2023')).toBe('brand2023');
    expect(generateShopName('test-brand_store')).toBe('testbrandstore');
  });

  it('should prefix with "shop" if starts with number', () => {
    expect(generateShopName('123brand')).toBe('shop123brand');
    expect(generateShopName('456Shop')).toBe('shop456shop');
    expect(generateShopName('789')).toBe('shop789');
  });

  it('should generate "shop" + random number for empty result', () => {
    const result1 = generateShopName('');
    expect(result1).toMatch(/^shop\d{6}$/);

    const result2 = generateShopName('   ');
    expect(result2).toMatch(/^shop\d{6}$/);

    const result3 = generateShopName('한글만');
    expect(result3).toMatch(/^shop\d{6}$/);

    const result4 = generateShopName('!@#$%');
    expect(result4).toMatch(/^shop\d{6}$/);
  });

  it('should truncate to maximum 24 characters', () => {
    const longName = 'thisisaverylongbrandnamethatshouldbetruncated';
    const result = generateShopName(longName);
    expect(result).toBe('thisisaverylongbrandname');
    expect(result.length).toBe(24);
  });

  it('should handle mixed cases correctly', () => {
    expect(generateShopName('MyBrand123')).toBe('mybrand123');
    expect(generateShopName('TEST店铺')).toBe('test');
  });

  it('should handle numbers in the middle', () => {
    expect(generateShopName('brand123shop')).toBe('brand123shop');
    expect(generateShopName('test2024store')).toBe('test2024store');
  });

  it('should be idempotent for already valid names', () => {
    expect(generateShopName('validshop')).toBe('validshop');
    expect(generateShopName('brand2023')).toBe('brand2023');
  });
});
