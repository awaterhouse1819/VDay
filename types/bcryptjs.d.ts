declare module "bcryptjs" {
  type Compare = (data: string, encrypted: string) => Promise<boolean>;
  type Hash = (data: string, saltOrRounds: string | number) => Promise<string>;

  interface Bcrypt {
    compare: Compare;
    hash: Hash;
  }

  const bcrypt: Bcrypt;
  export default bcrypt;
}
