export class User {
  constructor(
    public readonly userId: string,
    public email: string,
    public password: string,
    public role: string,
  ) {}

  updateEmail(newEmail: string) {
    this.email = newEmail;
  }

  updatePassword(newPassword: string) {
    this.password = newPassword;
  }

  updateRole(newRole: string) {
    this.role = newRole;
  }
}
