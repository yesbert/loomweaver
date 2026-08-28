export interface ThemeGeneratorSchema {
  name: string;
  preset?: 'literal' | 'bootstrap';
  app?: string;
}
