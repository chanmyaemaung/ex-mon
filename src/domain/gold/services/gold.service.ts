import { Injectable } from "@nestjs/common";

@Injectable()
export class GoldService {
  async getLatest() {
    return "latest";
  }
}