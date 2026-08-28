export interface DistributionGeneratorSchema {
  name: string;
  title?: string;
  styles?: 'tailwind' | 'precompiled';
  force?: boolean;
  directory?: string;
  tags?: string;
  prefix?: string;
  unitTestRunner?: 'vitest' | 'none';
}
