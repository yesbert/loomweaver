export type FileMap = Readonly<Record<string, string>>;

export interface Recipe<Input> {
  readonly id: string;
  build(input: Input): FileMap;
}
