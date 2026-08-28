export interface WeaverGeneratorSchema {
  id: string;
  name?: string;
  command?: boolean;
  menu?: string;
  settings?: boolean;
  access?: string;
  shortcut?: string;
  barItem?: boolean;
  about?: boolean;
  instanceable?: boolean;
  container?: boolean;
  spec?: boolean;
  directory?: string;
  projectName?: string;
  importPath?: string;
  tags?: string;
  prefix?: string;
  app?: string;
  unitTestRunner?: 'vitest' | 'none';
}
