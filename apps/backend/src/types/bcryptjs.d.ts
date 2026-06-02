declare module 'bcryptjs' {
  export function hash(data: string, saltOrRounds: number): Promise<string>;
  export function compareSync(data: string, encrypted: string): boolean;
}
