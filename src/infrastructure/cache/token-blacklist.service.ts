import { Injectable } from '@nestjs/common';

@Injectable()
export class TokenBlacklistService {
  private readonly blacklist = new Set<string>();

  revoke(token: string) {
    this.blacklist.add(token);
  }

  isRevoked(token: string): boolean {
    return this.blacklist.has(token);
  }
}
