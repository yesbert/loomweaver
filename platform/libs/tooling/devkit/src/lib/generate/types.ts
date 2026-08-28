import { Amendment } from '../amend/types';

export type FileMap = Readonly<Record<string, string>>;

export interface Recipe<Input> {
  readonly id: string;
  build(input: Input): FileMap;
  /**
   * What the workspace around the generated files must carry for them to work. A recipe that needs
   * nothing omits this, and every route then behaves exactly as it did before amendments existed.
   */
  amend?(input: Input): readonly Amendment[];
}
